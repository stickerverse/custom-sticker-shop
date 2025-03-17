import { useState, useRef, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Trash2, 
  Square, 
  Circle
} from "lucide-react";

export default function Customizer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderStyle, setBorderStyle] = useState<"square" | "circle">("square");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [title, setTitle] = useState("My Custom Sticker");
  
  // Options for the sticker
  const [selectedSize, setSelectedSize] = useState("small");
  const [selectedMaterial, setSelectedMaterial] = useState("vinyl");
  const [selectedFinish, setSelectedFinish] = useState("glossy");
  const [quantity, setQuantity] = useState(1);

  // Product options with prices
  const sizes = [
    { id: "small", name: "Small (2 x 3.8 in)", priceModifier: 0 },
    { id: "medium", name: "Medium (2.9 x 5.5 in)", priceModifier: 200 },
    { id: "large", name: "Large (4.5 x 8.5 in)", priceModifier: 400 },
    { id: "xlarge", name: "Extra Large (7.5 x 14 in)", priceModifier: 800 }
  ];
  
  const materials = [
    { id: "vinyl", name: "Hi-Tack Vinyl", priceModifier: 100 },
    { id: "low-tack", name: "Low-Tack Vinyl", priceModifier: 100 },
    { id: "paper", name: "Kraft Paper", priceModifier: 0 },
    { id: "prismatic", name: "Prismatic", priceModifier: 200 },
    { id: "aluminum", name: "Brushed Aluminum", priceModifier: 300 },
    { id: "reflective", name: "Reflective", priceModifier: 400 }
  ];
  
  const finishes = [
    { id: "glossy", name: "Glossy", priceModifier: 0 },
    { id: "matte", name: "Matte", priceModifier: 100 },
    { id: "holographic", name: "Holographic", priceModifier: 300 },
    { id: "transparent", name: "Transparent", priceModifier: 200 }
  ];

  const basePrice = 500; // $5.00 in cents
  
  // Calculate final price
  const calculatePrice = () => {
    const sizePrice = sizes.find(s => s.id === selectedSize)?.priceModifier || 0;
    const materialPrice = materials.find(m => m.id === selectedMaterial)?.priceModifier || 0;
    const finishPrice = finishes.find(f => f.id === selectedFinish)?.priceModifier || 0;
    
    return (basePrice + sizePrice + materialPrice + finishPrice) * quantity;
  };
  
  // Format price as dollars
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          setUploadedImage(img);
          setImageUrl(event.target?.result as string);
          setIsLoading(false);
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Update canvas when image or parameters change
  useEffect(() => {
    if (!uploadedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size proportional to image with a maximum width/height
    const maxDimension = 400;
    const aspectRatio = uploadedImage.width / uploadedImage.height;
    
    let canvasWidth, canvasHeight;
    
    if (aspectRatio > 1) {
      canvasWidth = maxDimension;
      canvasHeight = maxDimension / aspectRatio;
    } else {
      canvasHeight = maxDimension;
      canvasWidth = maxDimension * aspectRatio;
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom
    const scaleFactor = zoom / 100;
    const scaledWidth = canvasWidth * scaleFactor;
    const scaledHeight = canvasHeight * scaleFactor;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;
    
    // If we're applying a circle border
    if (borderStyle === "circle" && borderWidth > 0) {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(canvasWidth, canvasHeight) / 2;
      
      // Create clipping path for circular image
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Draw image
      ctx.drawImage(
        uploadedImage,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
      );
      
      ctx.restore();
      
      // Draw border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = borderColor;
      ctx.fill();
    } 
    // If we're applying a square/rectangle border
    else if (borderStyle === "square" && borderWidth > 0) {
      // Draw image first
      ctx.drawImage(
        uploadedImage,
        offsetX + borderWidth,
        offsetY + borderWidth,
        scaledWidth - borderWidth * 2,
        scaledHeight - borderWidth * 2
      );
      
      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        borderWidth / 2,
        borderWidth / 2,
        canvasWidth - borderWidth,
        canvasHeight - borderWidth
      );
    } 
    // No border, just draw the image
    else {
      ctx.drawImage(
        uploadedImage,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
      );
    }
    
    // The remove background feature would normally require advanced image processing
    // In a real app, we might use a 3rd party AI service like remove.bg
    // For this demo, we'll just add a note that this would remove the background
    if (removeBackground) {
      // In a real implementation, you would process the image
      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(10, 10, 220, 30);
      ctx.fillStyle = "#000";
      ctx.fillText("Background would be removed", 20, 30);
    }
  }, [uploadedImage, zoom, borderWidth, borderColor, borderStyle, removeBackground]);
  
  // Handle adding to cart
  const handleAddToCart = () => {
    if (!uploadedImage || !canvasRef.current) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image to create your custom sticker.",
        variant: "destructive"
      });
      return;
    }
    
    // Get final image from canvas
    const finalImage = canvasRef.current.toDataURL("image/png");
    
    // In a real app, we would upload this image to a server
    // For this demo, we'll just add it to the cart
    
    addToCart({
      productId: 999, // Special ID for custom stickers
      quantity,
      options: {
        size: selectedSize,
        material: selectedMaterial,
        finish: selectedFinish,
        customImageUrl: finalImage,
        title: title,
        price: calculatePrice()
      }
    }).then(() => {
      toast({
        title: "Added to cart",
        description: "Your custom sticker has been added to your cart.",
      });
      navigate("/cart");
    });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-6xl mx-auto bg-white bg-opacity-80 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Create Your Custom Sticker</CardTitle>
          <CardDescription>
            Upload an image and customize your sticker with various options
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side - Image upload and preview */}
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="w-full h-[400px] border-2 border-dashed rounded-lg flex items-center justify-center bg-white overflow-hidden"
                style={{ borderColor: imageUrl ? 'transparent' : '#e2e8f0' }}
              >
                {isLoading ? (
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
                ) : imageUrl ? (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 cursor-pointer" onClick={handleUploadClick}>
                    <Upload className="w-16 h-16 mx-auto text-gray-400" />
                    <p className="mt-4 text-sm text-gray-500">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {imageUrl ? "Replace Image" : "Upload Image"}
              </Button>
              
              {imageUrl && (
                <Input
                  placeholder="Sticker Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full max-w-xs"
                />
              )}
            </div>
            
            {/* Right side - Customization options */}
            <div className="space-y-6">
              <Tabs defaultValue="design" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="design" className="flex-1">Design</TabsTrigger>
                  <TabsTrigger value="options" className="flex-1">Material Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="design" className="space-y-4 pt-4">
                  {imageUrl && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="zoom">Zoom ({zoom}%)</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setZoom(Math.max(50, zoom - 10))}
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setZoom(Math.min(200, zoom + 10))}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Slider
                          id="zoom"
                          min={50}
                          max={200}
                          step={1}
                          value={[zoom]}
                          onValueChange={(values) => setZoom(values[0])}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="border-width">Border Width ({borderWidth}px)</Label>
                        <Slider
                          id="border-width"
                          min={0}
                          max={20}
                          step={1}
                          value={[borderWidth]}
                          onValueChange={(values) => setBorderWidth(values[0])}
                        />
                      </div>
                      
                      {borderWidth > 0 && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="border-color">Border Color</Label>
                            <div className="flex gap-3">
                              <div 
                                className="w-10 h-10 rounded-md border" 
                                style={{ backgroundColor: borderColor }}
                              />
                              <Input
                                id="border-color"
                                type="color"
                                value={borderColor}
                                onChange={(e) => setBorderColor(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Border Style</Label>
                            <div className="flex gap-3">
                              <Button
                                variant={borderStyle === "square" ? "default" : "outline"}
                                onClick={() => setBorderStyle("square")}
                                size="icon"
                              >
                                <Square className="w-5 h-5" />
                              </Button>
                              <Button
                                variant={borderStyle === "circle" ? "default" : "outline"}
                                onClick={() => setBorderStyle("circle")}
                                size="icon"
                              >
                                <Circle className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="remove-bg"
                          checked={removeBackground}
                          onChange={(e) => setRemoveBackground(e.target.checked)}
                        />
                        <Label htmlFor="remove-bg">Remove Background</Label>
                      </div>
                      
                      <div className="pt-2 text-xs text-gray-500">
                        Background removal uses AI to remove the background from your image
                        for a cleaner, more professional look.
                      </div>
                    </>
                  )}
                  
                  {!imageUrl && (
                    <div className="py-8 text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Upload an image to start designing</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="options" className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name} {size.priceModifier > 0 && `(+$${formatPrice(size.priceModifier)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} {material.priceModifier > 0 && `(+$${formatPrice(material.priceModifier)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="finish">Finish</Label>
                    <Select value={selectedFinish} onValueChange={setSelectedFinish}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select finish" />
                      </SelectTrigger>
                      <SelectContent>
                        {finishes.map((finish) => (
                          <SelectItem key={finish.id} value={finish.id}>
                            {finish.name} {finish.priceModifier > 0 && `(+$${formatPrice(finish.priceModifier)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="p-4 border rounded-lg bg-gray-50 mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Base price:</span>
                  <span>${formatPrice(basePrice)}</span>
                </div>
                
                {selectedSize !== "small" && (
                  <div className="flex justify-between text-sm mb-1">
                    <span>Size ({sizes.find(s => s.id === selectedSize)?.name}):</span>
                    <span>+${formatPrice(sizes.find(s => s.id === selectedSize)?.priceModifier || 0)}</span>
                  </div>
                )}
                
                {selectedMaterial !== "paper" && (
                  <div className="flex justify-between text-sm mb-1">
                    <span>Material ({materials.find(m => m.id === selectedMaterial)?.name}):</span>
                    <span>+${formatPrice(materials.find(m => m.id === selectedMaterial)?.priceModifier || 0)}</span>
                  </div>
                )}
                
                {selectedFinish !== "glossy" && (
                  <div className="flex justify-between text-sm mb-1">
                    <span>Finish ({finishes.find(f => f.id === selectedFinish)?.name}):</span>
                    <span>+${formatPrice(finishes.find(f => f.id === selectedFinish)?.priceModifier || 0)}</span>
                  </div>
                )}
                
                {quantity > 1 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span>Quantity:</span>
                    <span>×{quantity}</span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${formatPrice(calculatePrice())}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/shop")}>
            Back to Shop
          </Button>
          <Button onClick={handleAddToCart} disabled={!imageUrl}>
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}