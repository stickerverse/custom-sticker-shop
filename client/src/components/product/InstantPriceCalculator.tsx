import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import DesignComplexityEstimator from "./DesignComplexityEstimator";

interface InstantPriceCalculatorProps {
  basePrice: number;
  materialMultiplier: number;
  quantity: number;
  finishPriceModifier?: number;
  onComplexityChange: (complexityMultiplier: number) => void;
}

export function InstantPriceCalculator({
  basePrice,
  materialMultiplier,
  quantity,
  finishPriceModifier = 0,
  onComplexityChange
}: InstantPriceCalculatorProps) {
  const [designComplexity, setDesignComplexity] = useState(1);
  const [complexityMultiplier, setComplexityMultiplier] = useState(1);
  
  // Update complexity multiplier when design complexity changes
  useEffect(() => {
    // Map the 0-4 complexity scale to a 1-2 multiplier
    // Simple designs (0) cost base price (1x)
    // Complex designs (4) cost up to double (2x)
    const newMultiplier = 1 + (designComplexity * 0.25);
    setComplexityMultiplier(newMultiplier);
    onComplexityChange(newMultiplier);
  }, [designComplexity, onComplexityChange]);
  
  // Format price in cents to dollars
  const formatPrice = (cents: number) => {
    return `US$${(cents / 100).toFixed(2)}`;
  };
  
  // Calculate price breakdown
  const priceBeforeComplexity = basePrice * materialMultiplier;
  const priceWithComplexity = Math.round(priceBeforeComplexity * complexityMultiplier);
  const priceWithFinish = priceWithComplexity + finishPriceModifier;
  
  // Apply quantity discounts
  let finalUnitPrice = priceWithFinish;
  let discountPercentage = 0;
  
  if (quantity >= 50) {
    discountPercentage = 25;
    finalUnitPrice = Math.round(finalUnitPrice * 0.75); // 25% off
  } else if (quantity >= 25) {
    discountPercentage = 20;
    finalUnitPrice = Math.round(finalUnitPrice * 0.80); // 20% off
  } else if (quantity >= 10) {
    discountPercentage = 10;
    finalUnitPrice = Math.round(finalUnitPrice * 0.90); // 10% off
  }
  
  // Only multiply by quantity for the total, not for the unit price
  const total = finalUnitPrice * quantity;
  
  return (
    <Card className="p-4 border border-blue-100 bg-blue-50/50">
      <h3 className="font-medium text-blue-900 mb-4">Instant Price Calculator</h3>
      
      <DesignComplexityEstimator 
        onChange={setDesignComplexity}
      />
      
      <div className="mt-6 space-y-2 text-sm">
        <div className="font-medium text-blue-900">Price Breakdown:</div>
        
        <div className="flex justify-between text-gray-600">
          <span>Base Price</span>
          <span>{formatPrice(basePrice)}</span>
        </div>
        
        <div className="flex justify-between text-gray-600">
          <span>Material Adjustment</span>
          <span>×{materialMultiplier.toFixed(1)}</span>
        </div>
        
        <div className="flex justify-between text-gray-600">
          <span>Design Complexity</span>
          <span>×{complexityMultiplier.toFixed(2)}</span>
        </div>
        
        {finishPriceModifier > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Finish Upgrade</span>
            <span>+{formatPrice(finishPriceModifier)}</span>
          </div>
        )}
        
        {discountPercentage > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Quantity Discount</span>
            <span>-{discountPercentage}%</span>
          </div>
        )}
        
        <div className="pt-2 mt-1 border-t border-blue-100 flex justify-between font-medium">
          <span>Unit Price</span>
          <span>{formatPrice(finalUnitPrice)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Quantity</span>
          <span>×{quantity}</span>
        </div>
        
        <div className="pt-2 mt-1 border-t border-blue-100 flex justify-between font-bold text-pink-600">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </Card>
  );
}

export default InstantPriceCalculator;