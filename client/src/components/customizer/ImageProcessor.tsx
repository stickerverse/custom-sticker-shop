import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Trash2, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

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
      setIsProcessing(false);
    },
  });

  // Process image function that handles both operations
  const processImage = (file: File) => {
    if (!file) return;
    
    setIsProcessing(true);
    
    // Create an object URL for the file
    const objectUrl = URL.createObjectURL(file);
    
    // First remove background
    removeBackgroundMutation.mutate(objectUrl);
  };

  // Watch for changes in shape, border width, or color and reprocess if needed
  useEffect(() => {
    if (processedImage && selectedShape && (borderWidth > 0 || selectedShape !== 'rectangle')) {
      // The image is already processed, we just need to apply the new shape/border
      // This would be handled in the parent component with canvas manipulations
    }
  }, [selectedShape, borderWidth, borderColor, processedImage]);
  
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

  return (
    <Card className="p-6 bg-background/80 backdrop-blur-md border-primary/20 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/20 z-0" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-primary flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            AI Image Processor
          </h3>
          
          <div className="flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => selectedFile && processImage(selectedFile)}
              disabled={!selectedFile || isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" />
              )}
              Reprocess
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Upload an image to automatically remove the background and prepare it for your custom sticker.
        </p>
        
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Input
              id="image-upload"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="flex-1"
            />
            {selectedFile && (
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={clearImage}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image Preview */}
            <div className="border rounded-lg p-3 bg-background/50 backdrop-blur-sm">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Original</h4>
              <div className="aspect-square flex items-center justify-center bg-black/5 rounded-md overflow-hidden">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Original" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No image selected</p>
                )}
              </div>
            </div>
            
            {/* Processed Image Preview */}
            <div className="border rounded-lg p-3 bg-background/50 backdrop-blur-sm">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Processed</h4>
              <div className="aspect-square flex items-center justify-center bg-black/5 rounded-md overflow-hidden relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm mt-2">Processing image...</p>
                    </div>
                  </div>
                )}
                
                {processedImage ? (
                  <img 
                    src={processedImage} 
                    alt="Processed" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? 'Processing...' : 'Select an image to process'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}