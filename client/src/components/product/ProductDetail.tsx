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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
    size: '4" × 4"',
    material: "Vinyl",
    finish: "Gloss"
  });
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
            case "Clear":
              materialMultiplier = 1.2;
              break;
          }
        }
        
        let calculatedPrice = Math.round(basePrice * materialMultiplier);
        
        // Apply quantity discounts
        if (quantity >= 50) {
          calculatedPrice = Math.round(calculatedPrice * 0.75); // 25% off for 50+ items
        } else if (quantity >= 25) {
          calculatedPrice = Math.round(calculatedPrice * 0.80); // 20% off for 25+ items
        } else if (quantity >= 10) {
          calculatedPrice = Math.round(calculatedPrice * 0.90); // 10% off for 10+ items
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
        case "Clear":
          basePrice = Math.round(basePrice * 1.2);
          break;
      }
    }
    
    // Apply quantity discounts
    if (quantity >= 50) {
      basePrice = Math.round(basePrice * 0.75); // 25% off for 50+ items
    } else if (quantity >= 25) {
      basePrice = Math.round(basePrice * 0.80); // 20% off for 25+ items
    } else if (quantity >= 10) {
      basePrice = Math.round(basePrice * 0.90); // 10% off for 10+ items
    }
    
    return basePrice * quantity;
  };
  
  // Format price in dollars (US style)
  const formatPrice = (cents: number) => {
    return `US$${(cents / 100).toFixed(2)}`;
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
        <div className="md:w-3/5 flex flex-row">
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
          <div className="flex-1 rounded-lg overflow-hidden relative group bg-white">
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
        <div className="md:w-2/5 mt-8 md:mt-0">
          <h1 className="text-xl font-bold text-gray-900">{product.title}</h1>
          
          {/* Star rating */}
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="material-icons text-yellow-400 text-sm">
                  star
                </span>
              ))}
              <span className="text-sm text-gray-600 ml-1">(459 reviews)</span>
            </div>
          </div>
          
          {/* Price display */}
          <div className="flex items-center mt-4 mb-4">
            <p className="text-2xl font-semibold text-pink-600">{formatPrice(calculatePrice())}</p>
          </div>
          
          {/* Size Options */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Size</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-3 py-1 border ${selectedOptions.size === '3" × 3"' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-full text-sm font-medium hover:border-gray-500`}
                onClick={() => handleOptionSelect('size', '3" × 3"')}
              >
                Small (3" x 3")
              </button>
              <button 
                className={`px-3 py-1 border ${selectedOptions.size === '4" × 4"' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-full text-sm font-medium hover:border-gray-500`}
                onClick={() => handleOptionSelect('size', '4" × 4"')}
              >
                Medium (4" x 4")
              </button>
              <button 
                className={`px-3 py-1 border ${selectedOptions.size === '5" × 5"' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-full text-sm font-medium hover:border-gray-500`}
                onClick={() => handleOptionSelect('size', '5" × 5"')}
              >
                Large (5" x 5")
              </button>
            </div>
          </div>
          
          {/* Customizer Form */}
          <div className="pt-4 border-t border-gray-200">
            <CustomizerForm 
              optionsByType={optionsByType}
              selectedOptions={selectedOptions}
              onOptionSelect={handleOptionSelect}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </div>
          
          {/* Add to Cart Button */}
          <div className="mt-6">
            <Button 
              className="w-full bg-pink-500 text-white hover:bg-pink-600 h-12 rounded-full text-base font-medium"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                  Adding to Cart...
                </>
              ) : (
                <>
                  Add to Cart • {formatPrice(calculatePrice())}
                </>
              )}
            </Button>
          </div>
          
          {/* Shipping and Returns */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium mb-1">Shipping</h3>
              <p className="text-xs text-gray-500">Free delivery: March 24</p>
              <p className="text-xs text-gray-500">Get shipping options at checkout</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-1">Easy returns</h3>
              <p className="text-xs text-gray-500">Free 30-day returns, with no hassle</p>
            </div>
          </div>
          
          {/* Product Features */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-sm font-medium mb-2">Product Features</h2>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span>Decorate and personalize laptops, water bottles, and more</span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span>Half-cut (kiss-cut) peel-off sticker</span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span>Very durable and water resistant</span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span>3.2mm white border around each design</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Similar Products Section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold mb-4">Also available in</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="border border-gray-200 rounded-md p-2 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 mb-2 rounded-md overflow-hidden">
                <div className="w-full h-full bg-gray-200" />
              </div>
              <p className="text-xs font-medium truncate">Classic T-Shirt</p>
              <p className="text-xs text-gray-600">US$19.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
