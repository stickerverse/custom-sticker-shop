import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider, useCart } from "@/hooks/use-cart";
import { ChatProvider } from "@/hooks/use-chat";
import { WebSocketProvider } from "@/lib/socket";
import AnimatedBackground from "@/components/ui/animated-background";
import CartDrawer from "@/components/cart/CartDrawer";

import Navbar from "@/components/layout/Navbar";
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import Product from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Customizer from "@/pages/customizer";
import Chat from "@/pages/chat";
import Admin from "@/pages/admin";
import Account from "@/pages/account";
import OrderConfirmation from "@/pages/order-confirmation";
import EbaySelection from "@/pages/ebay-selection";
import StyleGuide from "@/pages/style-guide";
import NotFound from "@/pages/not-found";

// Cart drawer wrapper needs access to cart context
function CartDrawerWrapper() {
  const { isCartOpen, closeCart, newItemId } = useCart();
  
  return (
    <CartDrawer 
      isOpen={isCartOpen} 
      onClose={closeCart} 
      newItemId={newItemId} 
    />
  );
}

function Router() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if we just completed an order
    const orderSuccess = new URLSearchParams(window.location.search).get('orderSuccess');
    if (orderSuccess === 'true') {
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been placed and a chat room has been created for you to communicate with the seller.",
        variant: "default",
      });
      
      // Remove the query param
      window.history.replaceState({}, document.title, location.split('?')[0]);
    }
    
    setIsLoaded(true);
  }, [location, toast]);

  return (
    <>
      {/* Animated glassmorphism background with moving glow */}
      <AnimatedBackground />
      
      {/* Main content with higher z-index */}
      <div className="relative z-0">
        {!location.startsWith('/chat') && <Navbar />}
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/product/:id" component={Product} />
          <Route path="/customizer" component={Customizer} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-confirmation" component={OrderConfirmation} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:id" component={Chat} />
          <Route path="/admin" component={Admin} />
          <Route path="/account" component={Account} />
          <Route path="/ebay-selection" component={EbaySelection} />
          <Route path="/style-guide" component={StyleGuide} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      {/* Cart drawer that slides from the right */}
      <CartDrawerWrapper />
      
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WebSocketProvider>
            <ChatProvider>
              <Router />
            </ChatProvider>
          </WebSocketProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
