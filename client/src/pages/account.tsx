import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Account = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: user?.displayName || "",
    email: user?.email || ""
  });
  const [isEbayImportLoading, setIsEbayImportLoading] = useState(false);

  // Orders query
  const {
    data: orders = [],
    isLoading: ordersLoading
  } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profile: { displayName: string; email: string }) => {
      return apiRequest("PATCH", "/api/auth/profile", profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update profile",
        variant: "destructive",
      });
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Status mapping
  const statusMap: Record<string, { label: string, color: string }> = {
    "pending": { label: "Pending", color: "bg-yellow-400" },
    "processing": { label: "Processing", color: "bg-blue-400" },
    "awaiting_approval": { label: "Awaiting Approval", color: "bg-yellow-400" },
    "in_production": { label: "In Production", color: "bg-blue-600" },
    "shipped": { label: "Shipped", color: "bg-green-500" },
    "delivered": { label: "Delivered", color: "bg-green-700" },
    "cancelled": { label: "Cancelled", color: "bg-red-500" }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-2">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl">{user.displayName?.[0] || user.username[0]}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center">{user.displayName || user.username}</CardTitle>
              <CardDescription className="text-center">{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <TabsList className="grid w-full grid-cols-1 mb-4">
                <TabsTrigger 
                  value="profile" 
                  onClick={() => setActiveTab("profile")}
                  className={activeTab === "profile" ? "bg-primary text-white" : ""}
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  onClick={() => setActiveTab("orders")}
                  className={activeTab === "orders" ? "bg-primary text-white" : ""}
                >
                  Orders
                </TabsTrigger>
                {user.isAdmin && (
                  <TabsTrigger 
                    value="integrations" 
                    onClick={() => setActiveTab("integrations")}
                    className={activeTab === "integrations" ? "bg-primary text-white" : ""}
                  >
                    Integrations
                  </TabsTrigger>
                )}
              </TabsList>
              <Separator className="my-4" />
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <span className="material-icons mr-2 text-sm">logout</span>
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} className="w-full">
            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Profile Information</CardTitle>
                    <Button 
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                    >
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input 
                            id="displayName" 
                            value={profile.displayName} 
                            onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={profile.email} 
                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input 
                            id="username" 
                            value={user.username} 
                            disabled
                            className="bg-gray-100"
                          />
                          <p className="text-sm text-gray-500 mt-1">Username cannot be changed</p>
                        </div>
                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Display Name</h3>
                          <p>{user.displayName || "Not set"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p>{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Username</h3>
                          <p>{user.username}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                          <p>{user.isAdmin ? "Administrator" : "Customer"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {user.isAdmin && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Admin Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => setLocation('/admin')} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <span className="material-icons mr-2 text-sm">dashboard</span>
                      Go to Admin Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full text-primary"></div>
                      <p className="mt-2 text-gray-500">Loading your orders...</p>
                    </div>
                  ) : orders?.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-gray-300 text-5xl mb-2">shopping_bag</span>
                      <p className="text-gray-500">You haven't placed any orders yet</p>
                      <Button 
                        onClick={() => setLocation('/shop')} 
                        className="mt-4"
                      >
                        Browse Products
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {orders?.map((order: any) => (
                          <div key={order.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">Order #{order.id}</h3>
                                <p className="text-sm text-gray-500">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <Badge className={`${statusMap[order.status]?.color || "bg-gray-400"} text-white`}>
                                {statusMap[order.status]?.label || order.status}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-medium">{formatPrice(order.total)}</span>
                                <span className="text-gray-500 ml-2">•</span>
                                <span className="text-gray-500 ml-2">{order.itemCount || order.items?.length || "N/A"} items</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setLocation(`/orders/${order.id}`)}
                                >
                                  View Details
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setLocation(`/chat?orderId=${order.id}`)}
                                >
                                  <span className="material-icons text-sm">chat</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Integrations Tab (Admin Only) */}
            {user.isAdmin && (
              <TabsContent value="integrations">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketplace Integrations</CardTitle>
                    <CardDescription>
                      Connect your store with external marketplaces
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* eBay Integration */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-[#e43037] rounded-full flex items-center justify-center mr-4">
                              <span className="material-icons text-white">shopping_cart</span>
                            </div>
                            <div>
                              <h3 className="font-medium">eBay</h3>
                              <p className="text-sm text-gray-500">Import your eBay listings</p>
                            </div>
                          </div>
                          <Button 
                            onClick={handleEbayImport}
                            className="bg-[#e43037] hover:bg-[#c41e25] text-white"
                            disabled={ebayImportMutation.isPending}
                          >
                            {ebayImportMutation.isPending ? (
                              <span className="animate-spin mr-2">⏳</span>
                            ) : (
                              <span className="material-icons mr-2 text-sm">sync</span>
                            )}
                            Import Products
                          </Button>
                        </div>
                        
                        <div className="mt-4">
                          <Alert>
                            <span className="material-icons mr-2">info</span>
                            <AlertTitle>Integration Status</AlertTitle>
                            <AlertDescription>
                              This integration uses the eBay API to import your product listings.
                              Make sure you have set up the EBAY_APP_ID and EBAY_SECRET environment variables.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                      
                      {/* Placeholder for future integrations */}
                      <div className="border rounded-lg p-4 opacity-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-[#F27E31] rounded-full flex items-center justify-center mr-4">
                              <span className="material-icons text-white">store</span>
                            </div>
                            <div>
                              <h3 className="font-medium">Etsy</h3>
                              <p className="text-sm text-gray-500">Import your Etsy listings</p>
                            </div>
                          </div>
                          <Button disabled className="bg-[#F27E31] text-white opacity-50">
                            <span className="material-icons mr-2 text-sm">sync</span>
                            Coming Soon
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Account;