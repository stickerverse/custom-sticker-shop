import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  
  // Fetch orders data
  const { 
    data: orders, 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && !!user?.isAdmin,
  });
  
  // Fetch conversations data
  const { 
    data: conversations, 
    isLoading: conversationsLoading, 
    error: conversationsError 
  } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated && !!user?.isAdmin,
  });
  
  // Fetch products data
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError 
  } = useQuery({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && !!user?.isAdmin,
  });
  
  // Fetch order details when selected
  const { 
    data: orderDetails, 
    isLoading: orderDetailsLoading 
  } = useQuery({
    queryKey: [`/api/orders/${selectedOrder}`],
    enabled: !!selectedOrder,
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      return apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${variables.orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status Updated",
        description: `Order status has been updated to ${variables.status}`,
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
  
  // Handle status change
  const handleStatusChange = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };
  
  // If not authenticated or not admin, redirect to home
  useEffect(() => {
    if (isAuthenticated && !user?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation, toast]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <span className="material-icons text-primary text-5xl mb-4">lock</span>
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">
            Please login to access the admin dashboard.
          </p>
          <Button className="bg-primary text-white hover:bg-primary/90 w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated && !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <span className="material-icons text-primary text-5xl mb-4">error</span>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 w-full"
            onClick={() => setLocation("/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
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
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Avatar>
                  <AvatarFallback>{user?.displayName?.[0] || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-medium">{user?.displayName || "Admin"}</h2>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                <Button 
                  variant={activeTab === "dashboard" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <span className="material-icons mr-2 text-sm">dashboard</span>
                  Dashboard
                </Button>
                <Button 
                  variant={activeTab === "orders" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("orders")}
                >
                  <span className="material-icons mr-2 text-sm">shopping_bag</span>
                  Orders
                </Button>
                <Button 
                  variant={activeTab === "conversations" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("conversations")}
                >
                  <span className="material-icons mr-2 text-sm">chat</span>
                  Messages
                </Button>
                <Button 
                  variant={activeTab === "products" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("products")}
                >
                  <span className="material-icons mr-2 text-sm">inventory_2</span>
                  Products
                </Button>
                <Separator className="my-2" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-500"
                  onClick={() => setLocation("/")}
                >
                  <span className="material-icons mr-2 text-sm">logout</span>
                  Back to Shop
                </Button>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 hidden">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard">
              <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Total Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ordersLoading ? "..." : orders?.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Pending Approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ordersLoading ? "..." : orders?.filter((o: any) => o.status === "awaiting_approval").length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Needs your attention
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Unread Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {conversationsLoading ? "..." : "5"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      From 3 conversations
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ordersLoading ? "..." : formatPrice(orders?.reduce((sum: number, order: any) => sum + order.total, 0) || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      +18% from last month
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ordersLoading ? (
                      <p className="text-center py-4 text-gray-500">Loading activity...</p>
                    ) : orders?.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-start">
                        <span className={`w-2 h-2 mt-2 rounded-full ${statusColorMap[order.status] || "bg-gray-400"} mr-3`}></span>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Order #{order.id}</span> status changed to {" "}
                            <span className="font-medium">{statusTextMap[order.status] || order.status}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="orders">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Orders</h1>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                    <SelectItem value="in_production">In Production</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Orders List */}
                <div className="md:w-2/5 lg:w-1/3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Orders List</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        {ordersLoading ? (
                          <div className="p-4 text-center text-gray-500">
                            Loading orders...
                          </div>
                        ) : ordersError ? (
                          <div className="p-4 text-center text-red-500">
                            Error loading orders
                          </div>
                        ) : orders?.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No orders found
                          </div>
                        ) : (
                          <div className="divide-y">
                            {orders?.map((order: any) => (
                              <div 
                                key={order.id} 
                                className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedOrder === order.id ? 'bg-gray-50' : ''}`}
                                onClick={() => setSelectedOrder(order.id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">Order #{order.id}</div>
                                    <div className="text-sm text-gray-500">
                                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                                    </div>
                                  </div>
                                  <Badge className={`${statusColorMap[order.status] || "bg-gray-400"} text-white`}>
                                    {statusTextMap[order.status] || order.status}
                                  </Badge>
                                </div>
                                <div className="mt-2 text-sm">
                                  <span className="font-medium">{formatPrice(order.total)}</span>
                                  <span className="text-gray-500 ml-2">{order.itemCount} items</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Order Details */}
                <div className="md:w-3/5 lg:w-2/3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedOrder ? (
                        <div className="text-center py-8 text-gray-500">
                          <span className="material-icons text-gray-300 text-4xl mb-2">receipt</span>
                          <p>Select an order to view details</p>
                        </div>
                      ) : orderDetailsLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading order details...
                        </div>
                      ) : !orderDetails ? (
                        <div className="text-center py-8 text-gray-500">
                          Order not found
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h2 className="text-xl font-semibold">Order #{orderDetails.id}</h2>
                              <p className="text-sm text-gray-500">
                                Placed on {format(new Date(orderDetails.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <Select 
                              value={orderDetails.status}
                              onValueChange={(value) => handleStatusChange(orderDetails.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                                <SelectItem value="in_production">In Production</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h3 className="font-medium mb-2">Shipping Address</h3>
                              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                                {orderDetails.shippingAddress}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Payment Information</h3>
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                <div className="flex justify-between mb-1">
                                  <span>Subtotal:</span>
                                  <span>{formatPrice(orderDetails.total * 0.9)}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                  <span>Shipping:</span>
                                  <span>{formatPrice(orderDetails.total * 0.1)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                  <span>Total:</span>
                                  <span>{formatPrice(orderDetails.total)}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  Paid with Credit Card
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="font-medium mb-2">Order Items</h3>
                          <div className="bg-gray-50 p-3 rounded mb-6">
                            {orderDetails.items?.map((item: any) => (
                              <div key={item.id} className="flex items-center py-2 border-b border-gray-200 last:border-0">
                                <div className="w-12 h-12 rounded bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.product?.imageUrl} 
                                    alt={item.product?.title} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="ml-3 flex-grow">
                                  <div className="font-medium">{item.product?.title}</div>
                                  <div className="text-xs text-gray-500">
                                    {Object.entries(item.options)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(", ")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatPrice(item.price)}</div>
                                  <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              className="bg-secondary text-white hover:bg-secondary/90"
                              onClick={() => setLocation(`/chat/${orderDetails.conversationId || 1}`)}
                            >
                              <span className="material-icons mr-2 text-sm">chat</span>
                              Message Customer
                            </Button>
                            
                            {orderDetails.status === "awaiting_approval" && (
                              <Button 
                                className="bg-success text-white hover:bg-success/90"
                                onClick={() => handleStatusChange(orderDetails.id, "in_production")}
                                disabled={updateStatusMutation.isPending}
                              >
                                Approve Design
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="conversations">
              <h1 className="text-2xl font-bold mb-6">Customer Messages</h1>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversationsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading conversations...
                    </div>
                  ) : conversationsError ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading conversations
                    </div>
                  ) : conversations?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="material-icons text-gray-300 text-4xl mb-2">chat</span>
                      <p>No active conversations</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations?.map((conversation: any) => (
                        <div key={conversation.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start">
                            <Avatar className="mr-3">
                              <AvatarImage src={conversation.product?.imageUrl} />
                              <AvatarFallback>
                                {conversation.product?.title?.charAt(0) || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <div>
                                  <div className="font-medium">Customer</div>
                                  <div className="text-sm text-gray-500">
                                    Order #{conversation.orderId} - {conversation.product?.title}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {statusTextMap[conversation.order?.status] || conversation.order?.status}
                                </Badge>
                              </div>
                              <p className="text-sm mt-1 text-gray-600">
                                {conversation.lastMessage?.content || "No messages yet"}
                              </p>
                              <div className="mt-2">
                                <Button 
                                  size="sm"
                                  onClick={() => setLocation(`/chat/${conversation.id}`)}
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="products">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <span className="material-icons mr-2 text-sm">add</span>
                  Add Product
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Product Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading products...
                    </div>
                  ) : productsError ? (
                    <div className="text-center py-8 text-red-500">
                      Error loading products
                    </div>
                  ) : products?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="material-icons text-gray-300 text-4xl mb-2">inventory_2</span>
                      <p>No products found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Product</th>
                            <th className="text-left p-2 font-medium">Category</th>
                            <th className="text-left p-2 font-medium">Price</th>
                            <th className="text-left p-2 font-medium">Status</th>
                            <th className="text-right p-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products?.map((product: any) => (
                            <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 mr-3">
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="font-medium">{product.title}</div>
                                </div>
                              </td>
                              <td className="p-2">
                                <Badge variant="outline">
                                  {product.categoryId === 1 ? 'Decorative' : 
                                   product.categoryId === 2 ? 'Laptop' : 
                                   product.categoryId === 3 ? 'Water Bottle' : 'Other'}
                                </Badge>
                              </td>
                              <td className="p-2">{formatPrice(499)}</td>
                              <td className="p-2">
                                <Badge className="bg-green-500 text-white">Active</Badge>
                              </td>
                              <td className="p-2 text-right">
                                <Button variant="ghost" size="sm">
                                  <span className="material-icons text-gray-500 text-sm">edit</span>
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <span className="material-icons text-gray-500 text-sm">delete</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
