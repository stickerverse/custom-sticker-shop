import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedSticker } from "@/components/ui/animated-sticker";
import { ColorMorph } from "@/components/ui/color-morph";
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
    
    // Base rate is $1.99 per inch of vinyl (199 cents)
    const baseRatePerInch = 199;
    
    // Check for custom size
    if (selectedOptions.size && selectedOptions.size.includes('"') && selectedOptions.size.includes('×')) {
      // Extract width and height from a string like '3" × 4"'
      const dimensions = selectedOptions.size.replace(/"/g, '').split('×').map(d => parseFloat(d.trim()));
      if (dimensions.length === 2 && !isNaN(dimensions[0]) && !isNaN(dimensions[1])) {
        const [width, height] = dimensions;
        // Calculate perimeter (sum of all sides)
        const perimeter = 2 * (width + height);
        // $1.99 per inch of vinyl (199 cents)
        const basePrice = Math.round(perimeter * baseRatePerInch);
        
        // Additional cost for material upgrades
        let materialMultiplier = 1.0; // Default for vinyl
        
        if (selectedOptions.material) {
          switch (selectedOptions.material) {
            case "Holographic":
              materialMultiplier = 1.5;
              break;
            case "Transparent":
              materialMultiplier = 1.2;
              break;
            case "Glitter":
              materialMultiplier = 1.4;
              break;
            case "Mirror":
              materialMultiplier = 1.6;
              break;
            case "Pixie Dust":
              materialMultiplier = 1.8;
              break;
          }
        }
        
        let calculatedPrice = Math.round(basePrice * materialMultiplier);
        
        // Apply quantity discount for orders of 10 or more (10% off)
        if (quantity >= 10) {
          calculatedPrice = Math.round(calculatedPrice * 0.9);
        }
        
        // Ensure a minimum price of $1.99 (199 cents)
        return Math.max(calculatedPrice, 199) * quantity;
      }
    }
    
    // For standard sizes
    let basePrice = 199; // Start with base $1.99
    
    // Standard sizes have fixed prices based on dimensions
    if (selectedOptions.size) {
      if (selectedOptions.size.includes("2\"")) {
        basePrice = 399; // $3.99 for 2" size
      } else if (selectedOptions.size.includes("3\"")) {
        basePrice = 599; // $5.99 for 3" size
      } else if (selectedOptions.size.includes("4\"")) {
        basePrice = 799; // $7.99 for 4" size
      } else if (selectedOptions.size.includes("5\"")) {
        basePrice = 999; // $9.99 for 5" size
      } else if (selectedOptions.size.includes("6\"")) {
        basePrice = 1199; // $11.99 for 6" size
      }
    }
    
    // Additional cost for material upgrades
    if (selectedOptions.material) {
      switch (selectedOptions.material) {
        case "Holographic":
          basePrice = Math.round(basePrice * 1.5);
          break;
        case "Transparent":
          basePrice = Math.round(basePrice * 1.2);
          break;
        case "Glitter":
          basePrice = Math.round(basePrice * 1.4);
          break;
        case "Mirror":
          basePrice = Math.round(basePrice * 1.6);
          break;
        case "Pixie Dust":
          basePrice = Math.round(basePrice * 1.8);
          break;
      }
    }
    
    // Apply quantity discount for orders of 10 or more (10% off)
    if (quantity >= 10) {
      basePrice = Math.round(basePrice * 0.9);
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
      if (!product) {
        throw new Error("Product information not available");
      }
      
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
        {/* Product Image with simple display that matches the design */}
        <div className="md:w-1/2 flex flex-row">
          {/* Thumbnail gallery - now on the left */}
          <div className="hidden md:flex flex-col gap-2 mr-4">
            <div className="border border-blue-500 rounded-md p-1 overflow-hidden w-16">
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full h-auto object-cover aspect-square"
              />
            </div>
            
            {/* Placeholder thumbnails */}
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="border border-gray-200 rounded-md p-1 bg-gray-50 cursor-pointer overflow-hidden w-16"
              >
                <div className="w-full aspect-square bg-gray-200" />
              </div>
            ))}
          </div>
          
          {/* Main image */}
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 relative group bg-white">
            <div className="relative overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-auto aspect-square object-contain p-4"
              />
            </div>
          </div>
          
          {/* Mobile thumbnails (horizontal) */}
          <div className="grid grid-cols-5 gap-2 mt-4 md:hidden">
            <div className="border border-blue-500 rounded-md p-1 overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full h-auto object-cover aspect-square"
              />
            </div>
            
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="border border-gray-200 rounded-md p-1 bg-gray-50 cursor-pointer overflow-hidden"
              >
                <div className="w-full aspect-square bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Product Information */}
        <div className="md:w-1/2 mt-8 md:mt-0">
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <div className="flex items-center mt-2 mb-4">
            <p className="text-xl font-semibold text-gray-900">${(product.price ? product.price / 100 : 3.15).toFixed(2)}</p>
          </div>
          
          <div className="prose prose-sm max-w-none mb-6">
            <p>{product.description || "Beautiful pink leopard sticker, perfect for laptops, water bottles, and more."}</p>
          </div>
          
          {/* Customizer Form */}
          <div className="pt-4">
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
          <div className="pt-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Product Features</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Decorate and personalize laptops, water bottles, and more</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Half-cut (kiss-cut) peel-off sticker</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Very durable and water resistant</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>3.2mm white border around each design</span>
              </li>
            </ul>
          </div>
          
          {/* Add to Cart Button with Animation */}
          <div className="mt-8">
            <Button 
              className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base relative overflow-hidden group transition-all duration-300"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-white/30 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
              <span className="relative flex items-center justify-center gap-2">
                {isAddingToCart ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    <span>Adding to Cart...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-base">shopping_cart</span>
                    <span>Add to Cart</span>
                  </>
                )}
              </span>
            </Button>
            
            {/* Price guarantee and shipping info */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center text-xs text-gray-500">
                <span className="material-icons text-green-500 text-sm mr-1">verified</span>
                <span>Price Match Guarantee</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <span className="material-icons text-primary text-sm mr-1">local_shipping</span>
                <span>Free shipping over $35</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
