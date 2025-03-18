import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { 
  Loader2, 
  Upload, 
  Save, 
  Eye, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Grid,
  Image as ImageIcon,
  Text as TextIcon,
  Square,
  Circle,
  Heart,
  Star,
  QrCode,
  FileImage,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import your editor components
import AdvancedEditor from "@/components/customizer/AdvancedEditor";
import { ImageProcessor } from "@/components/customizer/ImageProcessor";

// Sticker size options
const SIZES = [
  { id: "small", label: "Small (2\")", price: 3.99, scale: 0.8 },
  { id: "medium", label: "Medium (3\")", price: 4.99, scale: 1.0 },
  { id: "large", label: "Large (4\")", price: 5.99, scale: 1.2 },
  { id: "xlarge", label: "Extra Large (5\")", price: 7.99, scale: 1.4 },
];

// Sticker material options
const MATERIALS = [
  { id: "vinyl", label: "White Paper Sticker", price: 0 },
  { id: "holographic", label: "Holographic", price: 1.50 },
  { id: "glitter", label: "Glitter", price: 1.50 },
  { id: "clear", label: "Clear", price: 1.00 },
  { id: "metallic", label: "Metallic", price: 2.00 },
];

export default function Customizer() {
  const [stickerName, setStickerName] = useState("Custom Sticker");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState("circle");
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedMaterial, setSelectedMaterial] = useState("vinyl");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#FF3366");
  const [quantity, setQuantity] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [currentSide, setCurrentSide] = useState("front");

  // Canvas ref for the editor
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const { toast } = useToast();
  const { addToCart } = useCart();

  // Calculate total price
  const getBasePrice = () => {
    const sizeOption = SIZES.find(s => s.id === selectedSize);
    const materialOption = MATERIALS.find(m => m.id === selectedMaterial);

    let basePrice = sizeOption?.price || 4.99;
    basePrice += materialOption?.price || 0;

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
        borderWidth: String(borderWidth),
        borderColor: borderColor,
        previewImage: previewImageUrl,
        originalImage: uploadedImage,
      };

      // Add to cart
      await addToCart({
        productId: 1, // Using a placeholder product ID for custom stickers
        quantity,
        options: productOptions,
      });

      toast({
        title: "Added to Cart",
        description: `${quantity} ${stickerName} have been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add the sticker to your cart.",
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
  }, [selectedShape, selectedSize, borderWidth, borderColor, zoom]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the scale based on selected size and zoom
    const sizeOption = SIZES.find(s => s.id === selectedSize);
    const scale = (sizeOption?.scale || 1) * (zoom / 100);

    // Set canvas dimensions
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions maintaining aspect ratio
    const imgAspect = img.width / img.height;
    const canvasSize = Math.min(canvas.width, canvas.height) * scale;

    let drawWidth, drawHeight;
    if (imgAspect >= 1) {
      drawWidth = canvasSize;
      drawHeight = canvasSize / imgAspect;
    } else {
      drawHeight = canvasSize;
      drawWidth = canvasSize * imgAspect;
    }

    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    // Apply shape clipping
    ctx.save();
    applyShapeClipping(ctx, selectedShape, x, y, drawWidth, drawHeight, borderWidth);
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();

    // Draw border if specified
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      drawShapePath(ctx, selectedShape, x, y, drawWidth, drawHeight, borderWidth / 2);
      ctx.stroke();
    }
  };

  // Helper functions for shape clipping
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
      case "heart":
        drawHeart(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
      case "star":
        drawStar(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
      default:
        ctx.rect(x + inset, y + inset, width - inset * 2, height - inset * 2);
        break;
    }
    ctx.closePath();
    ctx.clip();
  };

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
      case "heart":
        drawHeart(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
      case "star":
        drawStar(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2 - inset);
        break;
      default:
        ctx.rect(x + inset, y + inset, width - inset * 2, height - inset * 2);
        break;
    }
    ctx.closePath();
  };

  // Helper functions to draw complex shapes
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const width = radius * 2;
    const height = radius * 2;

    ctx.moveTo(x, y - height / 4);
    ctx.bezierCurveTo(
      x - width / 2, y - height / 2,
      x - width / 2, y + height / 4,
      x, y + height / 2
    );
    ctx.bezierCurveTo(
      x + width / 2, y + height / 4,
      x + width / 2, y - height / 2,
      x, y - height / 4
    );
  };

  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const spikes = 5;
    const innerRadius = radius * 0.4;
    const outerRadius = radius;

    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.moveTo(x, y - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x1 = x + Math.cos(rot) * outerRadius;
      let y1 = y + Math.sin(rot) * outerRadius;
      ctx.lineTo(x1, y1);
      rot += step;

      let x2 = x + Math.cos(rot) * innerRadius;
      let y2 = y + Math.sin(rot) * innerRadius;
      ctx.lineTo(x2, y2);
      rot += step;
    }

    ctx.lineTo(x, y - outerRadius);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header with logo and navigation */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Sticker Customizer</h1>
          <Input
            className="max-w-xs border-gray-300"
            value={stickerName}
            onChange={(e) => setStickerName(e.target.value)}
            placeholder="Give this design a fancy name"
          />
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="default" size="sm" onClick={handleAddToCart}>
              Save & Continue
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar - Tools */}
          <div className="col-span-1 bg-white rounded-md shadow-sm border border-gray-200">
            <div className="py-4 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <Upload className="h-5 w-5" />
                <span className="text-xs mt-1">My Uploads</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <ImageIcon className="h-5 w-5" />
                <span className="text-xs mt-1">Images</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <TextIcon className="h-5 w-5" />
                <span className="text-xs mt-1">Text</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <Square className="h-5 w-5" />
                <span className="text-xs mt-1">Shapes</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <FileImage className="h-5 w-5" />
                <span className="text-xs mt-1">Background</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <QrCode className="h-5 w-5" />
                <span className="text-xs mt-1">QR Code</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-primary">
                <Grid className="h-5 w-5" />
                <span className="text-xs mt-1">Templates</span>
              </div>
            </div>
          </div>

          {/* Main editor area */}
          <div className="col-span-8 bg-white rounded-md shadow-sm border border-gray-200 p-4 flex flex-col">
            {/* Design dimensions */}
            <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Label className="mr-2">H</Label>
                <Input type="text" value="1.5" className="w-20 mr-4" />
                <Label className="mr-2">W</Label>
                <Input type="text" value="2.5" className="w-20" />
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Quality</span>
                <span className="w-px h-4 bg-gray-300" />
                <Button variant="outline" size="sm">
                  Remove Background
                </Button>
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex justify-center items-center py-2 mb-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                  Front Side
                </div>

                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 flex justify-center items-center border border-gray-200 rounded-md p-4 relative">
              {!uploadedImage ? (
                <AdvancedEditor
                  onImageProcessed={setUploadedImage}
                  onOriginalImageUpload={setUploadedImage}
                  onShapeSelected={setSelectedShape}
                  onBorderWidthChanged={setBorderWidth}
                  onBorderColorChanged={setBorderColor}
                  selectedShape={selectedShape}
                  borderWidth={borderWidth}
                  borderColor={borderColor}
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  min={50}
                  max={200}
                  step={5}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  className="w-32"
                />
                <Button variant="outline" size="icon">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">{zoom}%</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right sidebar - Properties */}
          <div className="col-span-3 bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Stickers</h2>
              <Button variant="ghost" size="sm">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M7.5 12L7.5 3M7.5 3L3.5 7M7.5 3L11.5 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>

            <div className="space-y-4">
              {/* Material */}
              <div>
                <Label className="text-sm text-gray-500">Material:</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map(material => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div>
                <Label className="text-sm text-gray-500">Size:</Label>
                <div className="text-sm font-medium">1.5" W x 2.5" H</div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm text-gray-500">Quantity:</Label>
                <div className="flex items-center">
                  <Select value={String(quantity)} onValueChange={(val) => setQuantity(Number(val))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select quantity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 qty</SelectItem>
                      <SelectItem value="250">250 qty</SelectItem>
                      <SelectItem value="500">500 qty</SelectItem>
                      <SelectItem value="1000">1000 qty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shape */}
              <div>
                <Label className="text-sm text-gray-500">Shape:</Label>
                <div className="grid grid-cols-5 gap-2 mt-1">
                  {[
                    { id: "rectangle", icon: <Square className="h-5 w-5" /> },
                    { id: "circle", icon: <Circle className="h-5 w-5" /> },
                    { id: "square", icon: <Square className="h-5 w-5" /> },
                    { id: "heart", icon: <Heart className="h-5 w-5" /> },
                    { id: "star", icon: <Star className="h-5 w-5" /> }
                  ].map(shape => (
                    <button
                      key={shape.id}
                      type="button"
                      className={`flex items-center justify-center p-2 rounded-md ${
                        selectedShape === shape.id 
                          ? "bg-primary/10 border-primary text-primary border" 
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 border"
                      }`}
                      onClick={() => setSelectedShape(shape.id)}
                    >
                      {shape.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border settings */}
              <div>
                <Label className="text-sm text-gray-500">Border Width:</Label>
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={[borderWidth]}
                  onValueChange={(value) => setBorderWidth(value[0])}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>None</span>
                  <span>Thick</span>
                </div>
              </div>

              {borderWidth > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Border Color:</Label>
                  <div className="grid grid-cols-7 gap-2 mt-1">
                    {['#0078D4', '#3399FF', '#33CC66', '#FFCC33', '#9966FF', '#FF6633', '#000000'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBorderColor(color)}
                        className={`w-full aspect-square rounded-md border ${
                          borderColor.toUpperCase() === color.toUpperCase()
                            ? 'border-gray-400 ring-2 ring-primary'
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="mt-6">
              <Button className="w-full" onClick={handleAddToCart}>
                Save & Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}