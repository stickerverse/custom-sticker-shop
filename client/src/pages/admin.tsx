import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import EbayStoreSync from "@/components/admin/EbayStoreSync";
import ProductCustomizer from "@/components/admin/ProductCustomizer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  
  // eBay product import mutation
  const ebayImportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ebay/import-products", {});
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "eBay Import Successful",
        description: `${response.products?.length || 0} products imported from eBay`,
      });
      setActiveTab("products");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Unknown error";
      const missingCredentials = error?.response?.data?.missingCredentials;
      
      if (missingCredentials) {
        toast({
          title: "eBay API Credentials Required",
          description: "Please provide eBay API credentials in the server environment",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });
  
  // Handle eBay import
  const handleEbayImport = () => {
    ebayImportMutation.mutate();
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
                <Button 
                  variant={activeTab === "integrations" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab("integrations")}
                >
                  <span className="material-icons mr-2 text-sm">sync</span>
                  Integrations
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
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                        {ordersLoading ? "..." : (Array.isArray(orders) ? orders.length : 0)}
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
                        {ordersLoading ? "..." : (Array.isArray(orders) ? orders.filter((o: any) => o.status === "awaiting_approval").length : 0)}
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
                        {ordersLoading ? "..." : formatPrice(
                          Array.isArray(orders) ? 
                            orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) 
                            : 0
                        )}
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
                        <CardTitle>Recent Orders</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                          {ordersLoading ? (
                            <div className="text-center py-8 text-gray-500">
                              Loading orders...
                            </div>
                          ) : ordersError ? (
                            <div className="text-center py-8 text-red-500">
                              Error loading orders
                            </div>
                          ) : orders?.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <span className="material-icons text-gray-300 text-4xl mb-2">inbox</span>
                              <p>No orders found</p>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {orders?.map((order: any) => (
                                <div 
                                  key={order.id}
                                  className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedOrder === order.id ? 'bg-gray-50' : ''}`}
                                  onClick={() => setSelectedOrder(order.id)}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium">Order #{order.id}</div>
                                    <Badge className={statusColorMap[order.status] || "bg-gray-400"}>
                                      {statusTextMap[order.status] || order.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mb-1">
                                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm">{order.customer?.name || "Customer"}</div>
                                    <div className="font-medium">{formatPrice(order.total)}</div>
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
                            <span className="material-icons text-gray-300 text-4xl mb-2">info</span>
                            <p>Select an order to view details</p>
                          </div>
                        ) : orderDetailsLoading ? (
                          <div className="text-center py-8 text-gray-500">
                            Loading order details...
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                                <p className="font-medium">{orderDetails?.customer?.name || "Customer"}</p>
                                <p className="text-sm text-gray-600">{orderDetails?.customer?.email || "No email provided"}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
                                <p className="text-sm">{orderDetails?.shippingAddress || "No address provided"}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Order Status</h3>
                                <div className="flex items-center mt-1">
                                  <Badge className={`mr-3 ${statusColorMap[orderDetails?.status] || "bg-gray-400"}`}>
                                    {statusTextMap[orderDetails?.status] || orderDetails?.status}
                                  </Badge>
                                  <Select defaultValue={orderDetails?.status} onValueChange={(value) => handleStatusChange(orderDetails.id, value)}>
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
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Order Total</h3>
                                <p className="text-xl font-medium">{formatPrice(orderDetails?.total || 0)}</p>
                                <div className="flex text-sm text-gray-500 mt-1">
                                  <div className="mr-3">Subtotal: {formatPrice((orderDetails?.total || 0) * 0.85)}</div>
                                  <div>Tax: {formatPrice((orderDetails?.total || 0) * 0.15)}</div>
                                </div>
                              </div>
                            </div>
                            
                            <Separator className="my-6" />
                            
                            <h3 className="font-medium mb-4">Order Items</h3>
                            
                            <div className="space-y-3">
                              {orderDetails?.items?.map((item: any) => (
                                <div key={item.id} className="flex items-center p-3 border rounded-lg">
                                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4">
                                    <img 
                                      src={item.product?.imageUrl || "https://placehold.co/64x64"} 
                                      alt={item.product?.title || "Product"} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">{item.product?.title || "Product"}</h4>
                                    <div className="flex text-sm text-gray-500">
                                      <div className="mr-3">Qty: {item.quantity}</div>
                                      <div>{Object.entries(item.options || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatPrice(item.price || 0)}</div>
                                    <div className="text-sm text-gray-500">
                                      {item.customized ? 'Customized' : 'Standard'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-6 flex justify-between">
                              <Button variant="outline" onClick={() => {
                                // Open conversation for this order
                                setActiveTab("conversations");
                                // Set conversation to this order's conversation ID
                                // We would need to fetch or set this conversation ID
                                // let conversationId = orderDetails?.conversationId;
                              }}>
                                <span className="material-icons mr-2 text-sm">chat</span>
                                Open Communication
                              </Button>
                              
                              <div className="space-x-2">
                                <Button variant="outline">
                                  <span className="material-icons mr-2 text-sm">print</span>
                                  Print Order
                                </Button>
                                <Button 
                                  className={orderDetails?.status === "cancelled" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                                  onClick={() => handleStatusChange(orderDetails?.id, orderDetails?.status === "cancelled" ? "pending" : "cancelled")}
                                >
                                  <span className="material-icons mr-2 text-sm">{orderDetails?.status === "cancelled" ? "restore" : "cancel"}</span>
                                  {orderDetails?.status === "cancelled" ? "Reactivate" : "Cancel Order"}
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="conversations">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Customer Messages</h1>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                    <CardDescription>Manage customer inquiries and order communications</CardDescription>
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
                        <p>No conversations found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {conversations?.map((conversation: any) => (
                          <div key={conversation.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex justify-between mb-2">
                              <div className="font-medium">{conversation.subject || `Conversation #${conversation.id}`}</div>
                              <Badge variant="outline">{conversation.isDirectChat ? 'Direct Chat' : 'Order Chat'}</Badge>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                              {conversation.order ? (
                                <span>Related to Order #{conversation.order.id}</span>
                              ) : (
                                <span>Started {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}</span>
                              )}
                            </div>
                            <div className="flex justify-between">
                              <div className="text-sm">
                                Last message: {formatDistanceToNow(new Date(conversation.lastMessage?.createdAt || conversation.createdAt), { addSuffix: true })}
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => {
                                // Redirect to chat interface with this conversation open
                                setLocation(`/chat?conversation=${conversation.id}`);
                              }}>
                                <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="products">
                <Tabs defaultValue="list">
                  <TabsList className="mb-4">
                    <TabsTrigger value="list">Product List</TabsTrigger>
                    <TabsTrigger value="customize">Customize Imported</TabsTrigger>
                    <TabsTrigger value="add">Add New</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="list">
                    <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold">Products</h1>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleEbayImport}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          disabled={ebayImportMutation.isPending}
                        >
                          {ebayImportMutation.isPending ? (
                            <span className="animate-spin mr-2">⏳</span>
                          ) : (
                            <span className="material-icons mr-2 text-sm">sync</span>
                          )}
                          Import from eBay
                        </Button>
                        <Button className="bg-primary text-white hover:bg-primary/90">
                          <span className="material-icons mr-2 text-sm">add</span>
                          Add Product
                        </Button>
                      </div>
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
                  
                  <TabsContent value="customize">
                    <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold">Customize Imported Products</h1>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Customizer</CardTitle>
                        <CardDescription>Customize imported products before publishing them to your store</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProductCustomizer />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="add">
                    <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold">Add New Product</h1>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Create Product</CardTitle>
                        <CardDescription>Add a new product to your store</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500">
                          <span className="material-icons text-gray-300 text-4xl mb-2">add_box</span>
                          <p>Product creation form coming soon</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="integrations">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Integrations</h1>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>eBay Store Migration</CardTitle>
                      <CardDescription>Import and manage products from your eBay store</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Import EbayStoreSync component here */}
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Sync your eBay store with your custom sticker shop. Import products, export data, and manage your store integration.
                        </p>
                        
                        {/* eBay Store Sync Component */}
                        <EbayStoreSync />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;