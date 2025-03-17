import type { Express, Request as ExpressRequest, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertMessageSchema, insertCartItemSchema, insertOrderSchema } from "@shared/schema";
import session from 'express-session';
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

// Extend Express Request to include session
interface Request extends ExpressRequest {
  session: session.Session & {
    userId?: number;
  };
}

// WebSocket connections by user ID
const connections: Map<number, WebSocket[]> = new Map();

// WebSocket message type
type WebSocketMessage = {
  type: string;
  data: any;
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  console.log("WebSocket server initialized on path: /ws");
  
  // Heartbeat to detect and clean up dead connections
  function heartbeat() {
    // @ts-ignore - adding custom property for ping tracking
    this.isAlive = true;
  }
  
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      // @ts-ignore - accessing custom property for ping tracking
      if (ws.isAlive === false) {
        console.log("Terminating inactive WebSocket connection");
        return ws.terminate();
      }
      
      // @ts-ignore - setting custom property for ping tracking
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  wss.on('connection', (ws, req) => {
    console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
    
    // @ts-ignore - setting custom property for ping tracking
    ws.isAlive = true;
    
    // Handle pong response as heartbeat
    ws.on('pong', heartbeat);
    
    let userId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle authentication
        if (parsedMessage.type === 'authenticate') {
          userId = parsedMessage.data.userId;
          console.log(`WebSocket authenticated for user ID: ${userId}`);
          
          // Add to connections map
          if (userId) {
            const userConnections = connections.get(userId) || [];
            
            // Clean up any dead connections for this user
            const activeConnections = userConnections.filter(conn => 
              conn.readyState === WebSocket.OPEN
            );
            
            // Add this connection
            activeConnections.push(ws);
            connections.set(userId, activeConnections);
            
            // Confirm successful authentication
            ws.send(JSON.stringify({
              type: 'auth_success',
              data: { userId }
            }));
          }
        }
        
        // Handle chat message
        if (parsedMessage.type === 'chat_message' && userId) {
          const validatedData = insertMessageSchema.parse(parsedMessage.data);
          console.log(`Received chat message from user ${userId} for conversation ${validatedData.conversationId}`);
          
          // Store the message
          const message = await storage.createMessage(validatedData);
          
          // Get the conversation to find relevant users
          const conversation = await storage.getConversation(message.conversationId);
          if (conversation && conversation.order) {
            // Get admin users (for the seller side)
            const adminUsers = Array.from((await storage.getUsers() || []))
              .filter(user => user.isAdmin);
            
            // Clients to notify: the sender, the order owner, and admins
            const notifyUserIds = new Set([
              userId, // Message sender
              conversation.order.userId, // Order owner
              ...adminUsers.map(admin => admin.id) // All admins
            ]);
            
            console.log(`Broadcasting message to ${notifyUserIds.size} users`);
            
            // Broadcast to all connected clients for those users
            for (const notifyUserId of notifyUserIds) {
              const userConnections = connections.get(notifyUserId) || [];
              let sentCount = 0;
              
              for (const conn of userConnections) {
                if (conn.readyState === WebSocket.OPEN) {
                  conn.send(JSON.stringify({
                    type: 'new_message',
                    data: message
                  }));
                  sentCount++;
                }
              }
              
              console.log(`Sent message to ${sentCount}/${userConnections.length} connections for user ${notifyUserId}`);
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            data: { message: 'Invalid message format' } 
          }));
        }
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket closed with code ${code}, reason: ${reason}`);
      
      // Remove from connections when disconnected
      if (userId) {
        const userConnections = connections.get(userId) || [];
        const index = userConnections.indexOf(ws);
        if (index !== -1) {
          userConnections.splice(index, 1);
          if (userConnections.length === 0) {
            connections.delete(userId);
            console.log(`Removed all connections for user ${userId}`);
          } else {
            connections.set(userId, userConnections);
            console.log(`User ${userId} has ${userConnections.length} remaining connections`);
          }
        }
      }
    });
  });
  
  // API Routes
  // All routes should be prefixed with /api
  
  // User routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating user' });
      }
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set user session (in a real app this would use JWT or sessions)
      // For simplicity, we'll use a basic session approach for demo
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Error during login' });
    }
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user' });
    }
  });
  
  // Product routes
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching products' });
    }
  });
  
  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Get product options
      const options = await storage.getProductOptions(productId);
      
      res.status(200).json({ ...product, options });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product' });
    }
  });
  
  // Cart routes
  app.get('/api/cart', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const cartItems = await storage.getCartItems(userId);
      
      // Enrich with product details
      const enrichedCart = await Promise.all(cartItems.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return {
          ...item,
          product
        };
      }));
      
      res.status(200).json(enrichedCart);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching cart' });
    }
  });
  
  app.post('/api/cart', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      const product = await storage.getProduct(cartItem.productId);
      
      res.status(201).json({
        ...cartItem,
        product
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid cart data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error adding to cart' });
      }
    }
  });
  
  app.put('/api/cart/:id', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (quantity === undefined || typeof quantity !== 'number') {
        return res.status(400).json({ message: 'Quantity is required and must be a number' });
      }
      
      const updatedItem = await storage.updateCartItem(itemId, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      
      const product = await storage.getProduct(updatedItem.productId);
      
      res.status(200).json({
        ...updatedItem,
        product
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating cart item' });
    }
  });
  
  app.delete('/api/cart/:id', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const itemId = parseInt(req.params.id);
      const removed = await storage.removeFromCart(itemId);
      
      if (!removed) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      
      res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
      res.status(500).json({ message: 'Error removing cart item' });
    }
  });
  
  app.delete('/api/cart', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      await storage.clearCart(userId);
      res.status(200).json({ message: 'Cart cleared' });
    } catch (error) {
      res.status(500).json({ message: 'Error clearing cart' });
    }
  });
  
  // Order routes
  app.get('/api/orders', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Check if admin - admins can see all orders
      const user = await storage.getUser(userId);
      const orders = await storage.getOrders(user?.isAdmin ? undefined : userId);
      
      // Enrich with some basic information
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const items = await storage.getOrderItems(order.id);
        return {
          ...order,
          itemCount: items.length
        };
      }));
      
      res.status(200).json(enrichedOrders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders' });
    }
  });
  
  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Check if user owns this order or is admin
      const user = await storage.getUser(userId);
      if (order.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      
      // Get order items
      const items = await storage.getOrderItems(orderId);
      
      // Enrich with product details
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return {
          ...item,
          product
        };
      }));
      
      res.status(200).json({
        ...order,
        items: enrichedItems
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching order' });
    }
  });
  
  app.post('/api/orders', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Validate order data
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId
      });
      
      // Get cart items to create order items
      const cartItems = await storage.getCartItems(userId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      
      // Create order items from cart
      const orderItems = await Promise.all(cartItems.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        
        // Calculate price based on product and options
        let price = 0;
        if (product) {
          // Base price (example: $5 = 500 cents)
          price = 500;
          
          // Add option modifiers
          const options = await storage.getProductOptions(product.id);
          for (const selectedOption of Object.values(item.options)) {
            const option = options.find(
              opt => opt.optionValue === selectedOption
            );
            if (option) {
              price += option.priceModifier;
            }
          }
        }
        
        return {
          productId: item.productId,
          quantity: item.quantity,
          price,
          options: item.options,
          customDesign: null
        };
      }));
      
      // Calculate total
      const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create the order
      const order = await storage.createOrder(
        { ...orderData, total }, 
        orderItems
      );
      
      // Clear the cart
      await storage.clearCart(userId);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating order' });
      }
    }
  });
  
  app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Check if admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to update order status' });
      }
      
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error updating order status' });
    }
  });
  
  // Conversation routes
  app.get('/api/conversations', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const conversations = await storage.getConversations(userId);
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching conversations' });
    }
  });
  
  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is participant (owner or admin)
      const user = await storage.getUser(userId);
      
      // Handle different conversation types
      if (conversation.isDirectChat) {
        // For direct chats, check if user is participant or admin
        if (conversation.userId !== userId && !user?.isAdmin) {
          return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }
      } else if (conversation.order) {
        // For order-related conversations, check if user owns the order or is admin
        if (conversation.order.userId !== userId && !user?.isAdmin) {
          return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }
      }
      
      // Return the conversation data
      res.status(200).json(conversation);
    } catch (error) {
      console.error('Error in /api/conversations/:id route:', error);
      res.status(500).json({ message: 'Error fetching conversation' });
    }
  });
  
  app.get('/api/orders/:orderId/conversation', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Check if user owns this order or is admin
      const user = await storage.getUser(userId);
      if (order.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this conversation' });
      }
      
      const conversation = await storage.getConversationByOrder(orderId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Get messages
      const messages = await storage.getMessages(conversation.id);
      
      res.status(200).json({
        ...conversation,
        messages
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching conversation' });
    }
  });
  
  app.post('/api/conversations', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    console.log(`Conversation creation request from IP: ${clientIp}, user ID: ${userId || 'not authenticated'}`);
    
    if (!userId) {
      console.log('Rejecting conversation creation: not authenticated');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const { subject } = req.body;
      
      console.log(`Creating conversation with subject: "${subject}"`);
      
      if (!subject || subject.trim() === '') {
        console.log('Rejecting conversation creation: subject is missing or empty');
        return res.status(400).json({ message: 'Subject is required' });
      }
      
      // Attempt to create the conversation
      const conversation = await storage.createNewConversation(userId, subject);
      
      console.log(`Successfully created conversation with ID: ${conversation.id}`);
      
      // Return the newly created conversation
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // More specific error message based on the error
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error creating conversation';
        
      res.status(500).json({ 
        message: 'Error creating conversation', 
        details: errorMessage
      });
    }
  });
  
  app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is participant (owner or admin)
      const user = await storage.getUser(userId);
      
      // For direct conversations, only the creator and admins can message
      if (conversation.isDirectChat) {
        if (conversation.userId !== userId && !user?.isAdmin) {
          return res.status(403).json({ message: 'Not authorized to message in this conversation' });
        }
      } 
      // For order conversations, only the order owner and admins can message
      else if (conversation.order && conversation.order.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to message in this conversation' });
      }
      
      // Create message
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
        userId
      });
      
      const message = await storage.createMessage(messageData);
      
      // Notify connected clients via WebSocket
      const notifyUserIds = new Set([userId]); // Always include message sender
      
      // For direct conversations, add admin users
      if (conversation.isDirectChat) {
        // Add all admin users if the sender is not an admin
        if (!user?.isAdmin) {
          const adminUsers = Array.from((await storage.getUsers()))
            .filter(u => u.isAdmin)
            .map(admin => admin.id);
          
          adminUsers.forEach(adminId => notifyUserIds.add(adminId));
        }
      }
      // For order conversations, add the order owner and admins
      else if (conversation.order) {
        notifyUserIds.add(conversation.order.userId); // Add order owner
        
        // Add admin users if sender is not an admin
        if (!user?.isAdmin) {
          const adminUsers = Array.from((await storage.getUsers()))
            .filter(u => u.isAdmin)
            .map(admin => admin.id);
          
          adminUsers.forEach(adminId => notifyUserIds.add(adminId));
        }
      }
      
      // Broadcast to all relevant connected clients
      for (const notifyUserId of notifyUserIds) {
        const userConnections = connections.get(notifyUserId) || [];
        for (const conn of userConnections) {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({
              type: 'new_message',
              data: message
            }));
          }
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid message data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating message' });
      }
    }
  });
  
  return httpServer;
}
