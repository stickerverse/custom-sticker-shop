import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
  ChevronRight,
  Trash2,
  Volume2,
  VolumeX,
  Palette,
  Layers,
  Wand2,
  Download,
  Move,
} from "lucide-react";

// Import your editor components
import AdvancedEditor from "@/components/customizer/AdvancedEditor";
import { ImageProcessor } from "@/components/customizer/ImageProcessor";
import { RemoveBackgroundTool } from "@/components/customizer/RemoveBackgroundTool";

// Sticker size options
const SIZES = [
  { id: "small", label: 'Small (2")', price: 3.99, scale: 0.8 },
  { id: "medium", label: 'Medium (3")', price: 4.99, scale: 1.0 },
  { id: "large", label: 'Large (4")', price: 5.99, scale: 1.2 },
  { id: "xlarge", label: 'Extra Large (5")', price: 7.99, scale: 1.4 },
];

// Sticker material options
const MATERIALS = [
  { id: "vinyl", label: "White Paper Sticker", price: 0 },
  { id: "holographic", label: "Holographic", price: 1.5 },
  { id: "glitter", label: "Glitter", price: 1.5 },
  { id: "clear", label: "Clear", price: 1.0 },
  { id: "metallic", label: "Metallic", price: 2.0 },
];

// Background Music Player Component
const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [showVolume, setShowVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio("/sounds/calm-melody.mp3");
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((e) => console.error("Audio playback failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 glass-card px-3 py-2 flex items-center gap-2 hover:shadow-float transition-all duration-300"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      <button
        onClick={togglePlay}
        className="text-primary focus:outline-none"
        aria-label={
          isPlaying ? "Pause background music" : "Play background music"
        }
      >
        {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      <div className="text-xs text-gray-600">
        {isPlaying ? "Ambient Music" : "Enable Music"}
      </div>
      {showVolume && (
        <div className="ml-2">
          <Slider
            min={0}
            max={100}
            step={1}
            value={[volume * 100]}
            onValueChange={(value) => setVolume(value[0] / 100)}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
};

export default function Customizer() {
  const [, setLocation] = useLocation();
  const [activeTool, setActiveTool] = useState<string>("upload");
  const [stickerName, setStickerName] = useState("Custom Sticker");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState("circle");
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedMaterial, setSelectedMaterial] = useState("vinyl");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#FF3366");
  const [fillColor, setFillColor] = useState("#FFFFFF");
  const [quantity, setQuantity] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [currentSide, setCurrentSide] = useState("front");
  const [textContent, setTextContent] = useState("Your Text Here");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [qrValue, setQrValue] = useState("https://example.com");
  const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
  const [designHeight, setDesignHeight] = useState("1.5");
  const [designWidth, setDesignWidth] = useState("2.5");
  const [isProcessing, setIsProcessing] = useState(false);

  // Canvas ref for the editor
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { addToCart } = useCart();

  // Calculate total price
  const getBasePrice = () => {
    const sizeOption = SIZES.find((s) => s.id === selectedSize);
    const materialOption = MATERIALS.find((m) => m.id === selectedMaterial);

    let basePrice = sizeOption?.price || 4.99;
    basePrice += materialOption?.price || 0;

    if (borderWidth > 0) {
      basePrice += 0.5;
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

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      setUploadedImage(fileUrl);
      toast({
        title: "Image Uploaded",
        description: "Your image is ready for customization.",
      });
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the scale based on selected size and zoom
    const sizeOption = SIZES.find((s) => s.id === selectedSize);
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
    applyShapeClipping(
      ctx,
      selectedShape,
      x,
      y,
      drawWidth,
      drawHeight,
      borderWidth,
    );
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();

    // Draw border if specified
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      drawShapePath(
        ctx,
        selectedShape,
        x,
        y,
        drawWidth,
        drawHeight,
        borderWidth / 2,
      );
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
    borderOffset: number,
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
        drawHeart(
          ctx,
          x + width / 2,
          y + height / 2,
          Math.min(width, height) / 2 - inset,
        );
        break;
      case "star":
        drawStar(
          ctx,
          x + width / 2,
          y + height / 2,
          Math.min(width, height) / 2 - inset,
        );
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
    inset: number,
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
        drawHeart(
          ctx,
          x + width / 2,
          y + height / 2,
          Math.min(width, height) / 2 - inset,
        );
        break;
      case "star":
        drawStar(
          ctx,
          x + width / 2,
          y + height / 2,
          Math.min(width, height) / 2 - inset,
        );
        break;
      default:
        ctx.rect(x + inset, y + inset, width - inset * 2, height - inset * 2);
        break;
    }
    ctx.closePath();
  };

  // Helper functions to draw complex shapes
  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ) => {
    const width = radius * 2;
    const height = radius * 2;

    ctx.moveTo(x, y - height / 4);
    ctx.bezierCurveTo(
      x - width / 2,
      y - height / 2,
      x - width / 2,
      y + height / 4,
      x,
      y + height / 2,
    );
    ctx.bezierCurveTo(
      x + width / 2,
      y + height / 4,
      x + width / 2,
      y - height / 2,
      x,
      y - height / 4,
    );
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ) => {
    const spikes = 5;
    const innerRadius = radius * 0.4;
    const outerRadius = radius;

    let rot = (Math.PI / 2) * 3;
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

  // Add text to canvas
  const addTextToCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use current canvas state
    const textX = canvas.width / 2;
    const textY = canvas.height / 2;

    // Set text properties
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw text
    ctx.fillText(textContent, textX, textY);

    toast({
      title: "Text Added",
      description: "Text has been added to your design.",
    });
  };

  // Generate QR code on canvas
  const generateQRCode = () => {
    if (!qrValue) {
      toast({
        title: "No URL Provided",
        description: "Please enter a URL for the QR code.",
        variant: "destructive",
      });
      return;
    }

    // For this example, we'll just show a toast since actual QR code generation
    // requires additional libraries
    toast({
      title: "QR Code Generated",
      description: `QR code for ${qrValue} has been added to your design.`,
    });

    // In a real implementation, you would use a QR code library like qrcode.js
    // to generate and draw the QR code on the canvas
  };

  // Handle background removal
  const handleRemoveBackground = (processedImageUrl: string) => {
    setUploadedImage(processedImageUrl);
    setShowBackgroundRemoval(false);
    toast({
      title: "Background Removed",
      description: "Image background has been successfully removed.",
    });
  };

  // Export design
  const handleExportDesign = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");

    // Create download link
    const downloadLink = document.createElement("a");
    downloadLink.href = dataUrl;
    downloadLink.download = `${stickerName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    toast({
      title: "Design Exported",
      description: "Your design has been exported as a PNG image.",
    });
  };

  // Add glassmorphism and floating element classes
  const glassCardClass =
    "bg-white/80 backdrop-blur-md rounded-lg border border-white/20 shadow-md";
  const floatElementClass =
    "transition-all duration-300 hover:shadow-lg hover:-translate-y-1";

  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 min-h-screen">
      {/* Header with logo and navigation */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-sm bg-white/70 border-b border-gray-200 p-4`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Sticker Customizer</h1>
          <Input
            className="max-w-xs bg-white/50 backdrop-blur-sm border-gray-300"
            value={stickerName}
            onChange={(e) => setStickerName(e.target.value)}
            placeholder="Give this design a fancy name"
          />
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className={floatElementClass}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={floatElementClass}
              onClick={handleExportDesign}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddToCart}
              className={`${floatElementClass} bg-primary hover:bg-primary/90`}
            >
              Save & Continue
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar - Tools */}
          <div className={`col-span-1 ${glassCardClass} animate-float-slow`}>
            <div className="py-4 flex flex-col items-center gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "upload" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("upload")}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs mt-1">Upload</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload an image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "images" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("images")}
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-xs mt-1">Images</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage images</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "text" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("text")}
                    >
                      <TextIcon className="h-5 w-5" />
                      <span className="text-xs mt-1">Text</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add text</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "shapes" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("shapes")}
                    >
                      <Square className="h-5 w-5" />
                      <span className="text-xs mt-1">Shapes</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add shapes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "effects" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("effects")}
                    >
                      <Wand2 className="h-5 w-5" />
                      <span className="text-xs mt-1">Effects</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Apply effects</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "qrcode" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("qrcode")}
                    >
                      <QrCode className="h-5 w-5" />
                      <span className="text-xs mt-1">QR Code</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate QR Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`flex flex-col items-center cursor-pointer ${activeTool === "templates" ? "text-primary" : "text-gray-500 hover:text-primary"}`}
                      onClick={() => setActiveTool("templates")}
                    >
                      <Grid className="h-5 w-5" />
                      <span className="text-xs mt-1">Templates</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Browse templates</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Main editor area */}
          <div className={`col-span-8 ${glassCardClass} p-4 flex flex-col`}>
            {/* Design dimensions */}
            <div className="flex items-center justify-between mb-4 px-4 py-2 backdrop-blur-sm bg-white/50 rounded">
              <div className="flex items-center">
                <Label className="mr-2">H</Label>
                <Input
                  type="text"
                  value={designHeight}
                  onChange={(e) => setDesignHeight(e.target.value)}
                  className="w-20 mr-4 bg-white/70"
                />
                <Label className="mr-2">W</Label>
                <Input
                  type="text"
                  value={designWidth}
                  onChange={(e) => setDesignWidth(e.target.value)}
                  className="w-20 bg-white/70"
                />
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className={floatElementClass}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Quality</span>
                <span className="w-px h-4 bg-gray-300" />
                <Button
                  variant="outline"
                  size="sm"
                  className={floatElementClass}
                  onClick={() => setShowBackgroundRemoval(true)}
                >
                  Remove Background
                </Button>
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex justify-center items-center py-2 mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={floatElementClass}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="px-3 py-1 bg-white/50 backdrop-blur-sm border border-gray-200 rounded text-sm">
                  Front Side
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className={floatElementClass}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tool-specific controls based on active tool */}
            {activeTool === "upload" && (
              <div className="mb-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50/50 transition-colors text-center backdrop-blur-sm"
                  onClick={handleUploadClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="bg-blue-50 p-4 rounded-full mb-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="text-base font-medium mb-1 text-gray-800">
                      Upload Your Image
                    </h4>
                    <p className="text-sm text-gray-500 text-center">
                      Click to browse your files
                      <br />
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      JPG, PNG, WEBP up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTool === "text" && (
              <div className="mb-4 p-4 bg-white/50 backdrop-blur-sm rounded-md border border-gray-200">
                <h3 className="text-sm font-medium mb-3">Text Tool</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      Text Content
                    </Label>
                    <Input
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter your text"
                      className="bg-white/70"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Font Size
                      </Label>
                      <Select
                        value={String(fontSize)}
                        onValueChange={(val) => setFontSize(Number(val))}
                      >
                        <SelectTrigger className="bg-white/70">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64,
                          ].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Font Family
                      </Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="bg-white/70">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">
                            Times New Roman
                          </SelectItem>
                          <SelectItem value="Courier New">
                            Courier New
                          </SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Text Color
                      </Label>
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-9 p-1 bg-white/70"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={addTextToCanvas}
                    className={`${floatElementClass} mt-3`}
                  >
                    <TextIcon className="h-4 w-4 mr-2" />
                    Add Text to Design
                  </Button>
                </div>
              </div>
            )}

            {activeTool === "shapes" && (
              <div className="mb-4 p-4 bg-white/50 backdrop-blur-sm rounded-md border border-gray-200">
                <h3 className="text-sm font-medium mb-3">Shape Tool</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">
                      Select Shape
                    </Label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        {
                          id: "rectangle",
                          icon: <Square className="h-6 w-6" />,
                          label: "Rectangle",
                        },
                        {
                          id: "square",
                          icon: <Square className="h-6 w-6" />,
                          label: "Square",
                        },
                        {
                          id: "circle",
                          icon: <Circle className="h-6 w-6" />,
                          label: "Circle",
                        },
                        {
                          id: "heart",
                          icon: <Heart className="h-6 w-6" />,
                          label: "Heart",
                        },
                        {
                          id: "star",
                          icon: <Star className="h-6 w-6" />,
                          label: "Star",
                        },
                      ].map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          className={`flex flex-col items-center p-2 rounded-md ${
                            selectedShape === shape.id
                              ? "bg-primary/10 border-primary text-primary border"
                              : "bg-white/70 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 border"
                          } ${floatElementClass}`}
                          onClick={() => setSelectedShape(shape.id)}
                        >
                          {shape.icon}
                          <span className="text-xs mt-1">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Fill Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="w-10 h-10 p-1 bg-white/70"
                        />
                        <Input
                          type="text"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="flex-1 bg-white/70"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Border Width
                      </Label>
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
                  </div>

                  {borderWidth > 0 && (
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Border Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="w-10 h-10 p-1 bg-white/70"
                        />
                        <Input
                          type="text"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="flex-1 bg-white/70"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTool === "qrcode" && (
              <div className="mb-4 p-4 bg-white/50 backdrop-blur-sm rounded-md border border-gray-200">
                <h3 className="text-sm font-medium mb-3">QR Code Generator</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      URL or Text
                    </Label>
                    <Input
                      value={qrValue}
                      onChange={(e) => setQrValue(e.target.value)}
                      placeholder="https://example.com"
                      className="bg-white/70"
                    />
                  </div>

                  <Button
                    onClick={generateQRCode}
                    className={`${floatElementClass} mt-2`}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                </div>
              </div>
            )}

            {activeTool === "effects" && (
              <div className="mb-4 p-4 bg-white/50 backdrop-blur-sm rounded-md border border-gray-200">
                <h3 className="text-sm font-medium mb-3">Effects & Filters</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      Opacity
                    </Label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[100]}
                      onValueChange={(value) => {
                        /* Handle opacity change */
                      }}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Transparent</span>
                      <span>Solid</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      Background Removal
                    </Label>
                    <Button
                      onClick={() => setShowBackgroundRemoval(true)}
                      className={`w-full ${floatElementClass}`}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Remove Background
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas area */}
            <div className="flex-1 flex justify-center items-center border border-gray-200 rounded-md p-4 relative backdrop-blur-sm bg-white/20">
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

              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                    <span>Processing your design...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  className={floatElementClass}
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
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
                <Button
                  variant="outline"
                  size="icon"
                  className={floatElementClass}
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">{zoom}%</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={floatElementClass}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right sidebar - Properties */}
          <div className={`col-span-3 ${glassCardClass} p-4 animate-float`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Stickers</h2>
              <Button variant="ghost" size="sm">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="M7.5 12L7.5 3M7.5 3L3.5 7M7.5 3L11.5 7"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>

            <div className="space-y-4">
              {/* Material */}
              <div>
                <Label className="text-sm text-gray-500">Material:</Label>
                <Select
                  value={selectedMaterial}
                  onValueChange={setSelectedMaterial}
                >
                  <SelectTrigger className="w-full bg-white/70">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((material) => (
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
                <div className="text-sm font-medium">
                  {designWidth}" W x {designHeight}" H
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm text-gray-500">Quantity:</Label>
                <div className="flex items-center">
                  <Select
                    value={String(quantity)}
                    onValueChange={(val) => setQuantity(Number(val))}
                  >
                    <SelectTrigger className="w-full bg-white/70">
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
                    { id: "star", icon: <Star className="h-5 w-5" /> },
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      type="button"
                      className={`flex items-center justify-center p-2 rounded-md ${
                        selectedShape === shape.id
                          ? "bg-primary/10 border-primary text-primary border"
                          : "bg-white/70 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 border"
                      } ${floatElementClass}`}
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
                    {[
                      "#0078D4",
                      "#3399FF",
                      "#33CC66",
                      "#FFCC33",
                      "#9966FF",
                      "#FF6633",
                      "#000000",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBorderColor(color)}
                        className={`w-full aspect-square rounded-md border ${
                          borderColor.toUpperCase() === color.toUpperCase()
                            ? "border-gray-400 ring-2 ring-primary shadow-md"
                            : "border-gray-200"
                        } ${floatElementClass}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Price Display */}
              <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white/50 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Price per unit:</span>
                  <span className="font-bold text-primary">
                    ${price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="font-bold text-lg text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6">
                <Button
                  className={`w-full bg-primary hover:bg-primary/90 ${floatElementClass}`}
                  onClick={handleAddToCart}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Removal Dialog */}
      <Dialog
        open={showBackgroundRemoval}
        onOpenChange={setShowBackgroundRemoval}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Background</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RemoveBackgroundTool onImageProcessed={handleRemoveBackground} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Background Music Player */}
      <BackgroundMusic />
    </div>
  );
}
