declare module '@/components/ebay/EbayProductSelector' {
  // Define eBay product interface
  interface EbayProduct {
    itemId?: string;
    sku?: string;
    title?: string;
    price?: {
      value: string;
      currency: string;
    };
    offers?: Array<{
      price?: {
        value: string;
        currency: string;
      };
    }>;
    image?: {
      imageUrl: string;
    };
    product?: {
      title?: string;
      description?: string;
      imageUrls?: string[];
    };
    inventoryItem?: {
      product?: {
        title?: string;
        description?: string;
        imageUrls?: string[];
      };
    };
    shortDescription?: string;
    description?: string;
  }

  // Define import results interface
  interface ImportResults {
    success: boolean;
    importedCount: number;
    errors: Array<{
      productId: string;
      error: string;
    }> | null;
  }

  // Component properties
  interface EbayProductSelectorProps {
    onImportComplete?: (results: ImportResults) => void;
  }

  const EbayProductSelector: React.FC<EbayProductSelectorProps>;
  export default EbayProductSelector;
}