import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { calculateItemPrice, formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: {
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
}

const CartItem = ({ item }: CartItemProps) => {
  const { toast } = useToast();
  const { updateCartItem, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Get the actual product price from the product data or custom unitPrice
  // First check if unitPrice was passed in options (from customization)
  const customUnitPrice = item.options?.unitPrice ? parseInt(item.options.unitPrice) : null;
  // Fall back to product price if no custom price, or default to 500 (5.00) if neither available
  const itemPrice = customUnitPrice || item.product.price || 500;
  // Round to ensure we're working with whole cents (no fractional cents)
  const totalPrice = Math.round(itemPrice * quantity);

  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Format options to display (exclude technical fields like unitPrice)
  const formatOptions = () => {
    const displayableOptions = Object.entries(item.options)
      .filter(([key]) => !['unitPrice'].includes(key))
      .map(([key, value]) => `${key}: ${value}`);
    
    return displayableOptions.join(", ");
  };

  // Handle quantity update
  const handleUpdateQuantity = async () => {
    if (quantity === item.quantity) return;
    if (quantity < 1) {
      setQuantity(1);
      return;
    }

    try {
      setIsUpdating(true);
      // Emit a global cart update event before API call
      // This enables other components to update instantly
      window.dispatchEvent(new CustomEvent('cart:quantity:updating', { 
        detail: { itemId: item.id, newQuantity: quantity, oldQuantity: item.quantity }
      }));
      
      await updateCartItem(item.id, quantity);
      
      // Dispatch another event when update is successful
      window.dispatchEvent(new CustomEvent('cart:quantity:updated', { 
        detail: { itemId: item.id, quantity: quantity }
      }));
      
      toast({
        title: "Cart Updated",
        description: `Quantity updated to ${quantity}`,
      });
    } catch (error) {
      // Revert the change in case of error
      window.dispatchEvent(new CustomEvent('cart:quantity:failed', { 
        detail: { itemId: item.id, quantity: item.quantity }
      }));
      
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update cart",
        variant: "destructive",
      });
      setQuantity(item.quantity); // Reset to original
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle item removal
  const handleRemoveItem = async () => {
    try {
      setIsRemoving(true);
      
      // Emit removal event before API call
      window.dispatchEvent(new CustomEvent('cart:item:removing', { 
        detail: { itemId: item.id, product: item.product }
      }));
      
      await removeFromCart(item.id);
      
      // Dispatch event when removal is successful
      window.dispatchEvent(new CustomEvent('cart:item:removed', { 
        detail: { itemId: item.id }
      }));
      
      toast({
        title: "Item Removed",
        description: `${item.product.title} has been removed from your cart`,
      });
    } catch (error) {
      // Emit failure event
      window.dispatchEvent(new CustomEvent('cart:item:removal:failed', { 
        detail: { itemId: item.id }
      }));
      
      toast({
        title: "Removal Failed",
        description: error instanceof Error ? error.message : "Could not remove item",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row border-b border-gray-200 py-4">
      <div className="sm:w-1/4 mb-4 sm:mb-0">
        <Link href={`/product/${item.product.id}`}>
          <div className="aspect-square rounded-md overflow-hidden border border-gray-200">
            <img
              src={item.product.imageUrl}
              alt={item.product.title}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      </div>

      <div className="sm:w-3/4 sm:pl-6 flex flex-col justify-between">
        <div>
          <Link href={`/product/${item.product.id}`}>
            <h3 className="font-medium text-lg hover:text-primary">
              {item.product.title}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm mb-2">{formatOptions()}</p>
          <div className="text-primary">
            <span className="font-semibold">{formatPrice(itemPrice)}</span>
            {quantity > 1 && (
              <span className="text-gray-600 text-sm ml-1">× {quantity} = {formatPrice(totalPrice)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const newQuantity = Math.max(1, quantity - 1);
                setQuantity(newQuantity);
                if (newQuantity !== quantity) {
                  handleUpdateQuantity();
                }
              }}
              disabled={isUpdating || quantity <= 1}
            >
              <span className="material-icons text-sm">remove</span>
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              onBlur={handleUpdateQuantity}
              min="1"
              className="w-14 mx-2 text-center h-8"
              disabled={isUpdating}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const newQuantity = quantity + 1;
                setQuantity(newQuantity);
                handleUpdateQuantity();
              }}
              disabled={isUpdating}
            >
              <span className="material-icons text-sm">add</span>
            </Button>
          </div>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveItem}
              disabled={isRemoving}
              className="text-gray-500 hover:text-red-500"
            >
              <span className="material-icons text-sm mr-1">delete</span>
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
