import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import CartItem from "./CartItem";
import { Link } from "wouter";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  newItemId?: number;
}

export function CartDrawer({ isOpen, onClose, newItemId }: CartDrawerProps) {
  const { cart } = useCart();
  const [liveCart, setLiveCart] = useState(cart);
  const [optimisticTotal, setOptimisticTotal] = useState<number | null>(null);

  // Update local cart state when cart changes
  useEffect(() => {
    setLiveCart(cart);
    setOptimisticTotal(null); // Reset optimistic total when real cart updates
  }, [cart]);

  // Set up event listeners for live updates
  useEffect(() => {
    const handleQuantityUpdating = (e: any) => {
      const { itemId, newQuantity, oldQuantity } = e.detail;
      
      // Update local cart state optimistically
      setLiveCart(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      
      // Calculate new total optimistically
      calculateOptimisticTotal(itemId, newQuantity, oldQuantity);
    };
    
    const handleItemRemoving = (e: any) => {
      const { itemId } = e.detail;
      
      // Update local cart state optimistically by removing the item
      setLiveCart(prev => prev.filter(item => item.id !== itemId));
      
      // Calculate new total without this item
      calculateOptimisticTotalAfterRemoval(itemId);
    };
    
    // Add event listeners
    window.addEventListener('cart:quantity:updating', handleQuantityUpdating);
    window.addEventListener('cart:item:removing', handleItemRemoving);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('cart:quantity:updating', handleQuantityUpdating);
      window.removeEventListener('cart:item:removing', handleItemRemoving);
    };
  }, [liveCart]);

  // Handle key press to close drawer with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Calculate an optimistic total after quantity change
  const calculateOptimisticTotal = (itemId: number, newQuantity: number, oldQuantity: number) => {
    const currentTotal = calculateTotal();
    const item = liveCart.find(item => item.id === itemId);
    
    if (item) {
      const itemUnitPrice = getItemPrice(item);
      const priceDifference = itemUnitPrice * (newQuantity - oldQuantity);
      setOptimisticTotal(currentTotal + priceDifference);
    }
  };
  
  // Calculate optimistic total after removing an item
  const calculateOptimisticTotalAfterRemoval = (itemId: number) => {
    const currentTotal = calculateTotal();
    const item = liveCart.find(item => item.id === itemId);
    
    if (item) {
      const itemTotalPrice = getItemPrice(item) * item.quantity;
      setOptimisticTotal(currentTotal - itemTotalPrice);
    }
  };
  
  // Helper to get the correct price for an item
  const getItemPrice = (item: any) => {
    const customUnitPrice = item.options?.unitPrice ? parseInt(item.options.unitPrice) : null;
    return customUnitPrice || item.product.price || 799; // Fall back to default price
  };

  // Calculate total price using either live cart or original cart
  const calculateTotal = useCallback((): number => {
    return liveCart.reduce((total, item) => {
      // Get the correct price for this item (custom price or product price)
      const itemPrice = getItemPrice(item);
      return total + (itemPrice * item.quantity);
    }, 0);
  }, [liveCart]);

  // Format price in cents to dollars
  const formatPrice = (cents: number) => {
    return `US$${(cents / 100).toFixed(2)}`;
  };

  // Find the newly added item to highlight it
  const newlyAddedItem = newItemId ? cart.find(item => item.id === newItemId) : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 flex justify-between items-center border-b">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold">Your Cart ({cart.length})</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Close cart"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow overflow-y-auto p-4">
              {liveCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCartIcon className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Your cart is empty</p>
                  <Button variant="outline" className="mt-4" onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {liveCart.map((item) => (
                    <motion.li
                      key={item.id}
                      className={`${item.id === newItemId ? 'bg-blue-50 border-blue-200' : 'bg-white'} 
                        rounded-lg p-2 border transition-colors duration-300`}
                      initial={item.id === newItemId ? { scale: 0.95, opacity: 0 } : undefined}
                      animate={item.id === newItemId ? { scale: 1, opacity: 1 } : undefined}
                      exit={{ opacity: 0, height: 0 }}
                      layout // Enable automatic layout adjustments
                    >
                      <CartItem item={item} />
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Cart Footer */}
            {liveCart.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <motion.span 
                      className="font-medium"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      key={optimisticTotal || calculateTotal()} // Force animation when total changes
                    >
                      {formatPrice(optimisticTotal !== null ? optimisticTotal : calculateTotal())}
                    </motion.span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <motion.span 
                      className="text-pink-600"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      key={`total-${optimisticTotal || calculateTotal()}`} // Force animation when total changes
                    >
                      {formatPrice(optimisticTotal !== null ? optimisticTotal : calculateTotal())}
                    </motion.span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onClose}
                  >
                    Continue Shopping
                  </Button>
                  <Button 
                    className="w-full bg-pink-500 hover:bg-pink-600"
                    asChild
                  >
                    <Link href="/checkout">
                      Checkout
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;