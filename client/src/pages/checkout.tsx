import { Elements } from '@stripe/react-stripe-js';
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
import SecurityBadgesComponent from '@/components/ui/security-badges';
import CheckoutFormComponent from '@/components/checkout/CheckoutForm';
import CartSummaryComponent from '@/components/checkout/CartSummary';

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

  // Create payment intent when total changes
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        console.log("Creating payment intent for amount:", total);
        
        // Use direct fetch instead of apiRequest for better error handling
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: total }),
          credentials: "include"
        });
        
        console.log("Payment intent response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Payment intent error data:", errorData);
          throw new Error(errorData.message || "Failed to create payment intent");
        }
        
        const data = await response.json();
        console.log("Payment intent created successfully");
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

    // Create payment intent for both guests and registered users
    if (total > 0) {
      createPaymentIntent();
    }
  }, [total, toast]);

  // Handle shipping form submission
  const onSubmitShippingForm = (values: ShippingFormValues) => {
    const formattedAddress = `${values.fullName}\n${values.addressLine1}${values.addressLine2 ? '\n' + values.addressLine2 : ''}\n${values.city}, ${values.state} ${values.zipCode}\n${values.country}`;
    setFormattedAddress(formattedAddress);
    setFormCompleted(true);
  };

  // No longer redirecting to login for guest checkout

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
              
              {/* Guest checkout or login/register option */}
              {!isAuthenticated && (
                <div className="mb-6 p-4 bg-muted rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Checkout Options</h3>
                    {isAuthenticated ? (
                      <span className="text-sm text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Signed in
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate('/auth/login?redirect=/checkout')}
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate('/auth/register?redirect=/checkout')}
                    >
                      Create Account
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "Continuing as Guest",
                          description: "You can create an account after checkout if you wish."
                        });
                        // Simply continue with checkout process as guest
                      }}
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              )}
              
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
              
              <SecurityBadgesComponent />
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
                <CheckoutFormComponent shippingAddress={formattedAddress} />
              </Elements>
              
              <SecurityBadgesComponent />
            </Card>
          )}
        </div>
        
        <div>
          <Card className="p-6">
            <CartSummaryComponent cart={cart} />
            
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