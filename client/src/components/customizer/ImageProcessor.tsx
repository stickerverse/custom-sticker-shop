import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Sparkles, 
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ImageProcessorProps {
  onImageProcessed: (url: string) => void;
  onBorderDetected?: (borderData: any) => void;
  selectedShape: string;
  borderWidth: number;
  borderColor: string;
}

export function ImageProcessor({ 
  onImageProcessed, 
  onBorderDetected, 
  selectedShape,
  borderWidth,
  borderColor
}: ImageProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
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
      setProcessedImage(null); // Reset processed image when new file is selected
      
      // Pass the original image to the parent component immediately
      onImageProcessed(fileUrl);
      
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
        description: "Failed to remove image background. Please try again.",
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
      // Don't replace the processed image, just notify about borders
      if (onBorderDetected) {
        onBorderDetected(data);
      }
      
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

  // Process image function - removes background on demand
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
    setProcessedImage(null);
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    // Reset the parent component's image
    onImageProcessed('');
  };

  const isLoading = 
    removeBackgroundMutation.isPending || 
    detectBordersMutation.isPending ||
    isProcessing;

  return (
    <Card className="p-4 bg-background/95 backdrop-blur-md border-primary/20 shadow-lg">
      {!imagePreview ? (
        // Upload section - shown only when no image is uploaded
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
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
              <Wand2 className="h-4 w-4 mr-2 text-primary" />
              AI Enhancements
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
              src={processedImage || imagePreview} 
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
          
          {!processedImage && (
            <div className="rounded-lg border border-primary/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center">
                  <Wand2 className="h-4 w-4 mr-2 text-primary" />
                  Background Removal
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
          )}
          
          {processedImage && (
            <div className="rounded-lg border border-primary/20 bg-green-50/20 p-3">
              <div className="flex items-center text-green-600">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Background Removed</span>
              </div>
              <p className="text-xs text-green-600/80 pl-6 mt-1">
                Your image has been processed and is ready for customization
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}