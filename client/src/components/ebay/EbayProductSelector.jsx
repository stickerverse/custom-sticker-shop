import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileDown, RefreshCw, AlertCircle, CheckCircle2, Filter, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

const EbayProductSelector = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [importResults, setImportResults] = useState(null);

  // Fetch products from eBay
  useEffect(() => {
    fetchEbayProducts();
  }, []);

  const fetchEbayProducts = async () => {
    setIsLoading(true);

    try {
      // This endpoint should return eBay products without importing them
      const response = await apiRequest('GET', '/api/ebay/products', undefined);

      // Check for specific authentication errors
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        
        if (errorData.missingCredentials) {
          toast({
            title: 'eBay API Configuration Required',
            description: 'Please provide your eBay API token with correct permissions in your environment settings.',
            variant: 'destructive',
            duration: 8000,
          });
          setProducts([]);
          setIsLoading(false);
          return;
        }
      }

      const data = await response.json();
      setProducts(data.products || []);

      // Initialize selected state for all products (default to selected)
      const initialSelected = {};
      data.products.forEach(product => {
        initialSelected[product.itemId || product.sku] = true;
      });
      setSelectedProducts(initialSelected);

      toast({
        title: 'Products Loaded',
        description: `${data.products.length} products loaded from eBay`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Check if this is an authentication error
      if (error.message && error.message.includes('403')) {
        toast({
          title: 'eBay API Permission Error',
          description: 'Your eBay API token lacks the required permissions. Please update your token with appropriate scopes.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        toast({
          title: 'Failed to Load Products',
          description: 'Could not fetch products from eBay. Please try again or check your API configuration.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection for a single product
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Toggle all products selection
  const toggleAllProducts = (selectAll) => {
    const newSelectedState = {};
    products.forEach(product => {
      const id = product.itemId || product.sku;
      newSelectedState[id] = selectAll;
    });
    setSelectedProducts(newSelectedState);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    const title = product.title || 
      product.product?.title || 
      product.inventoryItem?.product?.title ||
      product.sku || 
      "";

    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Count selected products
  const selectedCount = Object.values(selectedProducts).filter(selected => selected).length;

  // Import selected products
  const importSelectedProducts = async () => {
    setIsImporting(true);

    try {
      // Get IDs of selected products
      const productIdsToImport = Object.entries(selectedProducts)
        .filter(([_, selected]) => selected)
        .map(([id, _]) => id);

      // Call API to import only selected products
      const response = await apiRequest('POST', '/api/ebay/import-selected', {
        productIds: productIdsToImport
      });

      const data = await response.json();
      setImportResults(data);

      toast({
        title: 'Import Successful',
        description: `${data.importedCount} products have been imported to your store`,
        variant: 'default',
      });

      // Redirect back to admin after 3 seconds
      setTimeout(() => {
        setLocation('/admin');
      }, 3000);
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        title: 'Import Failed',
        description: 'Could not import selected products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Extract details from product
  const getProductDetails = (product) => {
    const id = product.itemId || product.sku || 'unknown';
    const title = product.title || 
      product.product?.title || 
      product.inventoryItem?.product?.title ||
      product.sku || 
      "eBay Product";

    let price = 'N/A';
    if (product.price?.value) {
      price = product.price.value;
    } else if (product.offers && Array.isArray(product.offers) && product.offers.length > 0) {
      const offer = product.offers[0];
      if (offer.price?.value) {
        price = offer.price.value;
      }
    }

    const imageUrl = product.image?.imageUrl || 
      product.product?.imageUrls?.[0] ||
      product.inventoryItem?.product?.imageUrls?.[0] ||
      "https://i.imgur.com/FV6jJVk.jpg";

    return { id, title, price, imageUrl };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Products to Import</CardTitle>
        <CardDescription>
          Choose which eBay products you want to import into your sticker shop
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-1/2">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleAllProducts(true)}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleAllProducts(false)}
            >
              Deselect All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchEbayProducts}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Product Selection Counter */}
        <div className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="mr-2">
            {selectedCount} of {products.length}
          </Badge>
          products selected for import
        </div>

        {/* Product List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Products Found</AlertTitle>
            <AlertDescription>
              No eBay products were found. Check your eBay store connection or try refreshing.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-[auto,auto,1fr,auto] gap-2 p-3 border-b bg-muted/50 font-medium text-sm">
              <div className="w-8 flex items-center justify-center">
                <Checkbox
                  checked={
                    products.length > 0 && 
                    filteredProducts.every(product => 
                      selectedProducts[product.itemId || product.sku]
                    )
                  }
                  onCheckedChange={(checked) => {
                    toggleAllProducts(!!checked);
                  }}
                />
              </div>
              <div className="w-12"></div>
              <div>Product</div>
              <div className="text-right">Price</div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.map(product => {
                const { id, title, price, imageUrl } = getProductDetails(product);
                return (
                  <div key={id} className="grid grid-cols-[auto,auto,1fr,auto] gap-2 p-3 border-b items-center hover:bg-muted/20">
                    <div className="w-8 flex items-center justify-center">
                      <Checkbox
                        checked={!!selectedProducts[id]}
                        onCheckedChange={() => toggleProductSelection(id)}
                      />
                    </div>
                    <div className="w-12">
                      <div className="w-10 h-10 rounded-md overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://i.imgur.com/FV6jJVk.jpg";
                          }}
                        />
                      </div>
                    </div>
                    <div className="font-medium text-sm">
                      {title.length > 50 ? `${title.substring(0, 50)}...` : title}
                    </div>
                    <div className="text-right">
                      ${parseFloat(price).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {importResults && (
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Import Completed</AlertTitle>
            <AlertDescription>
              Successfully imported {importResults.importedCount} products to your store.
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-2">
                  {importResults.errors.length} products failed to import.
                </div>
              )}
              <div className="mt-2">
                Redirecting to Admin Dashboard...
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedCount} products selected
        </div>

        <Button 
          onClick={importSelectedProducts}
          disabled={isImporting || selectedCount === 0}
          className="ml-auto"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Import Selected ({selectedCount})
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EbayProductSelector;