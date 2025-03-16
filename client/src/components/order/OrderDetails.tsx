import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface OrderDetailsProps {
  orderId: number;
  onClose?: () => void;
}

const OrderDetails = ({ orderId, onClose }: OrderDetailsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update order status",
        variant: "destructive",
      });
    }
  });
  
  // Status badge color mapping
  const statusColorMap: Record<string, string> = {
    "pending": "bg-yellow-400",
    "processing": "bg-blue-400",
    "awaiting_approval": "bg-yellow-400",
    "in_production": "bg-blue-600",
    "shipped": "bg-green-500",
    "delivered": "bg-green-700",
    "cancelled": "bg-red-500"
  };
  
  // Status text mapping
  const statusTextMap: Record<string, string> = {
    "pending": "Pending",
    "processing": "Processing",
    "awaiting_approval": "Awaiting Approval",
    "in_production": "In Production",
    "shipped": "Shipped",
    "delivered": "Delivered",
    "cancelled": "Cancelled"
  };
  
  // Helper to format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status });
  };
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading order details...</p>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error loading order details. Please try again.</p>
      </div>
    );
  }
  
  // Get the first item for display purposes
  const firstItem = order.items?.[0];
  
  return (
    <ScrollArea className="h-screen overflow-y-auto border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Order Details</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <span className="material-icons">close</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Avatar className="h-16 w-16 rounded-md">
            <AvatarImage src={firstItem?.product?.imageUrl} alt={firstItem?.product?.title} />
            <AvatarFallback>{firstItem?.product?.title?.charAt(0) || "S"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="font-medium">{firstItem?.product?.title}</h3>
            <p className="text-sm text-gray-500">Order #{order.id}</p>
            <div className="flex items-center mt-1">
              <span className={`inline-block h-3 w-3 rounded-full ${statusColorMap[order.status] || "bg-gray-400"} mr-1`}></span>
              <span className="text-sm font-medium text-gray-700">{statusTextMap[order.status] || order.status}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Timeline */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium mb-3">Order Timeline</h3>
        <div className="relative pl-6">
          <div className="absolute top-0 left-0 h-full w-px bg-gray-200"></div>
          
          <div className="relative mb-4">
            <div className={`absolute -left-[6px] top-1 h-3 w-3 rounded-full ${order.status !== "cancelled" ? "bg-success" : "bg-gray-300"}`}></div>
            <div>
              <p className="text-sm font-medium">Order Placed</p>
              <p className="text-xs text-gray-500">{format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>
          
          <div className="relative mb-4">
            <div className={`absolute -left-[6px] top-1 h-3 w-3 rounded-full ${order.status !== "cancelled" && order.status !== "pending" ? "bg-success" : "bg-gray-300"}`}></div>
            <div>
              <p className="text-sm font-medium">Payment Confirmed</p>
              <p className="text-xs text-gray-500">
                {order.status !== "cancelled" && order.status !== "pending" 
                  ? format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a") 
                  : "Pending"}
              </p>
            </div>
          </div>
          
          <div className="relative mb-4">
            <div className={`absolute -left-[6px] top-1 h-3 w-3 rounded-full ${
              order.status === "awaiting_approval" ? "bg-yellow-400" : 
              (order.status !== "cancelled" && order.status !== "pending" && order.status !== "processing" ? "bg-success" : "bg-gray-300")
            }`}></div>
            <div>
              <p className="text-sm font-medium">Design Discussion Started</p>
              <p className="text-xs text-gray-500">
                {order.status === "awaiting_approval" ? "Current Status" : 
                 (order.status !== "cancelled" && order.status !== "pending" && order.status !== "processing" ? 
                    format(new Date(order.updatedAt), "MMMM d, yyyy") : "Pending")}
              </p>
            </div>
          </div>
          
          <div className="relative mb-4">
            <div className={`absolute -left-[6px] top-1 h-3 w-3 rounded-full ${
              order.status === "in_production" ? "bg-yellow-400" : 
              (order.status === "shipped" || order.status === "delivered" ? "bg-success" : "bg-gray-300")
            }`}></div>
            <div>
              <p className="text-sm font-medium">Production</p>
              <p className="text-xs text-gray-500">
                {order.status === "in_production" ? "Current Status" : 
                 (order.status === "shipped" || order.status === "delivered" ? 
                    "Completed" : "Pending")}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className={`absolute -left-[6px] top-1 h-3 w-3 rounded-full ${
              order.status === "shipped" ? "bg-yellow-400" : 
              (order.status === "delivered" ? "bg-success" : "bg-gray-300")
            }`}></div>
            <div>
              <p className="text-sm font-medium">Shipped</p>
              <p className="text-xs text-gray-500">
                {order.status === "shipped" ? "Current Status" : 
                 (order.status === "delivered" ? 
                    "Completed" : "Pending")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Details */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium mb-3">Specifications</h3>
        <div className="space-y-2">
          {order.items?.map((item: any) => (
            <div key={item.id}>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Size</span>
                <span className="text-sm font-medium">{item.options?.size || "Standard"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Quantity</span>
                <span className="text-sm font-medium">{item.quantity} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Material</span>
                <span className="text-sm font-medium">{item.options?.material || "Vinyl"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Finish</span>
                <span className="text-sm font-medium">{item.options?.finish || "Standard"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Shape</span>
                <span className="text-sm font-medium">{item.options?.shape || "Standard"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Payment Info */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium mb-3">Payment</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="text-sm">{formatPrice(order.total * 0.9)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Shipping</span>
            <span className="text-sm">{formatPrice(order.total * 0.1)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-sm">Total</span>
            <span className="text-sm">{formatPrice(order.total)}</span>
          </div>
          <div className="text-xs text-gray-500">Paid with Credit Card</div>
        </div>
      </div>
      
      {/* Shipping Info */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium mb-3">Shipping Address</h3>
        <div className="text-sm">
          <p className="font-medium">Customer</p>
          <p>{order.shippingAddress}</p>
        </div>
      </div>
      
      {/* Action Buttons */}
      {user?.isAdmin && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <div className="space-y-2">
            {order.status === "awaiting_approval" && (
              <Button 
                className="w-full bg-success text-white hover:bg-success/90"
                onClick={() => handleStatusChange("in_production")}
                disabled={updateStatusMutation.isPending}
              >
                Approve Design & Start Production
              </Button>
            )}
            
            {order.status === "in_production" && (
              <Button 
                className="w-full bg-success text-white hover:bg-success/90"
                onClick={() => handleStatusChange("shipped")}
                disabled={updateStatusMutation.isPending}
              >
                Mark as Shipped
              </Button>
            )}
            
            {order.status === "shipped" && (
              <Button 
                className="w-full bg-success text-white hover:bg-success/90"
                onClick={() => handleStatusChange("delivered")}
                disabled={updateStatusMutation.isPending}
              >
                Mark as Delivered
              </Button>
            )}
            
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <Button 
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                variant="outline"
                onClick={() => handleStatusChange("cancelled")}
                disabled={updateStatusMutation.isPending}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      )}
      
      {!user?.isAdmin && order.status === "awaiting_approval" && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <div className="space-y-2">
            <Button className="w-full bg-success text-white hover:bg-success/90">
              Approve Design
            </Button>
            <Button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50" variant="outline">
              Request Changes
            </Button>
          </div>
        </div>
      )}
    </ScrollArea>
  );
};

export default OrderDetails;
