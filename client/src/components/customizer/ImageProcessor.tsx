import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Upload, Trash2, Sparkles, VectorSelect } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface ImageProcessorProps {
  onImageProcessed: (url: string) => void;
}

export function ImageProcessor({ onImageProcessed }: ImageProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [lowThreshold, setLowThreshold] = useState<number>(100);
  const [highThreshold, setHighThreshold] = useState<number>(200);
  const [activeTab, setActiveTab] = useState<string>('removeBackground');

  // For file upload and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl);
      setProcessedImage(null); // Reset processed image when new file is selected
    }
  };

  // Remove background mutation
  const removeBackgroundMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await apiRequest('/api/image/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      return response;
    },
    onSuccess: (data) => {
      setProcessedImage(data.url);
      onImageProcessed(data.url);
    },
  });

  // Detect borders mutation
  const detectBordersMutation = useMutation({
    mutationFn: async (params: { imageUrl: string; lowThreshold: number; highThreshold: number }) => {
      const response = await apiRequest('/api/image/detect-borders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response;
    },
    onSuccess: (data) => {
      setProcessedImage(data.url);
      onImageProcessed(data.url);
    },
  });

  // Upload image to a temporary storage and get URL
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // For demo purposes, we're using a fake upload service
      // Replace with your actual image upload endpoint
      const formData = new FormData();
      formData.append('image', file);
      
      // Simulate upload - in a real app, replace with actual upload API
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // return await response.json();
      
      // For now, we'll just use the object URL
      return { url: URL.createObjectURL(file) };
    },
    onSuccess: (data) => {
      // Process the image based on active tab
      if (activeTab === 'removeBackground') {
        removeBackgroundMutation.mutate(data.url);
      } else if (activeTab === 'detectBorders') {
        detectBordersMutation.mutate({ 
          imageUrl: data.url, 
          lowThreshold, 
          highThreshold 
        });
      }
    },
  });

  const handleProcessImage = () => {
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setProcessedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };

  const isLoading = 
    uploadImageMutation.isPending || 
    removeBackgroundMutation.isPending || 
    detectBordersMutation.isPending;

  return (
    <Card className="p-6 bg-background/80 backdrop-blur-md border-primary/20 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/20 z-0" />
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-4 text-primary">Image Customizer</h3>
        
        <Tabs defaultValue="removeBackground" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="removeBackground" className="relative">
              <Sparkles className="mr-2 h-4 w-4" />
              Remove Background
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform scale-x-0 transition-transform group-data-[state=active]:scale-x-100"></span>
            </TabsTrigger>
            <TabsTrigger value="detectBorders" className="relative">
              <VectorSelect className="mr-2 h-4 w-4" />
              Detect Borders
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform scale-x-0 transition-transform group-data-[state=active]:scale-x-100"></span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="removeBackground" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an image to automatically remove its background. Perfect for creating custom stickers!
            </p>
          </TabsContent>
          
          <TabsContent value="detectBorders" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Detect edges in your image to create outline effects for your stickers.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Low Threshold: {lowThreshold}</Label>
                </div>
                <Slider
                  value={[lowThreshold]}
                  min={1}
                  max={255}
                  step={1}
                  onValueChange={(value) => setLowThreshold(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>High Threshold: {highThreshold}</Label>
                </div>
                <Slider
                  value={[highThreshold]}
                  min={1}
                  max={255}
                  step={1}
                  onValueChange={(value) => setHighThreshold(value[0])}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="image-upload">Upload Image</Label>
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
            </div>
            
            <div className="flex items-end space-y-0 gap-4">
              <Button 
                onClick={handleProcessImage} 
                disabled={!selectedFile || isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground group relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
                Process Image
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/30 to-primary-foreground/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Original Image Preview */}
            <div className="border rounded-lg p-4 bg-background/50 backdrop-blur-sm">
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
            <div className="border rounded-lg p-4 bg-background/50 backdrop-blur-sm">
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
                    {isLoading ? 'Processing...' : 'No processed image yet'}
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