import { 
  users, type User, type InsertUser, 
  products, type Product, type InsertProduct,
  productCategories, productOptions,
  orders, type Order, type InsertOrder,
  orderItems,
  conversations, messages, type Message, type InsertMessage,
  cartItems, type CartItem, type InsertCartItem
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductOptions(productId: number): Promise<any[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Order methods
  getOrders(userId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<any[]>;
  createOrder(order: InsertOrder, items: any[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Conversation & Message methods
  getConversations(userId: number): Promise<any[]>;
  getConversation(id: number): Promise<any | undefined>;
  getConversationByOrder(orderId: number): Promise<any | undefined>;
  createNewConversation(userId: number, subject: string): Promise<any>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Cart methods
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private productCategories: Map<number, any>;
  private productOptions: Map<number, any[]>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, any[]>;
  private conversations: Map<number, any>;
  private conversationsByOrder: Map<number, number>;
  private messages: Map<number, Message[]>;
  private cartItems: Map<number, CartItem[]>;
  
  private currentUserId: number;
  private currentProductId: number;
  private currentCategoryId: number;
  private currentOptionId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentCartItemId: number;
  
  constructor() {
    // Initialize storage
    this.users = new Map();
    this.products = new Map();
    this.productCategories = new Map();
    this.productOptions = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.conversations = new Map();
    this.conversationsByOrder = new Map();
    this.messages = new Map();
    this.cartItems = new Map();
    
    // Initialize IDs
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentCategoryId = 1;
    this.currentOptionId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentCartItemId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Create admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@stickerchat.com",
      isAdmin: true,
      displayName: "Admin",
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create customer user
    const customerUser: User = {
      id: this.currentUserId++,
      username: "customer",
      password: "customer123", // In a real app, this would be hashed
      email: "customer@example.com",
      isAdmin: false,
      displayName: "Customer",
      createdAt: new Date()
    };
    this.users.set(customerUser.id, customerUser);
    
    // Create product categories
    const categories = [
      { id: this.currentCategoryId++, name: "Decorative", description: "Beautiful stickers for decoration" },
      { id: this.currentCategoryId++, name: "Laptop", description: "Stickers for your laptop" },
      { id: this.currentCategoryId++, name: "Water Bottle", description: "Waterproof stickers for bottles" }
    ];
    
    categories.forEach(category => {
      this.productCategories.set(category.id, category);
    });
    
    // Create products
    const products = [
      { 
        id: this.currentProductId++, 
        title: "Pink Leopard Sticker", 
        description: "Beautiful pink leopard sticker, perfect for laptops, water bottles, and more.",
        imageUrl: "https://images.unsplash.com/photo-1585914641050-fa9883c4e21c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.currentProductId++, 
        title: "Cute Cat Sticker", 
        description: "Adorable cat sticker for cat lovers. High-quality vinyl.",
        imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.currentProductId++, 
        title: "Mountain Landscape Sticker", 
        description: "Stunning mountain landscape sticker in vibrant colors.",
        imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        categoryId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    products.forEach(product => {
      this.products.set(product.id, product as Product);
      
      // Create options for each product
      const options = [];
      
      // Size options
      const sizes = [
        { value: "Small (2 x 3.8 in)", priceModifier: 0 },
        { value: "Medium (2.9 x 5.5 in)", priceModifier: 200 },
        { value: "Large (4.5 x 8.5 in)", priceModifier: 400 },
        { value: "Extra Large (7.5 x 14 in)", priceModifier: 800 }
      ];
      
      sizes.forEach(size => {
        options.push({
          id: this.currentOptionId++,
          productId: product.id,
          optionType: "size",
          optionValue: size.value,
          priceModifier: size.priceModifier,
          inStock: true
        });
      });
      
      // Material options
      const materials = [
        { value: "Prismatic", priceModifier: 200 },
        { value: "Brushed Aluminium", priceModifier: 300 },
        { value: "Kraft Paper", priceModifier: 0 },
        { value: "Hi-Tack Vinyl", priceModifier: 100 },
        { value: "Low-Tack Vinyl", priceModifier: 100 },
        { value: "Reflective", priceModifier: 400 }
      ];
      
      materials.forEach(material => {
        options.push({
          id: this.currentOptionId++,
          productId: product.id,
          optionType: "material",
          optionValue: material.value,
          priceModifier: material.priceModifier,
          inStock: true
        });
      });
      
      // Finish options
      const finishes = [
        { value: "Glossy", priceModifier: 0 },
        { value: "Matte", priceModifier: 100 },
        { value: "Holographic", priceModifier: 300 },
        { value: "Transparent", priceModifier: 200 }
      ];
      
      finishes.forEach(finish => {
        options.push({
          id: this.currentOptionId++,
          productId: product.id,
          optionType: "finish",
          optionValue: finish.value,
          priceModifier: finish.priceModifier,
          inStock: true
        });
      });
      
      // Shape options
      const shapes = [
        { value: "Contour Cut", priceModifier: 200 },
        { value: "Square", priceModifier: 0 },
        { value: "Circle", priceModifier: 0 },
        { value: "Rounded Corners", priceModifier: 50 }
      ];
      
      shapes.forEach(shape => {
        options.push({
          id: this.currentOptionId++,
          productId: product.id,
          optionType: "shape",
          optionValue: shape.value,
          priceModifier: shape.priceModifier,
          inStock: true
        });
      });
      
      this.productOptions.set(product.id, options);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isAdmin: false, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductOptions(productId: number): Promise<any[]> {
    return this.productOptions.get(productId) || [];
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.products.set(id, product);
    return product;
  }
  
  // Order methods
  async getOrders(userId?: number): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    if (userId) {
      orders = orders.filter(order => order.userId === userId);
    }
    return orders;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrderItems(orderId: number): Promise<any[]> {
    return this.orderItems.get(orderId) || [];
  }
  
  async createOrder(insertOrder: InsertOrder, items: any[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id, 
      status: "pending", 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.orders.set(id, order);
    
    // Process order items
    const orderItemsList = items.map(item => {
      return {
        id: this.currentOrderItemId++,
        orderId: id,
        ...item,
        createdAt: new Date()
      };
    });
    
    this.orderItems.set(id, orderItemsList);
    
    // Create conversation for the order
    const conversation = {
      id: this.currentConversationId++,
      orderId: id,
      createdAt: new Date()
    };
    
    this.conversations.set(conversation.id, conversation);
    this.conversationsByOrder.set(id, conversation.id);
    this.messages.set(conversation.id, []);
    
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      const updatedOrder = { 
        ...order, 
        status: status as any, 
        updatedAt: new Date() 
      };
      this.orders.set(id, updatedOrder);
      return updatedOrder;
    }
    return undefined;
  }
  
  // Conversation & Message methods
  async getConversations(userId: number): Promise<any[]> {
    const conversations = [];
    
    // Get order-related conversations
    const userOrders = await this.getOrders(userId);
    for (const order of userOrders) {
      const conversationId = this.conversationsByOrder.get(order.id);
      if (conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
          // Get the associated product info
          const orderItems = await this.getOrderItems(order.id);
          const firstItem = orderItems[0];
          const product = firstItem ? await this.getProduct(firstItem.productId) : null;
          
          // Get the last message
          const messages = await this.getMessages(conversationId);
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          
          conversations.push({
            ...conversation,
            order,
            product,
            lastMessage
          });
        }
      }
    }
    
    // Get direct conversations (not associated with orders)
    const allConversations = Array.from(this.conversations.values());
    const directConversations = allConversations.filter(conv => 
      conv.isDirectChat && (conv.userId === userId || (userId === 1)) // User 1 is admin
    );
    
    for (const conversation of directConversations) {
      // Get the user info
      const user = await this.getUser(conversation.userId);
      
      // Get the last message
      const messages = await this.getMessages(conversation.id);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      conversations.push({
        ...conversation,
        user,
        lastMessage
      });
    }
    
    // Sort by most recent activity (last message date or conversation creation date)
    return conversations.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }
  
  async getConversation(id: number): Promise<any | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      return undefined;
    }
    
    try {
      // Get messages for all conversation types
      const messages = await this.getMessages(id);
      const result = { ...conversation, messages };
      
      // Handle direct conversations (not associated with orders)
      if (conversation.isDirectChat) {
        const user = await this.getUser(conversation.userId);
        return {
          ...result,
          user
        };
      }
      
      // Handle order-related conversations
      if (conversation.orderId) {
        const order = await this.getOrder(conversation.orderId);
        
        // If order doesn't exist anymore, still return the conversation without the order details
        if (!order) {
          return result;
        }
        
        const orderItems = await this.getOrderItems(conversation.orderId);
        const firstItem = orderItems[0];
        const product = firstItem ? await this.getProduct(firstItem.productId) : null;
        
        return {
          ...result,
          order,
          product,
          orderItems
        };
      }
      
      // Return the conversation even if it's not direct chat or order-related
      // This is a more robust approach than returning undefined
      return result;
      
    } catch (error) {
      console.error(`Error in getConversation for id ${id}:`, error);
      throw error;
    }
  }
  
  async getConversationByOrder(orderId: number): Promise<any | undefined> {
    const conversationId = this.conversationsByOrder.get(orderId);
    if (conversationId) {
      return this.getConversation(conversationId);
    }
    return undefined;
  }
  
  async createNewConversation(userId: number, subject: string): Promise<any> {
    try {
      console.log(`Creating new conversation for user ${userId} with subject: "${subject}"`);
      
      // Validate inputs
      if (!userId) {
        throw new Error("User ID is required to create a conversation");
      }
      
      if (!subject || subject.trim() === '') {
        throw new Error("Subject is required to create a conversation");
      }
      
      // Verify user exists
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const id = this.currentConversationId++;
      
      // Create a direct conversation without an order
      const conversation = {
        id,
        subject,
        userId,
        isDirectChat: true,
        createdAt: new Date()
      };
      
      // Store in memory maps
      this.conversations.set(id, conversation);
      this.messages.set(id, []);
      
      console.log(`Successfully created conversation with ID: ${id}`);
      
      // Return with user info included
      return {
        ...conversation,
        user
      };
    } catch (error) {
      console.error("Error in createNewConversation:", error);
      throw error;
    }
  }
  
  async getMessages(conversationId: number): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      read: false
    };
    
    const messages = this.messages.get(message.conversationId) || [];
    messages.push(message);
    this.messages.set(message.conversationId, messages);
    
    return message;
  }
  
  // Cart methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return this.cartItems.get(userId) || [];
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartItemId++;
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id, 
      createdAt: new Date() 
    };
    
    const userCart = this.cartItems.get(cartItem.userId) || [];
    
    // Check if this product+options combination already exists
    const existingItemIndex = userCart.findIndex(item => 
      item.productId === cartItem.productId && 
      JSON.stringify(item.options) === JSON.stringify(cartItem.options)
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity instead of adding a new item
      userCart[existingItemIndex].quantity += cartItem.quantity;
    } else {
      userCart.push(cartItem);
    }
    
    this.cartItems.set(cartItem.userId, userCart);
    return cartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    // Find the cart item across all users
    for (const [userId, items] of this.cartItems.entries()) {
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex >= 0) {
        // Update the quantity
        items[itemIndex].quantity = quantity;
        
        // If quantity is 0, remove the item
        if (quantity <= 0) {
          items.splice(itemIndex, 1);
        }
        
        this.cartItems.set(userId, items);
        return items[itemIndex];
      }
    }
    
    return undefined;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    // Find the cart item across all users
    for (const [userId, items] of this.cartItems.entries()) {
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex >= 0) {
        // Remove the item
        items.splice(itemIndex, 1);
        this.cartItems.set(userId, items);
        return true;
      }
    }
    
    return false;
  }
  
  async clearCart(userId: number): Promise<boolean> {
    this.cartItems.set(userId, []);
    return true;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
