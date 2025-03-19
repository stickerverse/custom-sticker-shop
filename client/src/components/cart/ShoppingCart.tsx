import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import CartItem from "./CartItem";
import { Link, useLocation } from "wouter";

const ShoppingCart = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { cart, isLoading, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = 499; // Base price: $4.99
      return sum + itemPrice * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = subtotal > 3500 ? 0 : 500; // Free shipping over $35
  const total = subtotal + shippingCost;

  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Handle clear cart
  const handleClearCart = async () => {
    try {
      await clearCart();
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    // Allow guest checkout - no longer requiring authentication
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add some items to your cart before checking out",
        variant: "default",
      });
      return;
    }

    // Redirect to checkout for both guests and authenticated users
    setLocation("/checkout");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading your cart...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-icons text-gray-300 text-6xl mb-4">shopping_cart</span>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
        <Button 
          className="bg-primary text-white hover:bg-primary/90"
          onClick={() => setLocation("/shop")}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold">Your Cart ({cart.length})</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearCart}
          className="text-gray-500"
        >
          Clear All
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        <div className="py-2">
          {cart.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-dashed border-gray-200">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button 
            className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>
          <Link href="/shop">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>Free shipping on orders over $35</p>
          <p>30-day easy returns</p>
          <p>Secure payments</p>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
