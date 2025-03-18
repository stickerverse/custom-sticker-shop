import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface CustomizerFormProps {
  optionsByType: Record<string, any[]>;
  selectedOptions: Record<string, string>;
  onOptionSelect: (optionType: string, value: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const CustomizerForm = ({ 
  optionsByType, 
  selectedOptions, 
  onOptionSelect,
  quantity,
  onQuantityChange
}: CustomizerFormProps) => {
  // State for custom size switch
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState("3");
  const [customHeight, setCustomHeight] = useState("3");
  
  // Format price modifier for display
  const formatPriceModifier = (priceModifier: number) => {
    if (priceModifier === 0) return "";
    return priceModifier > 0 ? `+$${(priceModifier / 100).toFixed(2)}` : `-$${(Math.abs(priceModifier) / 100).toFixed(2)}`;
  };
  
  // Common classes for option selection
  const selectedClass = "border-primary bg-primary/10";
  const defaultClass = "border-gray-200 hover:border-gray-300";
  
  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    // Enforce minimum of 1 and maximum of 1000
    const clampedQuantity = Math.max(1, Math.min(1000, newQuantity));
    onQuantityChange(clampedQuantity);
  };
  
  // Handle custom size changes
  const handleCustomSizeToggle = (checked: boolean) => {
    setUseCustomSize(checked);
    if (checked) {
      // When switching to custom size, set a custom size value
      const customSizeStr = `${customWidth}" × ${customHeight}"`;
      onOptionSelect("size", customSizeStr);
    } else {
      // When switching back to predefined sizes, select the first option if available
      if (optionsByType.size && optionsByType.size.length > 0) {
        onOptionSelect("size", optionsByType.size[0].optionValue);
      }
    }
  };
  
  // Update the custom size when dimensions change
  const updateCustomSize = () => {
    const customSizeStr = `${customWidth}" × ${customHeight}"`;
    onOptionSelect("size", customSizeStr);
  };
  
  return (
    <div className="space-y-6">
      {/* Size Options */}
      {optionsByType.size && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <Label className="font-medium">Size</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="custom-size-toggle" className="text-sm text-gray-500 cursor-pointer">
                Custom Size
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch 
                      id="custom-size-toggle" 
                      checked={useCustomSize}
                      onCheckedChange={handleCustomSizeToggle}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter your own custom dimensions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {!useCustomSize ? (
            // Standard predefined sizes
            <div className="grid grid-cols-2 gap-2">
              {optionsByType.size.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={`justify-between h-auto py-3 px-4 font-normal ${
                    selectedOptions.size === option.optionValue ? selectedClass : defaultClass
                  }`}
                  onClick={() => onOptionSelect("size", option.optionValue)}
                  disabled={useCustomSize}
                >
                  <span>{option.optionValue}</span>
                  <span className="text-xs text-gray-500">
                    {formatPriceModifier(option.priceModifier)}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            // Custom size inputs
            <div className="border border-primary rounded-md p-4 bg-primary/5 animate-bubble-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-width" className="text-sm mb-1 block">Width (inches)</Label>
                  <div className="relative">
                    <Input
                      id="custom-width"
                      type="number"
                      value={customWidth}
                      min="0.5"
                      max="24"
                      step="0.1"
                      className="pr-8"
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomWidth(value);
                        setTimeout(updateCustomSize, 0);
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">in</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="custom-height" className="text-sm mb-1 block">Height (inches)</Label>
                  <div className="relative">
                    <Input
                      id="custom-height"
                      type="number"
                      value={customHeight}
                      min="0.5"
                      max="24"
                      step="0.1"
                      className="pr-8"
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomHeight(value);
                        setTimeout(updateCustomSize, 0);
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">in</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                <span className="inline-block bg-primary/20 rounded-full w-4 h-4 text-center mr-1">i</span>
                Custom sizes are priced at $0.15 per square inch with a $2.99 minimum
              </p>
              
              <div className="mt-3 text-center">
                <span className="text-sm font-medium">Your sticker will be: </span>
                <span className="text-sm text-primary font-bold">{customWidth}" × {customHeight}"</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Material Options */}
      {optionsByType.material && (
        <div>
          <Label className="block mb-2 font-medium">Material</Label>
          <RadioGroup 
            value={selectedOptions.material || ""} 
            onValueChange={(value) => onOptionSelect("material", value)}
          >
            <div className="grid grid-cols-2 gap-3">
              {optionsByType.material.map((option) => (
                <div key={option.id} className="flex items-start space-x-2">
                  <RadioGroupItem value={option.optionValue} id={`material-${option.id}`} />
                  <Label 
                    htmlFor={`material-${option.id}`} 
                    className="cursor-pointer flex flex-col"
                  >
                    <span>{option.optionValue}</span>
                    <span className="text-xs text-gray-500">
                      {formatPriceModifier(option.priceModifier)}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}
      
      {/* Finish Options */}
      {optionsByType.finish && (
        <div>
          <Label className="block mb-2 font-medium">Finish</Label>
          <div className="grid grid-cols-2 gap-2">
            {optionsByType.finish.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                className={`justify-between h-auto py-3 px-4 font-normal ${
                  selectedOptions.finish === option.optionValue ? selectedClass : defaultClass
                }`}
                onClick={() => onOptionSelect("finish", option.optionValue)}
              >
                <span>{option.optionValue}</span>
                <span className="text-xs text-gray-500">
                  {formatPriceModifier(option.priceModifier)}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Shape Options */}
      {optionsByType.shape && (
        <div>
          <Label className="block mb-2 font-medium">Shape</Label>
          <Select 
            value={selectedOptions.shape || ""} 
            onValueChange={(value) => onOptionSelect("shape", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              {optionsByType.shape.map((option) => (
                <SelectItem key={option.id} value={option.optionValue}>
                  {option.optionValue} {formatPriceModifier(option.priceModifier)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Quantity Selector */}
      <div>
        <Label className="block mb-2 font-medium">Quantity</Label>
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
          >
            <span className="material-icons">remove</span>
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            min="1"
            max="1000"
            className="w-20 mx-2 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= 1000}
          >
            <span className="material-icons">add</span>
          </Button>
          
          <div className="ml-4 text-sm text-gray-500">
            {quantity >= 10 && (
              <span className="text-green-600 font-medium">
                Bulk discount applied!
              </span>
            )}
          </div>
        </div>
        
        {/* Quantity discount information */}
        <div className="mt-2 text-xs text-gray-500">
          <p>Buy 10+ for bulk discount</p>
        </div>
      </div>
      
      {/* Upload Custom Design (placeholder for future implementation) */}
      <div>
        <Label className="block mb-2 font-medium">Upload Your Design (optional)</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors">
          <span className="material-icons text-gray-400 text-3xl mb-2">upload_file</span>
          <p className="text-sm text-gray-500">
            Drag and drop your image here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supported formats: PNG, JPG, SVG (max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomizerForm;
