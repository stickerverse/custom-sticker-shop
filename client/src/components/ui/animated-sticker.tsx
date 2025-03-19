import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedStickerProps {
  imageUrl: string;
  alt: string;
  className?: string;
  colors?: string[];
  effectIntensity?: 'subtle' | 'medium' | 'strong';
  morphSpeed?: 'slow' | 'medium' | 'fast';
  onHover?: () => void;
  onClick?: () => void;
}

const defaultColors = [
  'rgba(0, 112, 243, 0.7)',   // Primary blue
  'rgba(138, 75, 255, 0.7)',  // Purple
  'rgba(20, 184, 166, 0.7)',  // Teal
  'rgba(14, 165, 233, 0.7)',  // Light blue
];

export function AnimatedSticker({
  imageUrl,
  alt,
  className = "",
  colors = defaultColors,
  effectIntensity = 'medium',
  morphSpeed = 'medium',
  onHover,
  onClick
}: AnimatedStickerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [nextColorIndex, setNextColorIndex] = useState(1);
  const [colorTransition, setColorTransition] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageLoaded = useRef(false);

  // Get intensity values based on the selected effect intensity
  const getIntensityValues = () => {
    switch (effectIntensity) {
      case 'subtle': return { glow: 0.2, pulse: 0.05, scale: 1.03 };
      case 'strong': return { glow: 0.6, pulse: 0.15, scale: 1.08 };
      default: return { glow: 0.4, pulse: 0.1, scale: 1.05 };
    }
  };

  // Get the speed value for color morphing
  const getMorphSpeedValue = () => {
    switch (morphSpeed) {
      case 'slow': return 0.003;
      case 'fast': return 0.01;
      default: return 0.005;
    }
  };

  const intensity = getIntensityValues();
  const morphSpeedValue = getMorphSpeedValue();

  // Initialize image
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      imageLoaded.current = true;
    };
    
    return () => {
      if (imageRef.current) {
        imageRef.current = null;
        imageLoaded.current = false;
      }
    };
  }, [imageUrl]);

  // Initialize canvas and start animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation function
    const animate = () => {
      if (!canvas || !imageLoaded.current || !imageRef.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the image centered on the canvas
      const imgWidth = imageRef.current.width;
      const imgHeight = imageRef.current.height;
      const scale = Math.min(canvas.width / imgWidth, canvas.height / imgHeight);
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // Draw the base image
      ctx.drawImage(imageRef.current, x, y, scaledWidth, scaledHeight);

      // Apply color morphing effect if hovered
      if (isHovered) {
        // Linear interpolation between current and next color
        const currentColor = colors[currentColorIndex];
        const nextColor = colors[nextColorIndex];
        
        // Create a composite effect using globalCompositeOperation
        ctx.globalCompositeOperation = 'color-dodge';
        
        // Create a gradient for the glow effect
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width / 1.5
        );
        
        // Apply the current interpolated color
        gradient.addColorStop(0, currentColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add pulsing effect
        const pulseStrength = Math.sin(Date.now() * 0.003) * intensity.pulse + intensity.glow;
        
        ctx.globalCompositeOperation = 'overlay';
        const pulseGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        // Add the next color with the pulse effect
        pulseGradient.addColorStop(0, nextColor);
        pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = pulseGradient;
        ctx.globalAlpha = pulseStrength;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        
        // Update color transition for morphing effect
        setColorTransition(prev => {
          const newValue = prev + morphSpeedValue;
          if (newValue >= 1) {
            // Move to next color
            setCurrentColorIndex(nextColorIndex);
            setNextColorIndex((nextColorIndex + 1) % colors.length);
            return 0;
          }
          return newValue;
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isHovered, effectIntensity, colors, currentColorIndex, nextColorIndex, colorTransition, morphSpeedValue]);

  // Handle mouse events
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) onHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-md transition-transform duration-500",
        isHovered && `scale-${Math.round(intensity.scale * 100)}`,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* This is a static img as a fallback */}
      <img 
        src={imageUrl} 
        alt={alt} 
        className="w-full h-auto object-cover invisible absolute" 
      />
      
      {/* Canvas for the animated effects */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* Optional overlay that appears on hover */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}

export default AnimatedSticker;