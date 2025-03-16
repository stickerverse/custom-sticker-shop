import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProductDetail from "@/components/product/ProductDetail";

const Product = () => {
  // Get product ID from URL
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id);
  
  // Check if productId is valid
  if (isNaN(productId)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Product ID</h1>
        <p className="text-gray-600 mb-6">The product ID provided is not valid.</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProductDetail productId={productId} />
    </div>
  );
};

export default Product;
