import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, X, Image, Tag, DollarSign, Box, List, PlusCircle, Save, Eye, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: number;
  inventoryCount: number;
  published: boolean;
  ebayItemId?: string;
  ebayUrl?: string;
  createdAt: Date;
  customizationOptions?: ProductOption[];
}

interface ProductOption {
  id: number;
  productId: number;
  optionType: string;
  optionValue: string;
  priceModifier: number;
}

const ProductCustomizer = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'unpublished'>('all');
  const [bulkActionEnabled, setBulkActionEnabled] = useState(false);
  
  // Form state
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: 0,
    categoryId: 1,
    inventoryCount: 10,
    published: false,
    imageUrl: '',
  });
  
  // Product options state
  const [productOptions, setProductOptions] = useState<{
    optionType: string;
    optionValue: string;
    priceModifier: number;
  }[]>([]);
  
  // Fetch products
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError 
  } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Fetch categories
  const { 
    data: categories, 
    isLoading: categoriesLoading 
  } = useQuery({
    queryKey: ["/api/product-categories"],
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (product: any) => {
      return apiRequest('PATCH', `/api/products/${product.id}`, product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: 'Product Updated',
        description: 'Product has been successfully updated',
      });
      setEditingProduct(null);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update product',
        variant: 'destructive',
      });
    }
  });
  
  // Add option mutation
  const addOptionMutation = useMutation({
    mutationFn: async (option: any) => {
      return apiRequest('POST', `/api/products/${option.productId}/options`, option);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: 'Option Added',
        description: 'Product option has been successfully added',
      });
    },
    onError: (error) => {
      toast({
        title: 'Option Addition Failed',
        description: error instanceof Error ? error.message : 'Could not add product option',
        variant: 'destructive',
      });
    }
  });
  
  // Delete option mutation
  const deleteOptionMutation = useMutation({
    mutationFn: async ({ productId, optionId }: { productId: number; optionId: number }) => {
      return apiRequest('DELETE', `/api/products/${productId}/options/${optionId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: 'Option Deleted',
        description: 'Product option has been successfully deleted',
      });
    },
    onError: (error) => {
      toast({
        title: 'Option Deletion Failed',
        description: error instanceof Error ? error.message : 'Could not delete product option',
        variant: 'destructive',
      });
    }
  });
  
  // Bulk publish mutation
  const bulkPublishMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      return apiRequest('POST', '/api/products/bulk-publish', { productIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: 'Products Published',
        description: `${selectedProducts.length} products have been published`,
      });
      setSelectedProducts([]);
    },
    onError: (error) => {
      toast({
        title: 'Bulk Publish Failed',
        description: error instanceof Error ? error.message : 'Could not publish products',
        variant: 'destructive',
      });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest('DELETE', `/api/products/${productId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: 'Product Deleted',
        description: 'Product has been successfully deleted',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Could not delete product',
        variant: 'destructive',
      });
    }
  });
  
  // Effect to update form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        title: editingProduct.title || '',
        description: editingProduct.description || '',
        price: editingProduct.price || 0,
        categoryId: editingProduct.categoryId || 1,
        inventoryCount: editingProduct.inventoryCount || 10,
        published: editingProduct.published || false,
        imageUrl: editingProduct.imageUrl || '',
      });
      
      setProductOptions(
        editingProduct.customizationOptions?.map(option => ({
          optionType: option.optionType,
          optionValue: option.optionValue,
          priceModifier: option.priceModifier,
        })) || []
      );
    } else {
      resetForm();
    }
  }, [editingProduct]);
  
  // Reset form
  const resetForm = () => {
    setProductForm({
      title: '',
      description: '',
      price: 0,
      categoryId: 1,
      inventoryCount: 10,
      published: false,
      imageUrl: '',
    });
    setProductOptions([]);
  };
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle option field changes
  const handleOptionChange = (index: number, field: string, value: any) => {
    const updatedOptions = [...productOptions];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    setProductOptions(updatedOptions);
  };
  
  // Add new option
  const addOption = () => {
    setProductOptions([
      ...productOptions, 
      { optionType: 'size', optionValue: '', priceModifier: 0 }
    ]);
  };
  
  // Remove option
  const removeOption = (index: number) => {
    const updatedOptions = productOptions.filter((_, i) => i !== index);
    setProductOptions(updatedOptions);
  };
  
  // Save product changes
  const saveProductChanges = async () => {
    if (!editingProduct) return;
    
    try {
      // Update product
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        ...productForm
      });
      
      // Handle options
      // Note: In a real implementation, you'd need to track which options are new,
      // which are updated, and which should be deleted
      
      // For simplicity, we'll assume all options are new in this example
      for (const option of productOptions) {
        await addOptionMutation.mutateAsync({
          productId: editingProduct.id,
          ...option
        });
      }
      
      toast({
        title: 'Product Saved',
        description: 'All product details have been updated successfully',
      });
      
    } catch (error) {
      console.error('Error saving product changes:', error);
    }
  };
  
  // Handle bulk selection
  const handleSelectProduct = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } else {
      setSelectedProducts(prev => [...prev, productId]);
    }
  };
  
  // Handle bulk publish
  const handleBulkPublish = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select products to publish',
        variant: 'destructive',
      });
      return;
    }
    
    bulkPublishMutation.mutate(selectedProducts);
  };
  
  // Filter products based on publication status
  const getFilteredProducts = () => {
    if (!products) return [];
    
    if (filterPublished === 'all') return products;
    if (filterPublished === 'published') return products.filter((p: Product) => p.published);
    if (filterPublished === 'unpublished') return products.filter((p: Product) => !p.published);
    
    return products;
  };
  
  // Toggle selection of all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === getFilteredProducts().length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(getFilteredProducts().map((p: Product) => p.id));
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Imported Products</h1>
          <p className="text-muted-foreground">Customize and publish your imported products</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select 
            value={filterPublished} 
            onValueChange={(value: 'all' | 'published' | 'unpublished') => setFilterPublished(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="h-1.5 w-1.5 bg-current rounded-sm" />
                <div className="h-1.5 w-1.5 bg-current rounded-sm" />
                <div className="h-1.5 w-1.5 bg-current rounded-sm" />
                <div className="h-1.5 w-1.5 bg-current rounded-sm" />
              </div>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enableBulk" 
              checked={bulkActionEnabled}
              onCheckedChange={(checked) => setBulkActionEnabled(!!checked)}
            />
            <Label htmlFor="enableBulk">Bulk Actions</Label>
          </div>
        </div>
      </div>
      
      {bulkActionEnabled && (
        <div className="flex items-center justify-between bg-muted p-3 rounded-md">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="selectAll" 
              checked={selectedProducts.length > 0 && selectedProducts.length === getFilteredProducts().length}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="selectAll">Select All</Label>
            <span className="text-muted-foreground text-sm">
              {selectedProducts.length} products selected
            </span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedProducts([])}
            >
              Clear Selection
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleBulkPublish}
              disabled={selectedProducts.length === 0 || bulkPublishMutation.isPending}
            >
              {bulkPublishMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Publish Selected
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {productsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading products...</span>
        </div>
      ) : productsError ? (
        <Alert variant="destructive">
          <AlertTitle>Error loading products</AlertTitle>
          <AlertDescription>
            There was an error loading products. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-md border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b font-semibold text-sm">
                {bulkActionEnabled && <div className="col-span-1"></div>}
                <div className={`col-span-${bulkActionEnabled ? '2' : '3'}`}>Image</div>
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-1">Inventory</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              <ScrollArea className="h-[600px]">
                {getFilteredProducts().length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No products found matching your criteria
                  </div>
                ) : (
                  getFilteredProducts().map((product: Product) => (
                    <div 
                      key={product.id} 
                      className="grid grid-cols-12 gap-4 p-4 border-b items-center hover:bg-gray-50"
                    >
                      {bulkActionEnabled && (
                        <div className="col-span-1">
                          <Checkbox 
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => handleSelectProduct(product.id)}
                          />
                        </div>
                      )}
                      
                      <div className={`col-span-${bulkActionEnabled ? '2' : '3'}`}>
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.title} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <Image className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-3">
                        <h3 className="font-medium truncate">{product.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {product.description?.substring(0, 60)}
                          {product.description?.length > 60 ? '...' : ''}
                        </p>
                        {product.ebayItemId && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              eBay ID: {product.ebayItemId}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <span className="font-medium">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      
                      <div className="col-span-1">
                        <span className="text-sm">
                          {product.inventoryCount}
                        </span>
                      </div>
                      
                      <div className="col-span-1">
                        <Badge variant={product.published ? 'default' : 'secondary'}>
                          {product.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2 flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getFilteredProducts().map((product: Product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <Image className="h-12 w-12" />
                      </div>
                    )}
                    
                    {bulkActionEnabled && (
                      <div className="absolute top-2 left-2">
                        <Checkbox 
                          className="h-5 w-5 bg-white rounded-md border-gray-200" 
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </div>
                    )}
                    
                    <Badge 
                      variant={product.published ? 'default' : 'secondary'}
                      className="absolute top-2 right-2"
                    >
                      {product.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg truncate">{product.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">{formatPrice(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Inventory</p>
                        <p className="font-semibold">{product.inventoryCount}</p>
                      </div>
                    </div>
                    
                    {product.customizationOptions && product.customizationOptions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Options</p>
                        <div className="flex flex-wrap gap-1">
                          {product.customizationOptions.slice(0, 3).map((option) => (
                            <Badge key={option.id} variant="outline" className="text-xs">
                              {option.optionType}: {option.optionValue}
                            </Badge>
                          ))}
                          {product.customizationOptions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.customizationOptions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant={product.published ? 'ghost' : 'default'} 
                      size="sm"
                      onClick={() => {
                        updateProductMutation.mutate({
                          id: product.id,
                          published: !product.published
                        });
                      }}
                    >
                      {product.published ? 'Unpublish' : 'Publish'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Product editing modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit Product</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              <Tabs defaultValue="basic">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="options">Customization Options</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-title">Product Title</Label>
                        <Input 
                          id="product-title" 
                          value={productForm.title} 
                          onChange={(e) => handleFormChange('title', e.target.value)}
                          placeholder="Enter product title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="product-description">Description</Label>
                        <Textarea 
                          id="product-description" 
                          value={productForm.description} 
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Enter product description"
                          rows={5}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Price ($)</Label>
                          <Input 
                            id="product-price" 
                            type="number" 
                            min="0" 
                            step="0.01"
                            value={productForm.price / 100} 
                            onChange={(e) => handleFormChange('price', Number(e.target.value) * 100)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="product-inventory">Inventory</Label>
                          <Input 
                            id="product-inventory" 
                            type="number" 
                            min="0" 
                            value={productForm.inventoryCount} 
                            onChange={(e) => handleFormChange('inventoryCount', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="product-category">Category</Label>
                        <Select 
                          value={String(productForm.categoryId)} 
                          onValueChange={(value) => handleFormChange('categoryId', Number(value))}
                        >
                          <SelectTrigger id="product-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                              </SelectItem>
                            )) || (
                              <SelectItem value="1">Stickers</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="product-published" 
                          checked={productForm.published}
                          onCheckedChange={(checked) => handleFormChange('published', !!checked)}
                        />
                        <Label htmlFor="product-published">Publish this product</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-image">Product Image URL</Label>
                        <Input 
                          id="product-image" 
                          value={productForm.imageUrl} 
                          onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                          placeholder="Enter image URL"
                        />
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden aspect-square bg-gray-100">
                        {productForm.imageUrl ? (
                          <img 
                            src={productForm.imageUrl} 
                            alt="Product preview" 
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                            <Image className="h-16 w-16 mb-2" />
                            <p className="text-sm">No image provided</p>
                          </div>
                        )}
                      </div>
                      
                      {editingProduct.ebayItemId && (
                        <Alert>
                          <AlertTitle className="flex items-center">
                            eBay Source
                            <Badge className="ml-2">Imported</Badge>
                          </AlertTitle>
                          <AlertDescription>
                            <p className="text-sm">eBay Item ID: <span className="font-mono">{editingProduct.ebayItemId}</span></p>
                            {editingProduct.ebayUrl && (
                              <p className="text-sm mt-1">
                                <a href={editingProduct.ebayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                  View on eBay
                                </a>
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="options" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Customization Options</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addOption}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                  
                  {productOptions.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Tag className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">No Options Added</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add customization options like size, color, or material
                      </p>
                      <Button onClick={addOption}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Your First Option
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productOptions.map((option, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Option {index + 1}</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`option-type-${index}`}>Option Type</Label>
                              <Select 
                                value={option.optionType} 
                                onValueChange={(value) => handleOptionChange(index, 'optionType', value)}
                              >
                                <SelectTrigger id={`option-type-${index}`}>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="size">Size</SelectItem>
                                  <SelectItem value="material">Material</SelectItem>
                                  <SelectItem value="finish">Finish</SelectItem>
                                  <SelectItem value="shape">Shape</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`option-value-${index}`}>Option Value</Label>
                              <Input 
                                id={`option-value-${index}`} 
                                value={option.optionValue} 
                                onChange={(e) => handleOptionChange(index, 'optionValue', e.target.value)}
                                placeholder="e.g. Small, Red, Glossy"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`option-price-${index}`}>Price Modifier ($)</Label>
                              <Input 
                                id={`option-price-${index}`} 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={option.priceModifier / 100} 
                                onChange={(e) => handleOptionChange(index, 'priceModifier', Number(e.target.value) * 100)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">SEO Settings</h3>
                    <div className="space-y-2">
                      <Label htmlFor="meta-title">Meta Title</Label>
                      <Input 
                        id="meta-title" 
                        placeholder="Enter meta title (for SEO)"
                        defaultValue={productForm.title}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="meta-description">Meta Description</Label>
                      <Textarea 
                        id="meta-description" 
                        placeholder="Enter meta description (for SEO)"
                        defaultValue={productForm.description?.substring(0, 160)}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">Shipping Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-weight">Weight (oz)</Label>
                        <Input id="product-weight" type="number" min="0" step="0.1" defaultValue="1.0" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="shipping-class">Shipping Class</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger id="shipping-class">
                            <SelectValue placeholder="Select shipping class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="economy">Economy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <Button variant="ghost" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Preview functionality would go here
                    toast({
                      title: 'Preview Feature',
                      description: 'Product preview is not available in this demo',
                    });
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  onClick={saveProductChanges}
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCustomizer;