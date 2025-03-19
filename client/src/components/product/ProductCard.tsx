import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedSticker } from "@/components/ui/animated-sticker";
import { ColorMorph } from "@/components/ui/color-morph";

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    price?: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  // Default price if not provided
  const price = product.price || 499; // $4.99 in cents
  const [isHovered, setIsHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation trigger with slight delay to prevent flashing on quick mouse movements
  useEffect(() => {
    if (isHovered) {
      timeoutRef.current = setTimeout(() => {
        setAnimate(true);
      }, 100);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setAnimate(false);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered]);
  
  // Custom colors for this product based on index (to give variety)
  const getProductColors = () => {
    // Generate different color palettes based on product ID
    const palettes = [
      // Blue to purple gradient
      [
        'rgba(0, 112, 243, 0.7)',   // Primary blue
        'rgba(138, 75, 255, 0.7)',  // Purple
        'rgba(20, 184, 166, 0.7)',  // Teal
      ],
      // Green to teal gradient
      [
        'rgba(20, 184, 166, 0.7)',  // Teal
        'rgba(34, 197, 94, 0.7)',   // Green
        'rgba(14, 165, 233, 0.7)',  // Light blue
      ],
      // Pink to purple gradient
      [
        'rgba(236, 72, 153, 0.7)',  // Pink
        'rgba(168, 85, 247, 0.7)',  // Purple
        'rgba(79, 70, 229, 0.7)',   // Indigo
      ],
      // Orange to red gradient
      [
        'rgba(249, 115, 22, 0.7)',  // Orange
        'rgba(239, 68, 68, 0.7)',   // Red
        'rgba(236, 72, 153, 0.7)',  // Pink
      ]
    ];
    
    // Use product ID to determine which palette to use
    const paletteIndex = product.id % palettes.length;
    return palettes[paletteIndex];
  };
  
  return (
    <Card 
      className="overflow-hidden h-full flex flex-col border border-gray-200 shadow hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.id}`}>
        <div className="overflow-hidden relative pt-[100%] bg-gray-100 cursor-pointer">
          <ColorMorph 
            className="absolute inset-0 rounded-t-md"
            isActive={animate}
            colors={getProductColors()}
            duration={5000}
            borderWidth={0}
            blendMode="soft-light"
          >
            <AnimatedSticker
              imageUrl={product.imageUrl}
              alt={product.title}
              className="absolute top-0 left-0 w-full h-full"
              colors={getProductColors()}
              effectIntensity={isHovered ? "medium" : "subtle"}
              morphSpeed="medium"
            />
          </ColorMorph>
          
          {/* Floating badge that appears on hover with more dynamic animation */}
          <div 
            className={`absolute top-3 right-3 transform transition-all duration-500 ${
              isHovered 
                ? 'translate-x-0 opacity-100 scale-100' 
                : 'translate-x-4 opacity-0 scale-90'
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <Badge className="bg-primary text-white border-0 shadow-md">Top Rated</Badge>
          </div>
        </div>
      </Link>
      
      <CardContent className="flex-grow p-4 relative z-10">
        <Link href={`/product/${product.id}`}>
          <h3 className={`font-medium text-base mb-1 cursor-pointer truncate transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-gray-800'}`}>
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <div className={`text-base font-semibold transition-all duration-300 ${isHovered ? 'text-primary scale-105' : ''}`}>
            ${(price / 100).toFixed(2)}
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs transition-all duration-500 ${
              isHovered 
                ? 'bg-blue-50 border-primary/30 scale-105' 
                : 'bg-gray-100'
            }`}
          >
            Customizable
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link href={`/product/${product.id}`} className="w-full">
          <Button 
            className={`w-full text-white transition-all duration-500 relative overflow-hidden ${
              isHovered 
                ? 'bg-primary/95 shadow-lg shadow-primary/20' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {/* Animated background shine effect */}
            <span className={`absolute inset-0 w-full h-full transition-transform duration-1000 ease-in-out ${
              isHovered 
                ? 'translate-x-0' 
                : '-translate-x-full'
            }`}>
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"></span>
            </span>
            
            <span className="relative">
              {isHovered ? "View Details" : "Customize"}
            </span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
