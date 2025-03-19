import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import EbayProductSelector from '@/components/ebay/EbayProductSelector';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store } from 'lucide-react';

export default function EbaySelection() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to admin page if not authenticated or not admin
  if (!isAuthenticated || (user && !user.isAdmin)) {
    setLocation('/');
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
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

      <div className="bg-card rounded-lg border shadow-sm">
        <EbayProductSelector />
      </div>
    </div>
  );
}