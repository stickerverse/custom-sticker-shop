import { Separator } from "@/components/ui/separator";

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
  // Calculate subtotal
  const subtotal = cart.reduce((total, item) => {
    // Use product price or default to 500 cents ($5.00) if not provided
    const itemPrice = (item.product.price || 500) * item.quantity;
    return total + itemPrice;
  }, 0);
  
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
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between">
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
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} × {formatCurrency(item.product.price || 500)} each
                </p>
                <p className="text-xs text-muted-foreground">
                  size: {item.options.size || "Standard"} {item.options.material ? `material: ${item.options.material}` : ""} {item.options.finish ? `finish: ${item.options.finish}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {formatCurrency((item.product.price || 500) * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="mb-4" />
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{formatCurrency(shipping)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}