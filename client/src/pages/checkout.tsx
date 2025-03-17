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

// Type definitions based on cart hook
type CartItemType = {
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
};

// Cart summary component
const CartSummary = ({ cart }: { cart: CartItemType[] }) => {
  const total = cart.reduce((sum, item) => {
    // Get product price (if available)
    const productPrice = item.product.price || 0;
    
    // Get option price (if available)
    const optionPrice = item.options?.price 
      ? parseFloat(String(item.options.price)) 
      : 0;
    
    return sum + (productPrice || optionPrice) * item.quantity;
  }, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Summary</h3>
      
      <div className="space-y-3">
        {cart.map((item) => {
          const price = item.product.price || 
            (item.options?.price ? parseFloat(String(item.options.price)) : 0);
            
          return (
            <div key={item.id} className="flex justify-between">
              <div>
                <span className="font-medium">{item.product.title}</span>
                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                {Object.entries(item.options).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {Object.entries(item.options).map(([key, value]) => 
                      key !== 'price' ? (
                        <span key={key} className="mr-2">
                          {key}: {String(value)}
                        </span>
                      ) : null
                    )}
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

// Security badges component
const SecurityBadges = () => {
  return (
    <div className="border border-border rounded-lg p-4 mt-4">
      <h3 className="text-sm font-medium mb-3 text-center">Secure Checkout</h3>
      <div className="flex flex-wrap justify-center items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <span className="text-xs text-center">Secure Payment</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="text-xs text-center">Data Protection</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="text-xs text-center">SSL Encrypted</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <span className="text-xs text-center">Safe Payments</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center space-x-3">
        <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img">
          <title>Visa</title>
          <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path>
          <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path>
          <path fill="#142688" d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z"></path>
        </svg>
        
        <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img">
          <title>Mastercard</title>
          <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3Z" fill="#000" opacity=".07"></path>
          <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32Z" fill="#FFF"></path>
          <circle cx="15" cy="12" r="7" fill="#EB001B"></circle>
          <circle cx="23" cy="12" r="7" fill="#F79E1B"></circle>
          <path d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7Z" fill="#FF5F00"></path>
        </svg>
        
        <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img">
          <title>Discover</title>
          <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3Z" fill="#000" opacity=".07"></path>
          <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32Z" fill="#FFF"></path>
          <path d="M3.6 7.2h3V16h-3V7.2ZM17 7.2h3v8.8h-3V7.2ZM26.2 16H23l-2.4-8.8H24l1.4 5.2.3 1.4c0-.4.1-.9.3-1.3l1.3-5.3h2.4L26.2 16Z" fill="#000"></path>
          <path d="M12.7 7.2v3.3c-.4-.5-1-.7-1.8-.7a3 3 0 0 0-2.2 1 3.6 3.6 0 0 0-.8 2.6c0 .9.3 1.9.9 2.6a3 3 0 0 0 2.3 1 3 3 0 0 0 2.6-1.4V16h2.6V7.2h-3.6Zm-.5 5.5c-.3.5-.7.7-1.3.7a1.5 1.5 0 0 1-1.2-.6c-.3-.4-.4-.9-.4-1.4 0-.6.1-1 .4-1.4.3-.4.7-.6 1.2-.6.6 0 1 .2 1.3.6.3.4.5.9.5 1.4 0 .5-.1 1-.5 1.3ZM33.5 13.5c-.7-.2-1.1-.4-1.1-.8 0-.5.4-.8 1.2-.8.5 0 1 .1 1.6.5l.8-1.6a6 6 0 0 0-2.5-.5c-1.2 0-2 .3-2.6.8-.6.5-.9 1.2-.9 2 0 1.6 1 2.5 3 2.9.8.2 1.2.4 1.2.8 0 .5-.4.8-1.3.8-.8 0-1.6-.3-2.3-.8l-1 1.6c.9.6 2 .9 3.1.9 1.3 0 2.3-.3 2.9-.8.7-.5 1-1.3 1-2.2a2.4 2.4 0 0 0-.8-2c-.4-.4-1.2-.7-2.3-1Z" fill="#000"></path>
          <path d="M36.9 13a7 7 0 0 1-2.6 3.2h3.9a6.7 6.7 0 0 0 .9-3.2c0-1.3-.2-2.3-.6-3.2h-4.3c.6.9.7 2 .7 3.2Z" fill="#F27712"></path>
        </svg>
        
        <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg" role="img">
          <title>PayPal</title>
          <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path>
          <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path>
          <path fill="#003087" d="M23.9 8.3c.2-1 0-1.7-.6-2.3-.6-.7-1.7-1-3.1-1h-4.1c-.3 0-.5.2-.6.5L14 15.6c0 .2.1.4.3.4H17l.4-3.4 1.8-2.2 4.7-2.1z"></path>
          <path fill="#3086C8" d="M23.9 8.3l-.2.2c-.5 2.8-2.2 3.8-4.6 3.8H18c-.3 0-.5.2-.6.5l-.6 3.9-.2 1c0 .2.1.4.3.4H19c.3 0 .5-.2.5-.4v-.1l.4-2.4v-.1c0-.2.3-.4.5-.4h.3c2.1 0 3.7-.8 4.1-3.2.2-1 .1-1.8-.4-2.4-.1-.5-.3-.7-.5-.8z"></path>
          <path fill="#012169" d="M23.3 8.1c-.1-.1-.2-.1-.3-.1-.1 0-.2 0-.3-.1-.3-.1-.7-.1-1.1-.1h-3c-.1 0-.2 0-.2.1-.2.1-.3.2-.3.4l-.7 4.4v.1c0-.3.3-.5.6-.5h1.3c2.5 0 4.1-1 4.6-3.8v-.2c-.1-.1-.3-.2-.5-.2h-.1z"></path>
        </svg>
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        Your payment information is processed securely. We do not store credit card details.
      </p>
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
    // Get product price safely (if available)
    const productPrice = (item.product as any).price || 0;
    
    // Get option price (if available)
    const optionPrice = item.options?.price 
      ? parseFloat(String(item.options.price)) 
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
              
              <SecurityBadges />
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
              
              <SecurityBadges />
            </Card>
          )}
        </div>
        
        <div>
          <Card className="p-6">
            <CartSummary cart={cart} />
            
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-lg font-medium mb-2">Worry-Free Shopping</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Secure payment processing
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Fast shipping options
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  30-day money-back guarantee
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Responsive customer support
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}