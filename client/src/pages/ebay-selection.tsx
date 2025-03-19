import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, BookOpen, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import EbayProductSelector from '@/components/ebay/EbayProductSelector';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const EbaySelectionPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  
  // Set document title using useEffect instead of Next.js Head
  useEffect(() => {
    document.title = 'Select eBay Products | Admin Dashboard';
  }, []);
  
  // If not authenticated or not admin, redirect to home
  useEffect(() => {
    if (isAuthenticated && !user?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin tools",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation, toast]);
  
  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access the eBay product selection tool.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 p-2 h-auto" 
            onClick={() => setLocation('/admin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">eBay Product Selection</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center"
        >
          {showHelp ? "Hide Help" : "Show Help"}
          <Info className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Progress steps */}
      <div className="mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span>Step 1: Connect</span>
          <span>Step 2: Select</span>
          <span>Step 3: Import</span>
        </div>
        <Progress value={66} className="h-2" />
      </div>

      {showHelp && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              How to Use the eBay Product Selector
            </CardTitle>
            <CardDescription>
              Follow these steps to import products from your eBay store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium">1. Browse Your Products</h3>
                <p className="text-sm text-muted-foreground">
                  Your eBay products will be displayed below. Use the search function to find specific items.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="text-base font-medium">2. Select Products to Import</h3>
                <p className="text-sm text-muted-foreground">
                  Check the boxes next to products you want to import. You can use "Select All" or "Deselect All" for bulk actions.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="text-base font-medium">3. Import Selected Products</h3>
                <p className="text-sm text-muted-foreground">
                  Click the "Import Selected" button to bring your chosen products into your sticker shop. They will be automatically formatted as stickers with customization options.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground mb-6">
        Browse your eBay store products and select which ones to import into your sticker shop.
        Each selected product will be imported with standard sticker customization options.
      </p>

      <EbayProductSelector />
    </div>
  );
};

export default EbaySelectionPage;