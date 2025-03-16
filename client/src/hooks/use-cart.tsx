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
  };
};

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  addToCart: (item: { productId: number; quantity: number; options: Record<string, string> }) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Create context
const CartContext = createContext<CartContextType>({
  cart: [],
  isLoading: false,
  addToCart: async () => {},
  updateCartItem: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
});

// Provider component
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      if (isAuthenticated) {
        // If authenticated, use API
        const response = await apiRequest("POST", "/api/cart", item);
        const newItem = await response.json();
        setCart(prev => [...prev, newItem]);
      } else {
        // If not authenticated, use local storage
        // Fetch product details
        const productResponse = await fetch(`/api/products/${item.productId}`);
        if (!productResponse.ok) {
          throw new Error("Could not fetch product details");
        }
        const product = await productResponse.json();

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
          },
        };

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
        } else {
          // Add new item if it doesn't exist
          setCart(prev => [...prev, newItem]);
        }
      }
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

  return (
    <CartContext.Provider value={{ cart, isLoading, addToCart, updateCartItem, removeFromCart, clearCart }}>
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
