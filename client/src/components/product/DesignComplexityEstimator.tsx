import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface DesignComplexityEstimatorProps {
  defaultComplexity?: number;
  onChange: (complexity: number) => void;
}

export function DesignComplexityEstimator({ 
  defaultComplexity = 1, 
  onChange 
}: DesignComplexityEstimatorProps) {
  const [complexity, setComplexity] = useState(defaultComplexity);
  const [colorCount, setColorCount] = useState(1);
  const [detailLevel, setDetailLevel] = useState(1);
  
  // Descriptions for different complexity levels
  const complexityDescriptions = [
    "Simple: Basic shapes with 1-2 colors",
    "Basic: Simple logo or text with few colors",
    "Standard: Multi-element design with several colors",
    "Detailed: Complex artwork with many colors and details",
    "Premium: Intricate design with gradients and fine details"
  ];
  
  // Calculate the complexity score based on sliders
  useEffect(() => {
    // Complexity score is average of color count and detail level (0-4 scale)
    const newComplexity = ((colorCount - 1) / 9 * 4 + (detailLevel - 1) / 9 * 4) / 2;
    setComplexity(newComplexity);
    onChange(newComplexity);
  }, [colorCount, detailLevel, onChange]);
  
  // Get the appropriate description based on complexity
  const getDescription = () => {
    const index = Math.min(Math.floor(complexity), complexityDescriptions.length - 1);
    return complexityDescriptions[index];
  };
  
  // Get appropriate badge color based on complexity
  const getBadgeVariant = () => {
    if (complexity < 1) return "outline";
    if (complexity < 2) return "secondary";
    if (complexity < 3) return "default";
    if (complexity < 4) return "destructive";
    return "destructive";
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="font-medium">Design Complexity</Label>
        <Badge variant={getBadgeVariant()}>
          {getDescription()}
        </Badge>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-gray-500">Color Count</Label>
            <span className="text-sm">{colorCount} color{colorCount > 1 ? 's' : ''}</span>
          </div>
          <Slider
            value={[colorCount]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setColorCount(value[0])}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Few</span>
            <span>Many</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-gray-500">Detail Level</Label>
            <span className="text-sm">{detailLevel}/10</span>
          </div>
          <Slider
            value={[detailLevel]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setDetailLevel(value[0])}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Simple</span>
            <span>Complex</span>
          </div>
        </div>
      </div>
      
      {/* Visual complexity indicator */}
      <div className="pt-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" 
            style={{ width: `${Math.min(100, complexity * 25)}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

export default DesignComplexityEstimator;