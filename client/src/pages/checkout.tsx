import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Shipping information schema
const shippingSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Zip code is required'),
  country: z.string().min(2, 'Country is required'),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

const CheckoutForm = ({ shippingAddress }: { shippingAddress: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { cart, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create the order first
      const orderResponse = await apiRequest("POST", "/api/orders", { 
        shippingAddress
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || "Failed to create order");
      }
      
      const orderData = await orderResponse.json();
      const orderId = orderData.id;

      // Then confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        
        // Optionally cancel the order here or mark it as payment failed
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        
        // Update order status in database
        await apiRequest("PATCH", `/api/orders/${orderId}/status`, { 
          status: "processing" 
        });
        
        clearCart();
        
        // Invalidate orders cache
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        
        // Redirect to order confirmation
        navigate(`/order-confirmation?orderId=${orderId}`);
      }
    } catch (err: any) {
      console.error("Payment processing error:", err);
      setPaymentError(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred during checkout",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Information</h3>
        <PaymentElement />
        
        {paymentError && (
          <div className="text-red-500 text-sm mt-2">
            {paymentError}
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing Payment..." : "Complete Purchase"}
      </Button>
    </form>
  );
};

// Cart summary component
const CartSummary = ({ cart }: { cart: any[] }) => {
  const total = cart.reduce((sum, item) => {
    const productPrice = typeof item.product.price === 'number' 
      ? item.product.price 
      : 0;
    
    const optionPrice = item.options?.price 
      ? parseFloat(item.options.price as string) 
      : 0;
    
    return sum + (productPrice || optionPrice) * item.quantity;
  }, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Summary</h3>
      
      <div className="space-y-3">
        {cart.map((item) => {
          const price = typeof item.product.price === 'number' 
            ? item.product.price 
            : (item.options?.price ? parseFloat(item.options.price as string) : 0);
            
          return (
            <div key={item.id} className="flex justify-between">
              <div>
                <span className="font-medium">{item.product.title}</span>
                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                {Object.entries(item.options).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {Object.entries(item.options).map(([key, value]) => (
                      key !== 'price' && (
                        <span key={key} className="mr-2">
                          {key}: {value}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>
              <span>${(price * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
      
      <Separator />
      
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const { cart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form for shipping information
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
  });
  
  const [formCompleted, setFormCompleted] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState("");
  
  // Calculate total price from cart items
  const total = cart.reduce((sum, item) => {
    const productPrice = typeof item.product.price === 'number' 
      ? item.product.price 
      : 0;
    
    const optionPrice = item.options?.price 
      ? parseFloat(item.options.price as string) 
      : 0;
    
    return sum + (productPrice || optionPrice) * item.quantity;
  }, 0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue with checkout.",
      });
      navigate('/auth/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate, toast]);

  // Create payment intent when total changes
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: total
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error("Error creating payment intent:", err);
        toast({
          title: "Payment Error",
          description: err.message || "Failed to initialize payment system",
          variant: "destructive",
        });
      }
    };

    if (total > 0 && isAuthenticated) {
      createPaymentIntent();
    }
  }, [total, isAuthenticated, toast]);

  // Handle shipping form submission
  const onSubmitShippingForm = (values: ShippingFormValues) => {
    const formattedAddress = `${values.fullName}\n${values.addressLine1}${values.addressLine2 ? '\n' + values.addressLine2 : ''}\n${values.city}, ${values.state} ${values.zipCode}\n${values.country}`;
    setFormattedAddress(formattedAddress);
    setFormCompleted(true);
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="mb-6">You don't have any items in your cart.</p>
          <Button onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="container mx-auto py-16 flex items-center justify-center">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p>Preparing your checkout...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {!formCompleted ? (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitShippingForm)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt 4B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="US" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-4">
                    Continue to Payment
                  </Button>
                </form>
              </Form>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Shipping Information</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormCompleted(false)}
                >
                  Edit
                </Button>
              </div>
              
              <div className="bg-muted p-4 rounded-md whitespace-pre-line mb-6">
                {formattedAddress}
              </div>
              
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm shippingAddress={formattedAddress} />
              </Elements>
            </Card>
          )}
        </div>
        
        <div>
          <Card className="p-6">
            <CartSummary cart={cart} />
          </Card>
        </div>
      </div>
    </div>
  );
}