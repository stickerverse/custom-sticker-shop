import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";

// Sticker shape options
const SHAPES = [
  { id: "circle", label: "Circle", bgClass: "rounded-full" },
  { id: "square", label: "Square", bgClass: "rounded-md" },
  { id: "squircle", label: "Squircle", bgClass: "rounded-2xl" },
  { id: "heart", label: "Heart", bgClass: "heart-shape" },
  { id: "star", label: "Star", bgClass: "star-shape" },
];

// Sticker material options
const MATERIALS = [
  { id: "glossy", label: "Glossy Vinyl", price: 0 },
  { id: "matte", label: "Matte Vinyl", price: 0.5 },
  { id: "holographic", label: "Holographic", price: 1.5 },
  { id: "clear", label: "Clear Vinyl", price: 1 },
  { id: "glitter", label: "Glitter Vinyl", price: 2 },
];

// Sticker size options
const SIZES = [
  { id: "small", label: "Small (2\")", price: 2.5, scale: 0.6 },
  { id: "medium", label: "Medium (3\")", price: 3.5, scale: 0.8 },
  { id: "large", label: "Large (4\")", price: 4.5, scale: 1 },
  { id: "xlarge", label: "X-Large (5\")", price: 5.5, scale: 1.2 },
  { id: "xxlarge", label: "XX-Large (6\")", price: 6.5, scale: 1.4 },
];

const DEFAULT_PRICE = 3.5; // Base price

