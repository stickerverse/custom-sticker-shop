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
  const { clearCart } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent default form submission
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/checkout",
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message || "An error occurred with your payment");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, create the order
        try {
          const response = await apiRequest("POST", "/api/orders", {
            shippingAddress,
            paymentIntentId: paymentIntent.id,
          });
          
          const orderData = await response.json();
          
          // Clear cart after successful order
          await clearCart();
          
          // Show success toast
          toast({
            title: "Order placed successfully!",
            description: "Thank you for your purchase.",
            variant: "default",
          });
          
          // Redirect to order confirmation page
          navigate(`/order-confirmation?orderId=${orderData.id}`);
        } catch (error) {
          console.error("Error creating order:", error);
          setErrorMessage("Payment successful, but we couldn't create your order. Please contact support.");
          setIsProcessing(false);
        }
      } else {
        setErrorMessage("Something went wrong with your payment. Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
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