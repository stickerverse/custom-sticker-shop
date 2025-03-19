import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import EbayProductSelector from '@/components/ebay/EbayProductSelector';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, CheckCircle, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * eBay product selection and import page
 * Allows admins to select products from their eBay store to import
 */
export default function EbaySelection() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [importCompleted, setImportCompleted] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Redirect to admin page if not authenticated or not admin
  if (!isAuthenticated || (user && !user.isAdmin)) {
    setLocation('/');
    return null;
  }

  /**
   * Handle successful import completion
   * @param results Import results containing status and counts
   */
  const handleImportComplete = (results: {
    success: boolean;
    importedCount: number;
    errors: any[] | null;
  }) => {
    if (results.success) {
      setImportCompleted(true);
      setImportedCount(results.importedCount);
    }
  };

  /**
   * Navigate to the shop page to view imported products
   */
  const goToShop = () => {
    setLocation('/shop');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center flex-wrap gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/admin')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-2xl font-bold">eBay Product Selection</h1>
          <Badge variant="outline" className="ml-3">
            <Store className="h-3 w-3 mr-1" />
            eBay Integration
          </Badge>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-muted-foreground">
          Select which eBay products you want to import into your sticker shop. You can filter and search through your eBay inventory.
        </p>
      </div>

      {importCompleted ? (
        <div className="bg-card rounded-lg border shadow-sm p-6 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mt-4">Import Completed Successfully</h2>
          <p className="text-center text-muted-foreground mb-4">
            {importedCount} products have been imported to your store. You can now manage these products in your admin dashboard or view them in your shop.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin')}
            >
              <Store className="mr-2 h-4 w-4" />
              Go to Admin
            </Button>
            <Button 
              onClick={goToShop}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              View Products in Shop
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm">
          <EbayProductSelector onImportComplete={handleImportComplete} />
        </div>
      )}
    </div>
  );
}