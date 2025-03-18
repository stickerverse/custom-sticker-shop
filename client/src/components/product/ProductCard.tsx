import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  
  return (
    <Card 
      className="overflow-hidden h-full flex flex-col border border-gray-200 shadow hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.id}`}>
        <div className="overflow-hidden relative pt-[100%] bg-gray-100 cursor-pointer">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-300 hover:scale-110" 
          />
          
          {/* Overlay that appears on hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Floating badge that appears on hover */}
          <div className={`absolute top-3 right-3 transform transition-all duration-300 ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
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
          <Badge variant="outline" className={`text-xs transition-colors duration-300 ${isHovered ? 'bg-blue-50 border-primary/30' : 'bg-gray-100'}`}>
            Customizable
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link href={`/product/${product.id}`} className="w-full">
          <Button 
            className="w-full bg-primary text-white hover:bg-primary/90 hover:shadow-md transition-all duration-300"
          >
            {isHovered ? "View Details" : "Customize"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