export default function Customizer() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [stickerName, setStickerName] = useState("My Custom Sticker");
  const [selectedTab, setSelectedTab] = useState("upload");
  const [selectedShape, setSelectedShape] = useState(SHAPES[0].id);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0].id);
  const [selectedSize, setSelectedSize] = useState(SIZES[1].id); // Default to medium
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#FFFFFF");
  const [quantity, setQuantity] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [isRemovedBg, setIsRemovedBg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Calculate price based on options
  const calculatePrice = () => {
    const materialPrice = MATERIALS.find(m => m.id === selectedMaterial)?.price || 0;
    const sizePrice = SIZES.find(s => s.id === selectedSize)?.price || DEFAULT_PRICE;
    const borderPrice = borderWidth > 0 ? 0.5 : 0;
    const bgRemovalPrice = isRemovedBg ? 1 : 0;
    
    return sizePrice + materialPrice + borderPrice + bgRemovalPrice;
  };

  const price = calculatePrice();
  const totalPrice = price * quantity;

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Read the file and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle background removal (simulated)
  const handleRemoveBackground = () => {
    if (!uploadedImage) return;
    
    toast({
      title: "Background Removal",
      description: "Processing image...",
    });
    
    // In a real app, this would call an API for background removal
    // For now, we'll simulate the process with a timeout
    setTimeout(() => {
      setIsRemovedBg(true);
      toast({
        title: "Background Removed",
        description: "Image background has been successfully removed.",
      });
    }, 1500);
  };

  // Handle adding to cart
  const handleAddToCart = async () => {
    if (!uploadedImage) {
      toast({
        title: "Upload Required",
        description: "Please upload an image for your custom sticker.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real app, we would upload the image to cloud storage
      // and get back a URL to store with the order
      // For simplicity, we'll just use the custom sticker options
      
      await addToCart({
        productId: 999, // Special ID for custom stickers
        quantity,
        options: {
          customImage: uploadedImage,
          name: stickerName,
          shape: selectedShape,
          material: selectedMaterial,
          size: selectedSize,
          borderWidth: borderWidth.toString(),
          borderColor,
          backgroundColor,
          isRemovedBg: isRemovedBg.toString(),
          price: price.toString()
        }
      });
      
      toast({
        title: "Added to Cart",
        description: "Your custom sticker has been added to your cart!",
      });
      
      setLocation("/cart");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add custom sticker to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Preview rendering
  useEffect(() => {
    if (!uploadedImage || !canvasRef.current) return;

    // Create a new image element when image source changes
    const img = new Image();
    img.src = uploadedImage;
    img.onload = () => {
      imageRef.current = img;
      renderPreview();
    };
  }, [uploadedImage]);

  // Update preview when options change
  useEffect(() => {
    if (imageRef.current) {
      renderPreview();
    }
  }, [selectedShape, selectedSize, borderWidth, borderColor, backgroundColor, isRemovedBg]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the scale based on selected size
    const sizeOption = SIZES.find(s => s.id === selectedSize);
    const scale = sizeOption?.scale || 1;

    // Set canvas dimensions
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions to maintain aspect ratio
    const size = Math.min(canvas.width, canvas.height) * scale;
    const x = (canvas.width - size) / 2;
    const y = (canvas.height - size) / 2;

    // Apply background if not removed
    if (!isRemovedBg && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      if (selectedShape === "circle") {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (selectedShape === "heart" || selectedShape === "star") {
        // For complex shapes, we just use a rectangle for the demo
        ctx.fillRect(x, y, size, size);
      } else {
        const radius = selectedShape === "squircle" ? 20 : selectedShape === "square" ? 5 : 0;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, radius);
        ctx.fill();
      }
    }

    // Draw the image
    if (selectedShape === "circle") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, size / 2 - borderWidth, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x + borderWidth, y + borderWidth, size - borderWidth * 2, size - borderWidth * 2);
      ctx.restore();
    } else if (selectedShape === "heart" || selectedShape === "star") {
      // For complex shapes, we just use a rectangle for the demo
      ctx.drawImage(img, x + borderWidth, y + borderWidth, size - borderWidth * 2, size - borderWidth * 2);
    } else {
      const radius = selectedShape === "squircle" ? 20 : selectedShape === "square" ? 5 : 0;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + borderWidth, y + borderWidth, size - borderWidth * 2, size - borderWidth * 2, radius);
      ctx.clip();
      ctx.drawImage(img, x + borderWidth, y + borderWidth, size - borderWidth * 2, size - borderWidth * 2);
      ctx.restore();
    }

    // Draw border if specified
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth * 2;

      if (selectedShape === "circle") {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, size / 2 - borderWidth, 0, Math.PI * 2);
        ctx.stroke();
      } else if (selectedShape === "heart" || selectedShape === "star") {
        // For complex shapes, we just use a rectangle for the demo
        ctx.strokeRect(x + borderWidth, y + borderWidth, size - borderWidth * 2, size - borderWidth * 2);
      } else {
        const radius = selectedShape === "squircle" ? 20 : selectedShape === "square" ? 5 : 0;
        ctx.beginPath();
        ctx.roundRect(x + borderWidth, y + borderWidth, size - borderWidth * 2, size - borderWidth * 2, radius);
        ctx.stroke();
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Your Custom Sticker</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Preview */}
        <div className="flex flex-col items-center">
          <Card className="w-full max-w-md p-6 flex flex-col items-center">
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative mb-4">
              {!uploadedImage ? (
                <div className="text-center p-6">
                  <div className="text-5xl mb-4 text-gray-300">
                    <span className="material-icons" style={{ fontSize: '80px' }}>add_photo_alternate</span>
                  </div>
                  <p className="text-gray-500">Upload an image to customize your sticker</p>
                </div>
              ) : (
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 mb-2">Preview</p>
              <p className="text-xl font-semibold">{stickerName}</p>
              <p className="text-lg text-primary font-bold mt-2">
                ${price.toFixed(2)} each × {quantity} = ${totalPrice.toFixed(2)}
              </p>
            </div>
          </Card>
          
          {uploadedImage && (
            <div className="mt-8 w-full max-w-md">
              <Button 
                className="w-full" 
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </div>
          )}
        </div>
        
        {/* Right Column - Customization Options */}
        <div>
          <Card className="p-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="customize">Customize</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-6">
                <div>
                  <Label htmlFor="sticker-name">Sticker Name</Label>
                  <Input 
                    id="sticker-name" 
                    value={stickerName}
                    onChange={(e) => setStickerName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Upload Image</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-dashed"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="material-icons mb-2">file_upload</span>
                          <span>Click to upload image</span>
                          <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
                
                {uploadedImage && (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveBackground}
                      className="w-full"
                      disabled={isRemovedBg}
                    >
                      {isRemovedBg ? "Background Removed" : "Remove Background"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      +$1.00 for background removal
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="color"
                      id="background-color"
                      value={backgroundColor === "transparent" ? "#ffffff" : backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant={backgroundColor === "transparent" ? "default" : "outline"}
                      onClick={() => setBackgroundColor("transparent")}
                      className="flex-1"
                    >
                      Transparent
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="customize" className="space-y-6">
                <div>
                  <Label>Shape</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {SHAPES.map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setSelectedShape(shape.id)}
                        className={`aspect-square rounded flex items-center justify-center ${
                          selectedShape === shape.id
                            ? "border-2 border-primary"
                            : "border border-gray-200"
                        }`}
                      >
                        <div className={`w-3/4 h-3/4 bg-gray-200 ${shape.bgClass}`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="material">Material</Label>
                  <Select
                    value={selectedMaterial}
                    onValueChange={setSelectedMaterial}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.label} {material.price > 0 && `(+$${material.price.toFixed(2)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.label} - ${size.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="border-width">Border Width</Label>
                    <span className="text-sm text-gray-500">{borderWidth}px</span>
                  </div>
                  <Slider
                    id="border-width"
                    min={0}
                    max={10}
                    step={1}
                    value={[borderWidth]}
                    onValueChange={(value) => setBorderWidth(value[0])}
                    className="mt-2"
                  />
                  {borderWidth > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +$0.50 for custom border
                    </p>
                  )}
                </div>
                
                {borderWidth > 0 && (
                  <div>
                    <Label htmlFor="border-color">Border Color</Label>
                    <div className="flex items-center mt-2">
                      <input
                        type="color"
                        id="border-color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm">{borderColor}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="quantity">Quantity</Label>
                    <span className="text-sm text-gray-500">{quantity} stickers</span>
                  </div>
                  <Slider
                    id="quantity"
                    min={1}
                    max={50}
                    step={1}
                    value={[quantity]}
                    onValueChange={(value) => setQuantity(value[0])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}