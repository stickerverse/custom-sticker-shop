import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from '@/hooks/use-cart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { cart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        clearCart();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const { cart } = useCart();
  
  // Calculate total price from cart items, handling both regular products and custom products
  const total = cart.reduce((sum, item) => {
    // For regular products that might be missing price in the type
    const productPrice = typeof item.product.price === 'number' 
      ? item.product.price 
      : 0;
    
    // For custom stickers or any item with price in options
    const optionPrice = item.options?.price 
      ? parseFloat(item.options.price as string) 
      : 0;
    
    return sum + (productPrice || optionPrice) * item.quantity;
  }, 0);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: total
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent:", err);
      }
    };

    if (total > 0) {
      createPaymentIntent();
    }
  }, [total]);

  if (!clientSecret || total === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="p-6">
          {total === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <div className="mb-6">
          <p className="text-lg">Total Amount: ${total.toFixed(2)}</p>
        </div>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      </Card>
    </div>
  );
}