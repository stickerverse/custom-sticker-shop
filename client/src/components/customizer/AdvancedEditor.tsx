import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Sparkles, 
  Brush, 
  Layers, 
  Palette, 
  Image as ImageIcon, 
  Circle, 
  Square, 
  Heart,
  Star,
  LayoutGrid,
  Wand2
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AdvancedEditorProps {
  onImageProcessed: (url: string) => void;
  onOriginalImageUpload: (url: string) => void;
  onShapeSelected: (shape: string) => void;
  onBorderWidthChanged: (width: number) => void;
  onBorderColorChanged: (color: string) => void;
  selectedShape: string;
  borderWidth: number;
  borderColor: string;
}

export function AdvancedEditor({
  onImageProcessed,
  onOriginalImageUpload,
  onShapeSelected,
  onBorderWidthChanged,
  onBorderColorChanged,
  selectedShape,
  borderWidth,
  borderColor
}: AdvancedEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
      
      // Pass the original image to the parent component
      onOriginalImageUpload(fileUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Your image is ready for customization.",
      });
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
        title: "Image Enhanced",
        description: "Background removed and edges detected!",
      });
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("Error detecting borders:", error);
      setIsProcessing(false);
      toast({
        title: "Image Ready",
        description: "Your image is ready for customization!",
      });
    }
  });

  // Process image function - remove background with AI
  const removeBackground = () => {
    if (!imagePreview) return;
    
    setIsProcessing(true);
    toast({
      title: "Removing Background",
      description: "Our AI is removing the background from your image...",
    });
    
    // Use the AI to remove background
    removeBackgroundMutation.mutate(imagePreview);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    // Reset the parent's image as well
    onOriginalImageUpload('');
  };

  const isLoading = 
    removeBackgroundMutation.isPending || 
    detectBordersMutation.isPending ||
    isProcessing;

  // Shape selection options with icons
  const shapes = [
    { id: "rectangle", label: "Rectangle", icon: <LayoutGrid className="h-5 w-5" /> },
    { id: "circle", label: "Circle", icon: <Circle className="h-5 w-5" /> },
    { id: "square", label: "Square", icon: <Square className="h-5 w-5" /> },
    { id: "heart", label: "Heart", icon: <Heart className="h-5 w-5" /> },
    { id: "star", label: "Star", icon: <Star className="h-5 w-5" /> }
  ];

  return (
    <Card className="p-4 bg-background/95 backdrop-blur-md border-primary/20 shadow-lg">
      {!imagePreview ? (
        // Upload section - shown only when no image is uploaded
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium flex items-center">
              <ImageIcon className="h-4 w-4 mr-2 text-primary" />
              Upload Image
            </h3>
          </div>
          
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
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="bg-primary/10 p-4 rounded-full mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-base font-medium mb-1">Select Image</h4>
              <p className="text-sm text-muted-foreground text-center">
                Click to browse your files<br/>or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WEBP up to 5MB
              </p>
            </div>
          </div>
          
          <div className="rounded-lg p-3 bg-primary/5 text-sm space-y-1">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">AI-Powered Tools</span>
            </div>
            <ul className="text-xs text-muted-foreground pl-6 mt-1 space-y-1 list-disc">
              <li>Background removal</li>
              <li>Edge detection</li>
              <li>Custom shapes</li>
              <li>Border customization</li>
            </ul>
          </div>
        </div>
      ) : (
        // Customization tools - shown after image is uploaded
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium flex items-center">
              <Brush className="h-4 w-4 mr-2 text-primary" />
              Customize Sticker
            </h3>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs"
                onClick={handleUploadClick}
              >
                <Upload className="h-3 w-3 mr-1" />
                Change
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs text-red-500"
                onClick={clearImage}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
          
          <div className="relative rounded-lg overflow-hidden bg-black/5">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full max-h-[120px] object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                <div className="flex items-center space-x-2 bg-background/80 px-3 py-2 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-medium">Processing...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="rounded-lg border border-primary/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center">
                <Wand2 className="h-4 w-4 mr-2 text-primary" />
                AI Enhancements
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Remove background to create professional stickers
            </p>
            <Button 
              className="w-full bg-primary"
              size="sm"
              onClick={removeBackground}
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
                  Remove Background
                </>
              )}
            </Button>
          </div>
          
          <Separator className="my-2 bg-primary/10" />
          
          <div>
            <Label className="text-sm font-semibold flex items-center mb-2">
              <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
              Shape
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {shapes.map(shape => (
                <Button
                  key={shape.id}
                  type="button"
                  variant={selectedShape === shape.id ? "default" : "outline"}
                  className={`flex flex-col items-center justify-center py-1 px-1 h-auto aspect-square ${
                    selectedShape === shape.id 
                      ? "bg-primary/90 text-primary-foreground border-primary" 
                      : "bg-background hover:bg-primary/5 text-foreground border-primary/20"
                  }`}
                  onClick={() => onShapeSelected(shape.id)}
                >
                  {shape.icon}
                  <span className="text-[9px] mt-1 leading-tight">{shape.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <Separator className="my-2 bg-primary/10" />
          
          <div>
            <Label className="text-sm font-semibold flex items-center">
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
            <>
              <Separator className="my-2 bg-primary/10" />
              
              <div>
                <Label className="text-sm font-semibold flex items-center mb-2">
                  <Palette className="h-4 w-4 mr-2 text-primary" />
                  Border Color
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {['#FF3366', '#3399FF', '#33CC66', '#FFCC33', '#9966FF', '#FF6633', '#000000'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onBorderColorChanged(color)}
                      className={`w-full aspect-square rounded-full border-2 ${
                        borderColor.toUpperCase() === color.toUpperCase()
                          ? 'border-white ring-2 ring-primary shadow-lg'
                          : 'border-white/50'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center mt-3">
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
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export default AdvancedEditor;