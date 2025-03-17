import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useChat } from "@/hooks/use-chat";
import { apiRequest } from "@/lib/queryClient";
import AdvancedEditor from "@/components/customizer/AdvancedEditor";
import { ImageProcessor } from "@/components/customizer/ImageProcessor";
import ChatSidebar from "@/components/chat/ChatSidebar";

// Sticker size options
const SIZES = [
  { id: "small", label: "Small (2\")", price: 3.99, scale: 0.8 },
  { id: "medium", label: "Medium (3\")", price: 4.99, scale: 1.0 },
  { id: "large", label: "Large (4\")", price: 5.99, scale: 1.2 },
  { id: "xlarge", label: "Extra Large (5\")", price: 7.99, scale: 1.4 },
];

// Sticker material options
const MATERIALS = [
  { id: "vinyl", label: "Vinyl", price: 0 },
  { id: "holographic", label: "Holographic", price: 1.50 },
  { id: "glitter", label: "Glitter", price: 1.50 },
  { id: "clear", label: "Clear", price: 1.00 },
  { id: "metallic", label: "Metallic", price: 2.00 },
];

export default function Customizer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  // Chat sidebar state
  const [chatExpanded, setChatExpanded] = useState(false);
  
  // File upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Customization state
  const [stickerName, setStickerName] = useState("Custom Sticker");
  const [selectedShape, setSelectedShape] = useState("circle");
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedMaterial, setSelectedMaterial] = useState("vinyl");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#FF3366");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [quantity, setQuantity] = useState(1);
  
  // Calculate total price
  const getBasePrice = () => {
    const sizeOption = SIZES.find(s => s.id === selectedSize);
    const materialOption = MATERIALS.find(m => m.id === selectedMaterial);
    
    let basePrice = sizeOption?.price || 4.99;
    basePrice += materialOption?.price || 0;
    
    // Add price for custom border
    if (borderWidth > 0) {
      basePrice += 0.50;
    }
    
    return basePrice;
  };
  
  const price = getBasePrice();
  const totalPrice = price * quantity;
  
  // Add to cart
  const handleAddToCart = async () => {
    if (!uploadedImage) {
      toast({
        title: "No Image Selected",
        description: "Please upload or create an image for your sticker.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get the canvas data
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Get the preview image as data URL
      const previewImageUrl = canvas.toDataURL("image/png");
      
      // Create product options
      const productOptions = {
        name: stickerName,
        shape: selectedShape,
        size: selectedSize,
        material: selectedMaterial,
        borderWidth: String(borderWidth), // Convert to string to match Record<string, string> type
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        previewImage: previewImageUrl,
        originalImage: uploadedImage,
      };
      
      // Add to cart
      await addToCart({
        productId: 1, // Using a placeholder product ID for custom stickers
        quantity,
        options: productOptions,
      });
      
      // Show success notification
      toast({
        title: "Added to Cart",
        description: `${quantity} ${stickerName} ${quantity === 1 ? "has" : "have"} been added to your cart.`,
      });
      
      // Redirect to cart
      setLocation("/cart");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add the sticker to your cart.",
        variant: "destructive",
      });
    }
  };

  // Preview rendering for processed images with shape transformations
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
  }, [selectedShape, selectedSize, borderWidth, borderColor, backgroundColor]);

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

    // Calculate dimensions to maintain aspect ratio while preserving the image aspect ratio
    const imgAspect = img.width / img.height;
    const canvasSize = Math.min(canvas.width, canvas.height) * scale;
    
    let drawWidth, drawHeight;
    if (imgAspect >= 1) {
      // Image is wider than tall
      drawWidth = canvasSize;
      drawHeight = canvasSize / imgAspect;
    } else {
      // Image is taller than wide
      drawHeight = canvasSize;
      drawWidth = canvasSize * imgAspect;
    }
    
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    // Apply shape transformations using path clipping
    ctx.save();
    
    // Define the clipping path based on the selected shape
    applyShapeClipping(ctx, selectedShape, x, y, drawWidth, drawHeight, borderWidth);
    
    // Draw the image inside the clipping path
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();
    
    // Draw border if specified
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      
      // Draw the stroke along the same path used for clipping
      drawShapePath(ctx, selectedShape, x, y, drawWidth, drawHeight, borderWidth / 2);
      ctx.stroke();
    }
  };
  
  // Helper function to create a clipping path based on the selected shape
  const applyShapeClipping = (
    ctx: CanvasRenderingContext2D, 
    shape: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number,
    borderOffset: number
  ) => {
    const inset = borderOffset;
    
    ctx.beginPath();
    switch (shape) {
      case "circle":
        const radius = Math.min(width, height) / 2 - inset;
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        break;
        
      case "square":
        const size = Math.min(width, height) - inset * 2;
        const squareX = x + (width - size) / 2;
        const squareY = y + (height - size) / 2;
        ctx.rect(squareX, squareY, size, size);
        break;
        
      case "squircle":
        const squircleSize = Math.min(width, height) - inset * 2;
        const squircleX = x + (width - squircleSize) / 2;
        const squircleY = y + (height - squircleSize) / 2;
        const radius2 = squircleSize * 0.25; // 25% radius for rounded corners
        ctx.roundRect(squircleX, squircleY, squircleSize, squircleSize, radius2);
        break;
        
      case "heart":
        drawHeart(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
        
      case "star":
        drawStar(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
        
      default: // rectangle or default
        ctx.rect(x + inset, y + inset, width - inset * 2, height - inset * 2);
        break;
    }
    ctx.closePath();
    ctx.clip();
  };
  
  // Duplicate function for stroke drawing (same as clipping path)
  const drawShapePath = (
    ctx: CanvasRenderingContext2D, 
    shape: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number,
    inset: number
  ) => {
    ctx.beginPath();
    switch (shape) {
      case "circle":
        const radius = Math.min(width, height) / 2 - inset;
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        break;
        
      case "square":
        const size = Math.min(width, height) - inset * 2;
        const squareX = x + (width - size) / 2;
        const squareY = y + (height - size) / 2;
        ctx.rect(squareX, squareY, size, size);
        break;
        
      case "squircle":
        const squircleSize = Math.min(width, height) - inset * 2;
        const squircleX = x + (width - squircleSize) / 2;
        const squircleY = y + (height - squircleSize) / 2;
        const radius2 = squircleSize * 0.25; // 25% radius for rounded corners
        ctx.roundRect(squircleX, squircleY, squircleSize, squircleSize, radius2);
        break;
        
      case "heart":
        drawHeart(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
        
      case "star":
        drawStar(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
        
      default: // rectangle or default
        ctx.rect(x + inset, y + inset, width - inset * 2, height - inset * 2);
        break;
    }
    ctx.closePath();
  };
  
  // Draw a heart shape
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const width = radius * 2;
    const height = radius * 2;
    
    // Start at the top center of the heart
    ctx.moveTo(x, y - height / 4);
    
    // Draw the left curve
    ctx.bezierCurveTo(
      x - width / 2, y - height / 2,  // Control point 1
      x - width / 2, y + height / 4,  // Control point 2
      x, y + height / 2               // End point
    );
    
    // Draw the right curve
    ctx.bezierCurveTo(
      x + width / 2, y + height / 4,  // Control point 1
      x + width / 2, y - height / 2,  // Control point 2
      x, y - height / 4               // End point (back to start)
    );
  };
  
  // Draw a star shape
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const spikes = 5;
    const innerRadius = radius * 0.4;
    const outerRadius = radius;
    
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.moveTo(x, y - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      // Outer point
      let x1 = x + Math.cos(rot) * outerRadius;
      let y1 = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(x1, y1);
      rot += step;
      
      // Inner point
      let x2 = x + Math.cos(rot) * innerRadius;
      let y2 = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(x2, y2);
      rot += step;
    }
    
    // Close the path back to the first point
    ctx.lineTo(x, y - outerRadius);
  };

  return (
    <>
      {/* Chat Sidebar */}
      <ChatSidebar 
        expanded={chatExpanded} 
        toggleExpanded={() => setChatExpanded(!chatExpanded)} 
      />
      
      {/* Main Content - with margin to accommodate the chat sidebar */}
      <div className={`transition-all duration-300 ${chatExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="container mx-auto py-8 px-4">
          {/* Hero section */}
          <div className="bg-white rounded-md p-8 mb-8 shadow-sm border border-gray-200">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Create Custom Stickers</h1>
              <p className="text-gray-600 mb-4">Design your perfect stickers with our easy-to-use online editor. Upload your design, customize with our tools, and receive professional quality stickers.</p>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11L12 14L22 4" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Premium Quality</div>
                    <div className="text-xs text-gray-500">Durable vinyl materials</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16L12 12" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8L12.01 8" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Waterproof</div>
                    <div className="text-xs text-gray-500">Resistant to water & sunlight</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 5L19 12L12 19" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Fast Shipping</div>
                    <div className="text-xs text-gray-500">Delivered in 3-5 business days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Customize Your Sticker</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setChatExpanded(!chatExpanded)}
              className="text-primary border-primary/20 hover:bg-primary/10 text-xs"
            >
              <span className="material-icons text-sm mr-1">chat</span>
              {chatExpanded ? 'Hide Chat' : 'Show Chat'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Editor */}
            <div className="lg:col-span-1 order-2 lg:order-1 space-y-4">
              <Card className="overflow-hidden border-primary/10 shadow-md bg-background/80 backdrop-blur-sm">
                <div className="p-4 border-b border-primary/10 bg-primary/5">
                  <h2 className="text-lg font-semibold text-primary">Sticker Editor</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="sticker-name" className="text-sm text-muted-foreground">Sticker Name</Label>
                    <Input 
                      id="sticker-name" 
                      value={stickerName}
                      onChange={(e) => setStickerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <AdvancedEditor
                    onImageProcessed={(url) => {
                      setUploadedImage(url);
                      toast({
                        title: "Image Processed",
                        description: "Your image has been successfully processed and is ready for customization.",
                      });
                    }}
                    onOriginalImageUpload={(url) => {
                      setUploadedImage(url);
                    }}
                    onShapeSelected={setSelectedShape}
                    onBorderWidthChanged={setBorderWidth}
                    onBorderColorChanged={setBorderColor}
                    selectedShape={selectedShape}
                    borderWidth={borderWidth}
                    borderColor={borderColor}
                  />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="material" className="text-sm text-muted-foreground">Material</Label>
                      <Select
                        value={selectedMaterial}
                        onValueChange={setSelectedMaterial}
                      >
                        <SelectTrigger className="mt-1">
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
                      <Label htmlFor="size" className="text-sm text-muted-foreground">Size</Label>
                      <Select
                        value={selectedSize}
                        onValueChange={setSelectedSize}
                      >
                        <SelectTrigger className="mt-1">
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
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="quantity" className="text-sm text-muted-foreground">Quantity</Label>
                      <span className="text-xs font-medium text-primary">{quantity} stickers</span>
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
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span>50</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Center Column - Preview */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <Card className="border-primary/10 shadow-md overflow-hidden bg-gradient-to-br from-background/90 to-background/40 backdrop-blur-md">
                <div className="p-4 border-b border-primary/10 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-primary">Live Preview</h2>
                  <div className="text-lg font-bold text-primary flex items-center">
                    <span>${price.toFixed(2)} × {quantity} = ${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col items-center">
                  <div className="relative mb-6 w-full max-w-md">
                    <div className="w-full aspect-square bg-black/5 rounded-lg flex items-center justify-center overflow-hidden">
                      {!uploadedImage ? (
                        <div className="text-center p-6">
                          <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons text-primary" style={{ fontSize: '40px' }}>add_photo_alternate</span>
                          </div>
                          <p className="text-muted-foreground">Upload an image to customize your sticker</p>
                        </div>
                      ) : (
                        <canvas 
                          ref={canvasRef} 
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary/20 rounded-full blur-xl"></div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <p className="text-sm text-muted-foreground mb-1">Preview</p>
                    <h3 className="text-xl font-semibold">{stickerName}</h3>
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">{MATERIALS.find(m => m.id === selectedMaterial)?.label} • </span>
                      <span className="text-muted-foreground">{SIZES.find(s => s.id === selectedSize)?.label}</span>
                    </p>
                  </div>
                  
                  {uploadedImage && (
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-white px-8"
                      onClick={handleAddToCart}
                    >
                      <span className="material-icons mr-2 text-lg">add_shopping_cart</span>
                      Add to Cart
                    </Button>
                  )}
                </div>
              </Card>
              
              {/* Features Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="p-5 bg-white border border-gray-200 shadow-sm rounded-md">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.0894 5.98438L20.5 7.41406L12 15.9922L7.5 11.4336L8.93262 10.0352L12 13.125L19.0894 5.98438Z" fill="#0078D4"/>
                        <path d="M20 11C20 15.4183 16.4183 19 12 19C7.58172 19 4 15.4183 4 11C4 6.58172 7.58172 3 12 3C13.2445 3 14.4252 3.27688 15.4782 3.77256" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">AI-Enhanced</h3>
                    <p className="text-xs text-gray-500">Smart background removal and edge detection</p>
                  </div>
                </Card>
                
                <Card className="p-5 bg-white border border-gray-200 shadow-sm rounded-md">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8L16 12L12 16L8 12L12 8Z" fill="#0078D4"/>
                        <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">Custom Shapes</h3>
                    <p className="text-xs text-gray-500">Multiple shapes for perfect stickers</p>
                  </div>
                </Card>
                
                <Card className="p-5 bg-white border border-gray-200 shadow-sm rounded-md">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 12H8.01M12 12H12.01M16 12H16.01" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">Expert Support</h3>
                    <p className="text-xs text-gray-500">Help from our design specialists</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}