import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/product/ProductCard";

const Shop = () => {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  
  // Get search query from URL
  const initialSearchQuery = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  
  // Filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [sortOption, setSortOption] = useState<string>("featured");
  
  // Fetch all products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Update URL when search changes
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set("search", searchQuery);
    } else {
      newParams.delete("search");
    }
    window.history.pushState({}, "", `?${newParams.toString()}`);
    setSearchParams(newParams);
  };
  
  // Filter and sort products
  const filteredProducts = () => {
    if (!products) return [];
    
    let result = [...products];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product: any) => 
        product.title.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter((product: any) => 
        product.categoryId === parseInt(selectedCategory)
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "price-low":
        result.sort((a: any, b: any) => (a.price || 499) - (b.price || 499));
        break;
      case "price-high":
        result.sort((a: any, b: any) => (b.price || 499) - (a.price || 499));
        break;
      case "newest":
        result.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default: // "featured"
        // No sorting needed, assume products are already in featured order
        break;
    }
    
    return result;
  };
  
  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <div key={index} className="h-full">
        <Skeleton className="w-full aspect-square rounded-lg mb-3" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ));
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Custom Stickers</h1>
        <p className="text-gray-600">Browse our collection or customize your own stickers</p>
      </div>
      
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2 lg:w-2/3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search stickers..."
                className="w-full pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <span className="material-icons text-gray-400">search</span>
              </button>
            </form>
          </div>
          
          <div className="w-full md:w-1/2 lg:w-1/3">
            <Select 
              value={sortOption} 
              onValueChange={setSortOption}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-4">Filters</h2>
            
            <Accordion type="single" collapsible defaultValue="category">
              <AccordionItem value="category">
                <AccordionTrigger className="text-base font-medium">Categories</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-all" 
                        checked={selectedCategory === "all"} 
                        onCheckedChange={() => setSelectedCategory("all")}
                      />
                      <Label htmlFor="category-all" className="ml-2 cursor-pointer">
                        All Categories
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-1" 
                        checked={selectedCategory === "1"} 
                        onCheckedChange={() => setSelectedCategory("1")}
                      />
                      <Label htmlFor="category-1" className="ml-2 cursor-pointer">
                        Decorative
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-2" 
                        checked={selectedCategory === "2"} 
                        onCheckedChange={() => setSelectedCategory("2")}
                      />
                      <Label htmlFor="category-2" className="ml-2 cursor-pointer">
                        Laptop
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-3" 
                        checked={selectedCategory === "3"} 
                        onCheckedChange={() => setSelectedCategory("3")}
                      />
                      <Label htmlFor="category-3" className="ml-2 cursor-pointer">
                        Water Bottle
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="size">
                <AccordionTrigger className="text-base font-medium">Size</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox id="size-small" />
                      <Label htmlFor="size-small" className="ml-2 cursor-pointer">
                        Small (2x3.8 in)
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="size-medium" />
                      <Label htmlFor="size-medium" className="ml-2 cursor-pointer">
                        Medium (2.9x5.5 in)
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="size-large" />
                      <Label htmlFor="size-large" className="ml-2 cursor-pointer">
                        Large (4.5x8.5 in)
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="material">
                <AccordionTrigger className="text-base font-medium">Material</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox id="material-vinyl" />
                      <Label htmlFor="material-vinyl" className="ml-2 cursor-pointer">
                        Vinyl
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="material-prismatic" />
                      <Label htmlFor="material-prismatic" className="ml-2 cursor-pointer">
                        Prismatic
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="material-kraft" />
                      <Label htmlFor="material-kraft" className="ml-2 cursor-pointer">
                        Kraft Paper
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="finish">
                <AccordionTrigger className="text-base font-medium">Finish</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox id="finish-glossy" />
                      <Label htmlFor="finish-glossy" className="ml-2 cursor-pointer">
                        Glossy
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="finish-matte" />
                      <Label htmlFor="finish-matte" className="ml-2 cursor-pointer">
                        Matte
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="finish-holographic" />
                      <Label htmlFor="finish-holographic" className="ml-2 cursor-pointer">
                        Holographic
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-6">
              <Button className="w-full" variant="outline">
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="lg:w-3/4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons()}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading products. Please try again later.</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          ) : filteredProducts().length === 0 ? (
            <div className="text-center py-8">
              <span className="material-icons text-gray-300 text-6xl mb-4">search_off</span>
              <h2 className="text-xl font-bold mb-2">No products found</h2>
              <p className="text-gray-500 mb-6">
                We couldn't find any products matching your criteria.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">{filteredProducts().length} products found</p>
                {searchQuery && (
                  <p className="text-sm">
                    Search results for: <span className="font-medium">{searchQuery}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-6 px-2"
                      onClick={() => {
                        setSearchQuery("");
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("search");
                        window.history.pushState({}, "", `?${newParams.toString()}`);
                        setSearchParams(newParams);
                      }}
                    >
                      <span className="material-icons text-sm">close</span>
                    </Button>
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts().map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
