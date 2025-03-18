import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { useHotkeys } from "react-hotkeys-hook";
import {
  RotateCw,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CanvasElement {
  id: string;
  type: "image" | "shape" | "text" | "qrcode";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  // Type-specific properties
  src?: string; // For images
  shape?: string; // For shapes: 'rectangle', 'circle', 'heart', etc.
  text?: string; // For text elements
  fontSize?: number; // For text elements
  fontFamily?: string; // For text elements
  borderWidth?: number; // For shapes and images
  borderColor?: string; // For shapes and images
  fillColor?: string; // For shapes
  url?: string; // For QR codes
}

interface CustomizerCanvasProps {
  width: number;
  height: number;
  backgroundColor: string;
}

const CustomizerCanvas: React.FC<CustomizerCanvasProps> = ({
  width,
  height,
  backgroundColor,
}) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef(elements);
  const { toast } = useToast();

  // Keep elementsRef updated with the latest elements state
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Get the selected element
  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Add a new element to the canvas
  const addElement = (element: Omit<CanvasElement, "id" | "zIndex">) => {
    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      zIndex: Math.max(0, ...elements.map((el) => el.zIndex)) + 1, // Put on top
    };

    setElements((prevElements) => [...prevElements, newElement]);
    setSelectedId(newElement.id);

    toast({
      title: "Element Added",
      description: `New ${element.type} added to canvas`,
    });
  };

  // Add an image element
  const addImage = (src: string) => {
    addElement({
      type: "image",
      src,
      x: width / 2 - 100,
      y: height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      borderWidth: 0,
      borderColor: "#000000",
    });
  };

  // Add a shape element
  const addShape = (shape: string) => {
    let width = 100;
    let height = 100;

    if (shape === "rectangle") {
      width = 150;
      height = 100;
    }

    addElement({
      type: "shape",
      shape,
      x: width / 2 - 50,
      y: height / 2 - 50,
      width,
      height,
      rotation: 0,
      opacity: 1,
      locked: false,
      borderWidth: 2,
      borderColor: "#000000",
      fillColor: "#FFFFFF",
    });
  };

  // Add a text element
  const addText = () => {
    addElement({
      type: "text",
      text: "Double click to edit",
      x: width / 2 - 100,
      y: height / 2 - 20,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      fontSize: 16,
      fontFamily: "Arial",
    });
  };

  // Add a QR code element
  const addQRCode = (url: string) => {
    addElement({
      type: "qrcode",
      url,
      x: width / 2 - 75,
      y: height / 2 - 75,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      locked: false,
      borderWidth: 0,
      borderColor: "#000000",
    });
  };

  // Handle element selection
  const handleElementSelect = (id: string) => {
    setSelectedId(id);

    // Bring to front
    setElements((prevElements) => {
      const selected = prevElements.find((el) => el.id === id);
      if (!selected) return prevElements;

      // If already at the top level, don't need to adjust z-index
      const maxZIndex = Math.max(...prevElements.map((el) => el.zIndex));
      if (selected.zIndex === maxZIndex) return prevElements;

      // Otherwise, move to top
      return prevElements.map((el) =>
        el.id === id ? { ...el, zIndex: maxZIndex + 1 } : el,
      );
    });
  };

  // Update element position
  const updateElementPosition = (id: string, x: number, y: number) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, x, y } : el)),
    );
  };

  // Update element size
  const updateElementSize = (id: string, width: number, height: number) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, width, height } : el)),
    );
  };

  // Update element rotation
  const updateElementRotation = (id: string, rotation: number) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, rotation } : el)),
    );
  };

  // Remove an element
  const removeElement = (id: string) => {
    setElements((prevElements) => prevElements.filter((el) => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }

    toast({
      title: "Element Removed",
      description: "Element has been deleted from the canvas",
    });
  };

  // Duplicate an element
  const duplicateElement = (id: string) => {
    const elementToDuplicate = elements.find((el) => el.id === id);
    if (!elementToDuplicate) return;

    const newElement: CanvasElement = {
      ...JSON.parse(JSON.stringify(elementToDuplicate)), // Deep clone
      id: `element-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: elementToDuplicate.x + 20, // Offset a bit to make it visible
      y: elementToDuplicate.y + 20,
      zIndex: Math.max(...elements.map((el) => el.zIndex)) + 1, // Put on top
    };

    setElements((prevElements) => [...prevElements, newElement]);
    setSelectedId(newElement.id);

    toast({
      title: "Element Duplicated",
      description: "A copy has been created",
    });
  };

  // Toggle element lock
  const toggleElementLock = (id: string) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === id ? { ...el, locked: !el.locked } : el,
      ),
    );
  };

  // Move element up in layer stack
  const moveElementUp = (id: string) => {
    setElements((prevElements) => {
      const element = prevElements.find((el) => el.id === id);
      if (!element) return prevElements;

      const higherElements = prevElements.filter(
        (el) => el.zIndex > element.zIndex,
      );
      if (higherElements.length === 0) return prevElements; // Already at top

      const nextHighestZIndex = Math.min(
        ...higherElements.map((el) => el.zIndex),
      );
      const elementToSwapWith = prevElements.find(
        (el) => el.zIndex === nextHighestZIndex,
      );

      return prevElements.map((el) => {
        if (el.id === id) return { ...el, zIndex: nextHighestZIndex };
        if (el.id === elementToSwapWith?.id)
          return { ...el, zIndex: element.zIndex };
        return el;
      });
    });
  };

  // Move element down in layer stack
  const moveElementDown = (id: string) => {
    setElements((prevElements) => {
      const element = prevElements.find((el) => el.id === id);
      if (!element) return prevElements;

      const lowerElements = prevElements.filter(
        (el) => el.zIndex < element.zIndex,
      );
      if (lowerElements.length === 0) return prevElements; // Already at bottom

      const nextLowestZIndex = Math.max(
        ...lowerElements.map((el) => el.zIndex),
      );
      const elementToSwapWith = prevElements.find(
        (el) => el.zIndex === nextLowestZIndex,
      );

      return prevElements.map((el) => {
        if (el.id === id) return { ...el, zIndex: nextLowestZIndex };
        if (el.id === elementToSwapWith?.id)
          return { ...el, zIndex: element.zIndex };
        return el;
      });
    });
  };

  // Update text content
  const updateTextContent = (id: string, text: string) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, text } : el)),
    );
  };

  // Set fill color
  const setFillColor = (id: string, color: string) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === id ? { ...el, fillColor: color } : el,
      ),
    );
  };

  // Set border color
  const setBorderColor = (id: string, color: string) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === id ? { ...el, borderColor: color } : el,
      ),
    );
  };

  // Set border width
  const setBorderWidth = (id: string, width: number) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === id ? { ...el, borderWidth: width } : el,
      ),
    );
  };

  // Set opacity
  const setOpacity = (id: string, opacity: number) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === id ? { ...el, opacity: opacity / 100 } : el,
      ),
    );
  };

  // Set font size
  const setFontSize = (id: string, size: number) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === id ? { ...el, fontSize: size } : el)),
    );
  };

  // Keyboard shortcuts
  useHotkeys(
    "delete",
    () => {
      if (selectedId) removeElement(selectedId);
    },
    [selectedId, elements],
  );

  useHotkeys(
    "ctrl+d",
    (e) => {
      e.preventDefault();
      if (selectedId) duplicateElement(selectedId);
    },
    [selectedId, elements],
  );

  useHotkeys(
    "ctrl+c",
    (e) => {
      e.preventDefault();
      if (selectedId) duplicateElement(selectedId);
    },
    [selectedId, elements],
  );

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (canvasRef.current && !canvasRef.current.contains(e.target as Node)) {
        setSelectedId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Render canvas elements
  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedId === element.id;
    const elementStyle: React.CSSProperties = {
      opacity: element.opacity,
      zIndex: element.zIndex,
    };

    // Element-specific styles
    let elementContent: React.ReactNode;

    switch (element.type) {
      case "image":
        elementContent = (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              border: element.borderWidth
                ? `${element.borderWidth}px solid ${element.borderColor}`
                : "none",
            }}
          >
            <img
              src={element.src}
              alt="Canvas element"
              src={element.src}
              alt="Canvas element"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        );
        break;

      case "shape":
        const shapePath = getShapePath(element.shape || "rectangle");
        elementContent = (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              border: element.borderWidth
                ? `${element.borderWidth}px solid ${element.borderColor}`
                : "none",
              backgroundColor: element.fillColor || "transparent",
              clipPath: shapePath,
              borderRadius: element.shape === "circle" ? "50%" : "0",
            }}
          />
        );
        break;

      case "text":
        elementContent = (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              fontSize: `${element.fontSize}px`,
              fontFamily: element.fontFamily || "Arial",
              lineHeight: "1.2",
              color: element.fillColor || "#000000",
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
            onDoubleClick={() => {
              // Implement text editing functionality
              const newText = prompt("Edit text:", element.text);
              if (newText !== null) {
                updateTextContent(element.id, newText);
              }
            }}
          >
            {element.text || "Text"}
          </div>
        );
        break;

      case "qrcode":
        elementContent = (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="w-full h-full"
              style={{
                border: element.borderWidth
                  ? `${element.borderWidth}px solid ${element.borderColor}`
                  : "none",
              }}
            >
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#000"
              >
                QR Code
              </text>
              <text
                x="50"
                y="65"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#666"
              >
                {element.url || "https://example.com"}
              </text>
            </svg>
          </div>
        );
        break;
    }

    return (
      <Rnd
        key={element.id}
        default={{
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        }}
        position={{ x: element.x, y: element.y }}
        size={{ width: element.width, height: element.height }}
        style={{
          ...elementStyle,
          transform: `rotate(${element.rotation}deg)`,
        }}
        onDragStart={() => {
          setIsDragging(true);
          if (!isSelected) handleElementSelect(element.id);
        }}
        onDragStop={(e, d) => {
          setIsDragging(false);
          updateElementPosition(element.id, d.x, d.y);
        }}
        onResizeStart={() => {
          if (!isSelected) handleElementSelect(element.id);
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          updateElementSize(
            element.id,
            parseInt(ref.style.width),
            parseInt(ref.style.height),
          );
          updateElementPosition(element.id, position.x, position.y);
        }}
        disableDragging={element.locked}
        enableResizing={!element.locked}
        lockAspectRatio={element.type === "image" || element.shape === "circle"}
        onClick={() => handleElementSelect(element.id)}
      >
        {elementContent}

        {isSelected && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-md rounded-md flex space-x-1 p-1 z-50">
            <button
              className="p-1 hover:bg-gray-100 rounded-sm"
              onClick={() => duplicateElement(element.id)}
              title="Duplicate"
            >
              <Copy size={16} />
            </button>

            <button
              className="p-1 hover:bg-gray-100 rounded-sm"
              onClick={() => {
                const newRotation = (element.rotation + 15) % 360;
                updateElementRotation(element.id, newRotation);
              }}
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>

            <button
              className="p-1 hover:bg-gray-100 rounded-sm"
              onClick={() => moveElementUp(element.id)}
              title="Bring Forward"
            >
              <ChevronUp size={16} />
            </button>

            <button
              className="p-1 hover:bg-gray-100 rounded-sm"
              onClick={() => moveElementDown(element.id)}
              title="Send Backward"
            >
              <ChevronDown size={16} />
            </button>

            <button
              className="p-1 hover:bg-gray-100 rounded-sm"
              onClick={() => toggleElementLock(element.id)}
              title={element.locked ? "Unlock" : "Lock"}
            >
              {element.locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>

            <button
              className="p-1 hover:bg-gray-100 rounded-sm text-red-500"
              onClick={() => removeElement(element.id)}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </Rnd>
    );
  };

  // Helper function to get shape clip paths
  const getShapePath = (shape: string): string => {
    switch (shape) {
      case "circle":
        return "circle(50%)";
      case "heart":
        return 'path("M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z")';
      case "star":
        return "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
      case "square":
        return "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
      default: // rectangle
        return "none";
    }
  };

  return (
    <div className="relative" style={{ width, height }}>
      <div
        ref={canvasRef}
        className="absolute inset-0 overflow-hidden"
        style={{ backgroundColor }}
      >
        {elements.sort((a, b) => a.zIndex - b.zIndex).map(renderElement)}
      </div>
    </div>
  );
};

export default CustomizerCanvas;
