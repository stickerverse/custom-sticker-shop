import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CustomizerForm from "./CustomizerForm";

interface ProductDetailProps {
  productId: number;
}

const ProductDetail = ({ productId }: ProductDetailProps) => {
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  // Fetch product details
  interface ProductOption {
    id: number;
    productId: number;
    optionType: string;
    optionValue: string;
    priceModifier: number;
  }
  
  interface Product {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    price?: number;
    options?: ProductOption[];
  }
  
  const { 
    data: product, 
    isLoading, 
    error 
  } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`]
  });
  
  // State for selected options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Handle option selection
  const handleOptionSelect = (optionType: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };
  
  // Calculate price based on selected options
  const calculatePrice = () => {
    if (!product) return 0;
    
    // Base price (example: $4.99 = 499 cents)
    let basePrice = 499;
    
    // Add price modifiers from selected options
    if (product.options) {
      Object.entries(selectedOptions).forEach(([optionType, selectedValue]) => {
        const matchingOption = product.options.find(
          (opt: any) => opt.optionType === optionType && opt.optionValue === selectedValue
        );
        
        if (matchingOption) {
          basePrice += matchingOption.priceModifier;
        }
      });
    }
    
    return basePrice * quantity;
  };
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      // Make sure we have all required options
      const requiredOptionTypes = ["size", "material", "finish"];
      const missingOptions = requiredOptionTypes.filter(type => !selectedOptions[type]);
      
      if (missingOptions.length > 0) {
        throw new Error(`Please select options for: ${missingOptions.join(", ")}`);
      }
      
      // Add to cart
      await addToCart({
        productId: product.id,
        quantity,
        options: selectedOptions
      });
      
      toast({
        title: "Added to Cart",
        description: `${quantity} ${product.title} added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:space-x-8 mt-8">
          <div className="md:w-1/2">
            <Skeleton className="w-full aspect-square rounded-lg" />
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Error loading product. Please try again.</p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }
  
  // Group options by type
  const optionsByType: Record<string, any[]> = {};
  if (product.options) {
    product.options.forEach((option: any) => {
      if (!optionsByType[option.optionType]) {
        optionsByType[option.optionType] = [];
      }
      optionsByType[option.optionType].push(option);
    });
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:space-x-8">
        {/* Product Image with hover effects */}
        <div className="md:w-1/2">
          <div className="rounded-lg overflow-hidden border border-gray-200 relative group">
            <div className="absolute inset-0 bg-gradient-radial from-transparent to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Main image with floating animation */}
            <div className="relative overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-110"
              />
              
              {/* Floating effect elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse delay-300" />
              </div>
              
              {/* Product badges that appear on hover */}
              <div className="absolute bottom-4 left-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <Badge className="bg-primary text-white border-0 shadow-md mr-2">
                  Premium Quality
                </Badge>
                <Badge className="bg-white text-primary border-primary shadow-md">
                  Waterproof
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Thumbnail gallery with hover effects */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            <div className="border border-primary rounded-md p-1 overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full h-auto object-cover aspect-square hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            {/* Placeholder thumbnails with hover effects */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border border-gray-200 rounded-md p-1 bg-gray-50 opacity-70 hover:opacity-100 hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="w-full aspect-square bg-gray-200 hover:bg-gray-100 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Product Information */}
        <div className="md:w-1/2 mt-8 md:mt-0">
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <div className="flex items-center mt-2 mb-4">
            <p className="text-xl font-semibold text-gray-900">{formatPrice(calculatePrice())}</p>
            {quantity > 1 && <span className="text-sm text-gray-500 ml-2">({formatPrice(calculatePrice() / quantity)} each)</span>}
          </div>
          
          <div className="prose prose-sm max-w-none mb-6">
            <p>{product.description}</p>
          </div>
          
          {/* Customizer Form */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4">Customize Your Sticker</h2>
            
            <CustomizerForm 
              optionsByType={optionsByType}
              selectedOptions={selectedOptions}
              onOptionSelect={handleOptionSelect}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </div>
          
          {/* Product Features */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Product Features</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="material-icons text-primary mr-2 text-base">check_circle</span>
                <span>Decorate and personalize laptops, water bottles, and more</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons text-primary mr-2 text-base">check_circle</span>
                <span>Half-cut (kiss-cut) peel-off sticker</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons text-primary mr-2 text-base">check_circle</span>
                <span>Very durable and water resistant</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons text-primary mr-2 text-base">check_circle</span>
                <span>3.2mm white border around each design</span>
              </li>
            </ul>
          </div>
          
          {/* Add to Cart Button */}
          <div className="mt-8">
            <Button 
              className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-2">
              Free shipping on orders over $35
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
