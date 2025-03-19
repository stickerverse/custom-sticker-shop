import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EbayProductSelector from '@/components/ebay/EbayProductSelector';
import { useLocation } from 'wouter';

const EbaySelectionPage: React.FC = () => {
  const [, setLocation] = useLocation();

  // Set document title using useEffect instead of Next.js Head
  useEffect(() => {
    document.title = 'Select eBay Products | Admin Dashboard';
  }, []);

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2 h-auto" 
          onClick={() => setLocation('/admin')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">eBay Product Selection</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Browse your eBay store products and select which ones to import into your sticker shop.
      </p>

      <EbayProductSelector />
    </div>
  );
};

export default EbaySelectionPage;