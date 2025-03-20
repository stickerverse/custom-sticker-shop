import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { calculateItemPrice, formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  cart: {
    id: number;
    productId: number;
    quantity: number;
    options: Record<string, any>;
    product: {
      id: number;
      title: string;
      description: string;
      imageUrl: string;
      price?: number;
    };
  }[];
}

export default function CartSummary({ cart }: CartSummaryProps) {
  // Create a local copy of the cart for optimistic UI updates
  const [liveCart, setLiveCart] = useState(cart);
  const [optimisticSubtotal, setOptimisticSubtotal] = useState<number | null>(null);
  
  // Update local cart state when cart changes
  useEffect(() => {
    setLiveCart(cart);
    setOptimisticSubtotal(null); // Reset optimistic subtotal when real cart updates
  }, [cart]);
  
  // Setup event listeners for cart updates
  useEffect(() => {
    const handleQuantityUpdating = (e: CustomEvent) => {
      const { itemId, newQuantity, oldQuantity } = e.detail;
      
      // Update local cart state optimistically
      setLiveCart(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      
      // Calculate new subtotal optimistically
      updateOptimisticSubtotal(itemId, newQuantity, oldQuantity);
    };
    
    const handleItemRemoving = (e: CustomEvent) => {
      const { itemId } = e.detail;
      
      // Update local cart state by removing the item
      setLiveCart(prev => prev.filter(item => item.id !== itemId));
      
      // Calculate new subtotal without this item
      updateOptimisticSubtotalAfterRemoval(itemId);
    };
    
    // Add event listeners
    window.addEventListener('cart:quantity:updating', handleQuantityUpdating as EventListener);
    window.addEventListener('cart:item:removing', handleItemRemoving as EventListener);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('cart:quantity:updating', handleQuantityUpdating as EventListener);
      window.removeEventListener('cart:item:removing', handleItemRemoving as EventListener);
    };
  }, [liveCart]);
  
  // Calculate subtotal using utility function for consistent pricing
  const calculateSubtotal = () => {
    return liveCart.reduce((total, item) => {
      return total + calculateItemPrice(item, item.quantity);
    }, 0);
  };
  
  // Helper to get correct price for an item using our utility
  const getItemPrice = (item: any) => {
    return calculateItemPrice(item, 1); // Get unit price (quantity = 1)
  };

  // Calculate an optimistic subtotal after quantity change
  const updateOptimisticSubtotal = (itemId: number, newQuantity: number, oldQuantity: number) => {
    const currentSubtotal = calculateSubtotal();
    const item = liveCart.find(item => item.id === itemId);
    
    if (item) {
      const itemUnitPrice = getItemPrice(item);
      const priceDifference = Math.round(itemUnitPrice * (newQuantity - oldQuantity));
      setOptimisticSubtotal(currentSubtotal + priceDifference);
    }
  };
  
  // Calculate optimistic subtotal after removing an item
  const updateOptimisticSubtotalAfterRemoval = (itemId: number) => {
    const currentSubtotal = calculateSubtotal();
    const item = liveCart.find(item => item.id === itemId);
    
    if (item) {
      const itemTotalPrice = calculateItemPrice(item, item.quantity);
      setOptimisticSubtotal(currentSubtotal - itemTotalPrice);
    }
  };
  
  // Get the current subtotal value (actual or optimistic)
  const subtotal = optimisticSubtotal !== null ? optimisticSubtotal : calculateSubtotal();
  
  // Set fixed values for shipping, tax, etc.
  const shipping = 499; // $4.99
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + shipping + tax;

  // Format as currency
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
      
      <div className="space-y-4 mb-6">
        {liveCart.map((item) => (
          <motion.div 
            key={item.id} 
            className="flex justify-between"
            layout
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex">
              <div className="w-12 h-12 rounded bg-muted mr-3 overflow-hidden">
                {item.product.imageUrl && (
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.title} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-medium">{item.product.title}</p>
                <motion.p 
                  className="text-xs text-muted-foreground"
                  key={`qty-${item.id}-${item.quantity}`}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Qty: {item.quantity} × {formatCurrency(getItemPrice(item))} each
                </motion.p>
                <p className="text-xs text-muted-foreground">
                  size: {item.options.size || "Standard"} 
                  {item.options.material ? ` material: ${item.options.material}` : ""} 
                  {item.options.finish ? ` finish: ${item.options.finish}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <motion.p 
                className="font-medium"
                key={`price-${item.id}-${item.quantity}`}
                animate={{ 
                  scale: [1, 1.05, 1],
                  transition: { duration: 0.3 }
                }}
              >
                {formatCurrency(Math.round(getItemPrice(item) * item.quantity))}
              </motion.p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <Separator className="mb-4" />
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <motion.span
            key={`subtotal-${subtotal}`}
            animate={{ opacity: [0.6, 1] }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(subtotal)}
          </motion.span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{formatCurrency(shipping)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <motion.span
            key={`tax-${tax}`}
            animate={{ opacity: [0.6, 1] }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(tax)}
          </motion.span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <motion.span
            key={`total-${total}`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.4 }}
            className="text-primary"
          >
            {formatCurrency(total)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}