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
      {/* Material Options */}
      {optionsByType.material && (
        <div>
          <Label className="block mb-2 font-medium">Material</Label>
          <div className="grid grid-cols-3 gap-2">
            <div 
              className={`p-3 border ${selectedOptions.material === "Vinyl" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer h-28 flex flex-col items-center justify-center`}
              onClick={() => onOptionSelect("material", "Vinyl")}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full mb-2 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Vinyl</div>
                <div className="text-xs text-gray-500">Base price</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.material === "Holographic" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer h-28 flex flex-col items-center justify-center`}
              onClick={() => onOptionSelect("material", "Holographic")}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-300 via-pink-200 to-blue-300 rounded-full mb-2 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full opacity-50"></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Holographic</div>
                <div className="text-xs text-gray-500">+50% cost</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.material === "Transparent" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer h-28 flex flex-col items-center justify-center`}
              onClick={() => onOptionSelect("material", "Transparent")}
            >
              <div className="w-12 h-12 border border-gray-200 rounded-full mb-2 flex items-center justify-center">
                <div className="w-8 h-8 border border-dashed border-gray-300 rounded-full"></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Transparent</div>
                <div className="text-xs text-gray-500">+20% cost</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.material === "Glitter" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer h-28 flex flex-col items-center justify-center`}
              onClick={() => onOptionSelect("material", "Glitter")}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-pink-200 to-blue-200 rounded-full mb-2 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-20" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '4px 4px'}}></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Glitter</div>
                <div className="text-xs text-gray-500">+40% cost</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.material === "Mirror" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer h-28 flex flex-col items-center justify-center`}
              onClick={() => onOptionSelect("material", "Mirror")}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full mb-2 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-200 rounded-full"></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Mirror</div>
                <div className="text-xs text-gray-500">+60% cost</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.material === "Pixie Dust" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer h-28 flex flex-col items-center justify-center`}
              onClick={() => onOptionSelect("material", "Pixie Dust")}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-200 via-yellow-200 to-pink-200 rounded-full mb-2 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-30" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '3px 3px'}}></div>
              </div>
              <div className="text-center">
                <div className="font-medium">Pixie Dust</div>
                <div className="text-xs text-gray-500">+80% cost</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Finish Options */}
      {optionsByType.finish && (
        <div>
          <Label className="block mb-2 font-medium">Finish</Label>
          <div className="grid grid-cols-2 gap-2">
            <div 
              className={`p-3 border ${selectedOptions.finish === "Glossy" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer`}
              onClick={() => onOptionSelect("finish", "Glossy")}
            >
              <div className="text-center">
                <div className="font-medium">Glossy</div>
                <div className="text-xs text-gray-500">+$1.00</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.finish === "Matte" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer`}
              onClick={() => onOptionSelect("finish", "Matte")}
            >
              <div className="text-center">
                <div className="font-medium">Matte</div>
                <div className="text-xs text-gray-500">+$2.00</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.finish === "Holographic" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer`}
              onClick={() => onOptionSelect("finish", "Holographic")}
            >
              <div className="text-center">
                <div className="font-medium">Holographic</div>
                <div className="text-xs text-gray-500">+$3.00</div>
              </div>
            </div>
            <div 
              className={`p-3 border ${selectedOptions.finish === "Transparent" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} rounded-md cursor-pointer`}
              onClick={() => onOptionSelect("finish", "Transparent")}
            >
              <div className="text-center">
                <div className="font-medium">Transparent</div>
                <div className="text-xs text-gray-500">+$2.00</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quantity Selector */}
      <div>
        <Label className="block mb-2 font-medium">Quantity</Label>
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 px-3 rounded-l-full border-r-0"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
          >
            <span>−</span>
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            min="1"
            max="1000"
            className="w-16 border-x-0 text-center rounded-none focus:ring-0"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 px-3 rounded-r-full border-l-0"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= 1000}
          >
            <span>+</span>
          </Button>
        </div>
        
        {/* Quantity discount information */}
        <div className="mt-2 text-xs text-gray-500">
          <p>Buy 10+ for bulk discount (10% off)</p>
          <p>Buy 25+ for larger discount (20% off)</p>
          <p>Buy 50+ for biggest discount (25% off)</p>
        </div>
      </div>
    </div>
  );
};

export default CustomizerForm;
