import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Package, Truck, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function OrderConfirmation() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Get orderId from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  
  // Redirect to home if no orderId is present
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Missing Order Information",
        description: "No order ID was provided.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [orderId, navigate, toast]);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['/api/orders', parseInt(orderId || "0")],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await apiRequest("GET", `/api/orders/${orderId}`);
      return response.json();
    },
    enabled: !!orderId, // Allow both guest and authenticated users to view their orders
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 flex items-center justify-center">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p>Loading order details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="mb-6">We couldn't find the order details you're looking for.</p>
          <Button onClick={() => navigate("/shop")}>
            Continue Shopping
          </Button>
        </Card>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Thank You for Your Order!</h1>
          <p className="text-muted-foreground mt-2">
            Your order has been received and is now being processed
          </p>
        </div>

        <div className="bg-muted p-4 rounded-md mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">#{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">${(order.total / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Status</h2>
          <div className="relative">
            <div className="absolute top-0 left-6 h-full w-0.5 bg-muted-foreground/20"></div>
            <div className="space-y-8 relative">
              <div className="flex">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.status !== 'cancelled' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'} z-10`}>
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Order Received</h3>
                  <p className="text-sm text-muted-foreground">Your order has been confirmed</p>
                </div>
              </div>
              
              <div className="flex">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${['processing', 'awaiting_approval', 'in_production', 'shipped', 'delivered'].includes(order.status) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'} z-10`}>
                  <Package className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Processing</h3>
                  <p className="text-sm text-muted-foreground">Your order is being processed</p>
                </div>
              </div>
              
              <div className="flex">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${['shipped', 'delivered'].includes(order.status) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'} z-10`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Shipped</h3>
                  <p className="text-sm text-muted-foreground">Your order is on the way</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center">
                  {item.product?.imageUrl && (
                    <div className="w-16 h-16 rounded bg-muted mr-4 overflow-hidden">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{item.product?.title}</h3>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    {Object.keys(item.options || {}).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(item.options).map(([key, value]) => (
                          key !== 'price' && (
                            <span key={key} className="mr-2">
                              {key}: {String(value)}
                            </span>
                          )
                        ))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="font-bold">${(order.total / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <div className="bg-muted p-4 rounded-md">
            <p className="whitespace-pre-line">{order.shippingAddress}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href={`/chat?orderId=${order.id}`}>Contact Support</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}