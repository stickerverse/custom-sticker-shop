import { useState, useEffect, createContext, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Types
type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  options: Record<string, string>;
  product: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    price?: number;
  };
};

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  isCartOpen: boolean;
  newItemId: number | undefined;
  addToCart: (item: { productId: number; quantity: number; options: Record<string, string> }) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: (itemId?: number) => void;
  closeCart: () => void;
}

// Create context
const CartContext = createContext<CartContextType>({
  cart: [],
  isLoading: false,
  isCartOpen: false,
  newItemId: undefined,
  addToCart: async () => {},
  updateCartItem: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  openCart: () => {},
  closeCart: () => {},
});

// Provider component
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [newItemId, setNewItemId] = useState<number | undefined>(undefined);

  // Load cart from local storage or API
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoading(true);
        if (isAuthenticated) {
          // If authenticated, fetch from API
          const response = await fetch("/api/cart", {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            setCart(data);
          } else {
            throw new Error("Could not fetch cart");
          }
        } else {
          // If not authenticated, use local storage
          const storedCart = localStorage.getItem("cart");
          if (storedCart) {
            setCart(JSON.parse(storedCart));
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        toast({
          title: "Error",
          description: "Could not load your cart. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated]);

  // Save cart to local storage when it changes
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  // Add item to cart
  const addToCart = async (item: { productId: number; quantity: number; options: Record<string, string> }) => {
    try {
      let newItemId: number | undefined;
      
      if (isAuthenticated) {
        // If authenticated, use API
        const response = await apiRequest("POST", "/api/cart", item);
        const newItem = await response.json();
        setCart(prev => [...prev, newItem]);
        newItemId = newItem.id;
      } else {
        // If not authenticated, use local storage
        // Fetch product details
        const productResponse = await fetch(`/api/products/${item.productId}`);
        if (!productResponse.ok) {
          throw new Error("Could not fetch product details");
        }
        const product = await productResponse.json();

        // Check if item already exists (same product and options)
        const existingItemIndex = cart.findIndex(
          cartItem => 
            cartItem.productId === item.productId && 
            JSON.stringify(cartItem.options) === JSON.stringify(item.options)
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity += item.quantity;
          setCart(updatedCart);
          newItemId = updatedCart[existingItemIndex].id;
        } else {
          // Create new cart item
          const newItem: CartItem = {
            id: Date.now(), // Use timestamp as temporary ID
            productId: item.productId,
            quantity: item.quantity,
            options: item.options,
            product: {
              id: product.id,
              title: product.title,
              description: product.description,
              imageUrl: product.imageUrl,
              price: product.price, // Include the price from product
            },
          };
          
          // Add new item if it doesn't exist
          setCart(prev => [...prev, newItem]);
          newItemId = newItem.id;
        }
      }
      
      // Open cart drawer with newly added item highlighted
      openCart(newItemId);
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  // Update cart item
  const updateCartItem = async (id: number, quantity: number) => {
    try {
      if (isAuthenticated) {
        // If authenticated, use API
        const response = await apiRequest("PUT", `/api/cart/${id}`, { quantity });
        const updatedItem = await response.json();
        
        setCart(prev => 
          prev.map(item => item.id === id ? { ...item, quantity } : item)
        );
      } else {
        // If not authenticated, use local storage
        setCart(prev => 
          prev.map(item => item.id === id ? { ...item, quantity } : item)
        );
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  };

  // Remove from cart
  const removeFromCart = async (id: number) => {
    try {
      if (isAuthenticated) {
        // If authenticated, use API
        await apiRequest("DELETE", `/api/cart/${id}`);
      }
      
      // Update state regardless of auth status
      setCart(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        // If authenticated, use API
        await apiRequest("DELETE", "/api/cart");
      }
      
      // Clear state regardless of auth status
      setCart([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  };
  
  // Open cart drawer and highlight newly added item
  const openCart = (itemId?: number) => {
    if (itemId) {
      setNewItemId(itemId);
    }
    setIsCartOpen(true);
  };
  
  // Close cart drawer
  const closeCart = () => {
    setIsCartOpen(false);
    // Clear the highlighted item after a delay
    setTimeout(() => {
      setNewItemId(undefined);
    }, 300); // Same duration as the drawer animation
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      isLoading, 
      isCartOpen, 
      newItemId,
      addToCart, 
      updateCartItem, 
      removeFromCart, 
      clearCart,
      openCart,
      closeCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
