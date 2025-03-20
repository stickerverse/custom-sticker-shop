import { useState } from "react";
import { useLocation } from "wouter";
import { 
  useStripe, 
  useElements, 
  PaymentElement,
  AddressElement
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckoutFormProps {
  shippingAddress: string;
}

export default function CheckoutForm({ shippingAddress }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent default form submission
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded
      console.log("Stripe or elements not loaded yet");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    console.log("Starting payment process", { isAuthenticated, cartItems: cart.length });

    try {
      // Step 1: First create the order (for both guests and authenticated users)
      console.log("Creating order...");
      // Calculate total from cart with consistent pricing logic
      const total = cart.reduce((sum, item) => {
        // Check for custom unit price first (from customization)
        const customUnitPrice = item.options?.unitPrice ? parseInt(item.options.unitPrice) : null;
        
        // Fall back to product price if no custom price, default to 500 cents ($5.00) if neither available
        const itemPrice = customUnitPrice || (item.product?.price || 500);
        
        // Use Math.round to ensure we're working with whole cents (no fractional cents)
        return sum + Math.round(itemPrice * item.quantity);
      }, 0);
      
      // For guest checkout, we need to send the cart items in the request body
      const orderPayload: any = {
        shippingAddress,
        total,
      };
      
      // If user is not authenticated, include cart items
      if (!isAuthenticated) {
        orderPayload.cart = cart;
        console.log("Including cart items for guest checkout", cart.length);
      }
      
      // Use direct fetch for better debugging
      console.log("Sending order payload:", orderPayload);
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
        credentials: "include",
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error("Order creation failed:", errorData);
        throw new Error(errorData.message || "Failed to create order");
      }
      
      const orderData = await orderResponse.json();
      console.log("Order created successfully:", orderData);
      
      // Step 2: Confirm payment with Stripe
      console.log("Confirming payment with Stripe...");
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/order-confirmation",
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        console.error("Payment confirmation error:", error);
        setErrorMessage(error.message || "An error occurred with your payment");
        setIsProcessing(false);
        return;
      }

      console.log("Payment intent status:", paymentIntent?.status);
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        console.log("Payment successful, updating order...");
        
        try {
          // Update order with payment info
          await fetch(`/api/orders/${orderData.id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              status: "processing",
              paymentIntentId: paymentIntent.id
            }),
            credentials: "include",
          });
          
          // Clear cart after successful order
          await clearCart();
          
          // Show success toast
          toast({
            title: "Order placed successfully!",
            description: "Thank you for your purchase.",
            variant: "default",
          });
          
          // Redirect to order confirmation page
          console.log("Redirecting to order confirmation page");
          navigate(`/order-confirmation?orderId=${orderData.id}`);
        } catch (error) {
          console.error("Error updating order:", error);
          setErrorMessage("Payment successful, but we couldn't update your order. Please contact support.");
          setIsProcessing(false);
        }
      } else {
        console.error("Payment not successful:", paymentIntent);
        setErrorMessage("Something went wrong with your payment. Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment process error:", error);
      setErrorMessage("An unexpected error occurred. Please try again or contact support.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <span className="mr-2 animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
            Processing...
          </span>
        ) : (
          <span className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        )}
      </Button>
    </form>
  );
}