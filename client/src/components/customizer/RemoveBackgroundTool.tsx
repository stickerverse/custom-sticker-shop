import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RemoveBackgroundToolProps {
  onImageProcessed: (url: string) => void;
}

export function RemoveBackgroundTool({ onImageProcessed }: RemoveBackgroundToolProps) {
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
    }
  };

  // Remove background mutation
  const removeBackgroundMutation = useMutation({
    mutationFn: async (file: File) => {
      // Create a FormData object to handle file upload
      const formData = new FormData();
      formData.append('image', file);
      
      // First, upload the image to get a publicly accessible URL
      const uploadResponse = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      const uploadResult = await uploadResponse.json();
      
      // Now remove the background using the public URL
      const response = await fetch('/api/image/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadResult.url }),
      });
      
      if (!response.ok) throw new Error('Failed to remove background');
      return response.json();
    },
    onSuccess: (data) => {
      setProcessedImage(data.url);
      onImageProcessed(data.url);
      
      toast({
        title: "Background Removed",
        description: "Your image is ready for customization!",
      });
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("Error removing background:", error);
      toast({
        title: "Error",
        description: "Failed to remove image background. Please try again or use a different image format.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Process image function - removes background on demand
  const removeBackground = () => {
    if (!selectedFile) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    toast({
      title: "Removing Background",
      description: "Our AI is removing the background from your image...",
    });
    
    // Use the AI to remove background
    removeBackgroundMutation.mutate(selectedFile);
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
  };

  const isLoading = removeBackgroundMutation.isPending || isProcessing;

  return (
    <Card className="p-4 bg-white border-gray-200 shadow-sm rounded-md">
      {!imagePreview ? (
        // Upload section - shown only when no image is uploaded
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium text-gray-700 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2 text-primary" />
              Upload Your Image
            </h3>
          </div>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors"
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
              <h4 className="text-base font-medium mb-1 text-gray-800">Upload Your Image</h4>
              <p className="text-sm text-gray-500 text-center">
                Click to browse your files<br/>or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPG, PNG, WEBP up to 5MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Background removal tools - shown after image is uploaded
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Remove Image Background
            </h3>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs border-gray-300 text-gray-600"
                onClick={handleUploadClick}
              >
                <Upload className="h-3 w-3 mr-1" />
                Change
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs text-red-500 border-red-200"
                onClick={clearImage}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
          
          <div className="relative rounded-md overflow-hidden bg-gray-100 border border-gray-200">
            <img 
              src={processedImage || imagePreview} 
              alt="Preview" 
              className="w-full max-h-[200px] object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-medium text-gray-700">Processing...</span>
                </div>
              </div>
            )}
          </div>
          
          {!processedImage && (
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white"
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
          )}
          
          {processedImage && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4">
              <div className="flex items-center text-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Background Removed Successfully</span>
              </div>
              <p className="text-xs text-green-600 pl-6 mt-1">
                Your image now has a transparent background
              </p>
              <Button
                className="w-full mt-3 bg-primary hover:bg-primary/90 text-white"
                onClick={() => onImageProcessed(processedImage)}
              >
                Use This Image
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}