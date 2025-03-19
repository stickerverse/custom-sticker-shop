import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ColorMorphProps {
  children?: React.ReactNode;
  className?: string;
  colors?: string[];
  duration?: number;
  isActive?: boolean;
  borderWidth?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  style?: React.CSSProperties;
}

// Utility function to interpolate between colors
function interpolateColor(color1: string, color2: string, factor: number) {
  // Parse the colors
  const parseColor = (color: string) => {
    if (color.startsWith('rgba')) {
      // Handle rgba format
      const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
      if (match) {
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          a: parseFloat(match[4])
        };
      }
    } else if (color.startsWith('rgb')) {
      // Handle rgb format
      const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match) {
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          a: 1
        };
      }
    } else if (color.startsWith('#')) {
      // Handle hex format
      let hex = color.substring(1);
      
      // Convert shorthand hex to full form
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
        a: 1
      };
    }
    
    // Default to black if parsing fails
    return { r: 0, g: 0, b: 0, a: 1 };
  };
  
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  
  // Interpolate each channel
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  const a = c1.a + factor * (c2.a - c1.a);
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function ColorMorph({
  children,
  className = "",
  colors = [
    'rgba(0, 112, 243, 0.7)',   // Primary blue
    'rgba(138, 75, 255, 0.7)',  // Purple
    'rgba(20, 184, 166, 0.7)',  // Teal
    'rgba(14, 165, 233, 0.7)',  // Light blue
  ],
  duration = 6000,
  isActive = true,
  borderWidth = 1,
  blendMode = 'normal',
  style = {}
}: ColorMorphProps) {
  const [currentColor, setCurrentColor] = useState(colors[0]);
  const [colorIndex, setColorIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;
    
    const updateColor = (timestamp: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
      
      const elapsed = timestamp - lastUpdateRef.current;
      const step = elapsed / duration;
      
      setProgress(prev => {
        const newProgress = prev + step;
        
        if (newProgress >= 1) {
          // Move to next color pair
          setColorIndex(nextIndex);
          setNextIndex((nextIndex + 1) % colors.length);
          lastUpdateRef.current = timestamp;
          return 0;
        }
        
        return newProgress;
      });
      
      rafRef.current = requestAnimationFrame(updateColor);
    };
    
    rafRef.current = requestAnimationFrame(updateColor);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [colors, duration, isActive, colorIndex, nextIndex]);

  // Calculate current interpolated color
  useEffect(() => {
    const color = interpolateColor(colors[colorIndex], colors[nextIndex], progress);
    setCurrentColor(color);
  }, [colors, colorIndex, nextIndex, progress]);

  const boxShadowStyle = `0 0 10px 2px ${currentColor}, 0 0 20px 6px ${currentColor.replace(/[\d.]+\)$/, '0.3)')}`;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        ...style,
        transition: "all 0.3s ease",
        boxShadow: isActive ? boxShadowStyle : 'none',
        borderColor: currentColor,
        borderWidth: isActive ? borderWidth : 0,
        borderStyle: 'solid',
      }}
    >
      {children}
      
      {isActive && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            mixBlendMode: blendMode,
            background: `radial-gradient(circle at center, ${currentColor.replace(/[\d.]+\)$/, '0.3)')}, transparent 70%)`,
            transition: 'opacity 0.5s ease-in-out',
            opacity: 0.7 + Math.sin(progress * Math.PI) * 0.3,
          }}
        />
      )}
    </div>
  );
}

export default ColorMorph;