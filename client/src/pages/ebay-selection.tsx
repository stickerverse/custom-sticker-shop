import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EbayProductSelector from "@/components/ebay/EbayProductSelector";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const EbaySelectionPage = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // If not authenticated or not admin, redirect to home
  React.useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">eBay Product Selection</h1>
          <Button 
            variant="outline"
            onClick={() => setLocation("/admin")}
          >
            Back to Admin
          </Button>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <EbayProductSelector />
        </div>
      </div>
    </div>
  );
};

export default EbaySelectionPage;