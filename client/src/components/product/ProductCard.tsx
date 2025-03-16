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
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Link href={`/product/${product.id}`}>
        <div className="overflow-hidden relative pt-[100%] bg-gray-100 cursor-pointer">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-200 hover:scale-105" 
          />
        </div>
      </Link>
      
      <CardContent className="flex-grow p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-base mb-1 cursor-pointer hover:text-primary truncate">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <div className="text-base font-semibold">${(price / 100).toFixed(2)}</div>
          <Badge variant="outline" className="text-xs bg-gray-100">Customizable</Badge>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link href={`/product/${product.id}`} className="w-full">
          <Button className="w-full bg-primary text-white hover:bg-primary/90">
            Customize
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
