import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Sparkles, 
  Plus, 
  Brush, 
  Layers, 
  Filter, 
  Palette, 
  Image, 
  Circle, 
  Square, 
  Heart
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AdvancedEditorProps {
  onImageProcessed: (url: string) => void;
  onShapeSelected: (shape: string) => void;
  onBorderWidthChanged: (width: number) => void;
  onBorderColorChanged: (color: string) => void;
  selectedShape: string;
  borderWidth: number;
  borderColor: string;
}

export function AdvancedEditor({
  onImageProcessed,
  onShapeSelected,
  onBorderWidthChanged,
  onBorderColorChanged,
  selectedShape,
  borderWidth,
  borderColor
}: AdvancedEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // For file upload and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl);
      setProcessedImage(null); // Reset processed image when new file is selected
      
      // Automatically process the image when selected
      setTimeout(() => {
        processImage(file);
      }, 500);
    }
  };

  // Remove background mutation
  const removeBackgroundMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch('/api/image/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to remove background');
      return response.json();
    },
    onSuccess: (data) => {
      setProcessedImage(data.url);
      onImageProcessed(data.url);
      
      // After removing background, detect borders
      if (data.url) {
        detectBordersMutation.mutate({ 
          imageUrl: data.url, 
          lowThreshold: 50,  // Default values
          highThreshold: 150
        });
      }
    },
    onError: (error) => {
      console.error("Error removing background:", error);
      toast({
        title: "Error",
        description: "Failed to remove image background. Please try again or use a different image.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Detect borders mutation
  const detectBordersMutation = useMutation({
    mutationFn: async (params: { imageUrl: string; lowThreshold: number; highThreshold: number }) => {
      const response = await fetch('/api/image/detect-borders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to detect borders');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Image Ready",
        description: "Your image is now ready for customization!",
      });
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("Error detecting borders:", error);
      // Don't show an error to the user for this step
      setIsProcessing(false);
    }
  });

  // Process image function that handles both operations
  const processImage = (file: File) => {
    if (!file) return;
    
    setIsProcessing(true);
    toast({
      title: "Processing Image",
      description: "Your image is being prepared for customization...",
    });
    
    // Create an object URL for the file
    const objectUrl = URL.createObjectURL(file);
    
    // First remove background
    removeBackgroundMutation.mutate(objectUrl);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setProcessedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };

  const isLoading = 
    removeBackgroundMutation.isPending || 
    detectBordersMutation.isPending ||
    isProcessing;

  // Shape selection options with icons
  const shapes = [
    { id: "rectangle", label: "Rectangle", icon: <Square className="h-5 w-5" /> },
    { id: "circle", label: "Circle", icon: <Circle className="h-5 w-5" /> },
    { id: "square", label: "Square", icon: <Square className="h-5 w-5 rounded-sm" /> },
    { id: "heart", label: "Heart", icon: <Heart className="h-5 w-5" /> },
    { id: "star", label: "Star", icon: <Sparkles className="h-5 w-5" /> }
  ];

  return (
    <Card className="p-4 bg-background/95 backdrop-blur-md border-primary/20 shadow-lg">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 bg-primary/5">
          <TabsTrigger value="upload" className="data-[state=active]:bg-primary/10">
            <Image className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="customize" className="data-[state=active]:bg-primary/10">
            <Brush className="h-4 w-4 mr-2" />
            Customize
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="text-center">
            <div 
              className="border-2 border-dashed border-primary/20 rounded-lg p-6 cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={handleUploadClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!imagePreview ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="bg-primary/10 p-4 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-base font-medium mb-1">Upload Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WEBP up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={processedImage || imagePreview} 
                    alt="Preview" 
                    className="max-h-40 mx-auto rounded-md"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] rounded-md">
                      <div className="flex items-center space-x-2 bg-background/80 px-3 py-1 rounded-full">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs font-medium">Processing...</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center mt-3 space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadClick();
                      }}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Change
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {imagePreview && (
              <Button 
                className="mt-4 bg-primary"
                size="sm"
                onClick={() => selectedFile && processImage(selectedFile)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply AI Enhancement
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="rounded-lg p-3 bg-primary/5 text-sm space-y-1">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">AI Image Processing</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Automatically removes backgrounds and detects edges for professional sticker creation.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="customize" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm flex items-center">
                <Filter className="h-4 w-4 mr-2 text-primary" />
                Shape
              </Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {shapes.map(shape => (
                  <Button
                    key={shape.id}
                    type="button"
                    variant={selectedShape === shape.id ? "default" : "outline"}
                    className={`flex flex-col items-center justify-center p-2 h-auto aspect-square ${
                      selectedShape === shape.id 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-background hover:bg-primary/5 text-foreground border-primary/20"
                    }`}
                    onClick={() => onShapeSelected(shape.id)}
                  >
                    {shape.icon}
                    <span className="text-[10px] mt-1">{shape.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm flex items-center">
                <Layers className="h-4 w-4 mr-2 text-primary" />
                Border Width
              </Label>
              <div className="flex items-center mt-2">
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={[borderWidth]}
                  onValueChange={(value) => onBorderWidthChanged(value[0])}
                  className="flex-1"
                />
                <span className="ml-2 text-sm min-w-[40px] text-right">
                  {borderWidth}px
                </span>
              </div>
            </div>
            
            {borderWidth > 0 && (
              <div>
                <Label className="text-sm flex items-center">
                  <Palette className="h-4 w-4 mr-2 text-primary" />
                  Border Color
                </Label>
                <div className="flex items-center mt-2">
                  <div 
                    className="w-10 h-10 rounded-md border border-primary/20 relative overflow-hidden flex items-center justify-center"
                    style={{ background: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), 
                             linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)`,
                             backgroundSize: '8px 8px',
                             backgroundPosition: '0 0, 4px 4px' }}
                  >
                    <div 
                      className="absolute inset-1 rounded"
                      style={{ backgroundColor: borderColor }}
                    />
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => onBorderColorChanged(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div className="ml-2 flex-1">
                    <input
                      type="text"
                      value={borderColor}
                      onChange={(e) => onBorderColorChanged(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-primary/20 text-sm bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {!processedImage && (
            <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm flex items-start space-x-2">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Upload an image first</p>
                <p className="text-xs">Switch to the Upload tab to add your image.</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={() => setSelectedTab("upload")}
            >
              <Upload className="h-3 w-3 mr-1" />
              Back to Upload
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default AdvancedEditor;