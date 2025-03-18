import React, { useState } from "react";
import {
  ImageIcon,
  TextIcon,
  Square,
  Circle,
  Heart,
  Star,
  LayoutGrid,
  QrCode,
  Upload,
  Palette,
  Layers,
  Trash2,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { RemoveBackgroundTool } from "./RemoveBackgroundTool";

interface CustomizerToolbarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  onAddShape: (shape: string) => void;
  onAddText: () => void;
  onUploadImage: (file: File) => void;
  onRemoveBackground: (imageUrl: string) => void;
  onChangeOpacity: (opacity: number) => void;
  onChangeBorderWidth: (width: number) => void;
  onChangeBorderColor: (color: string) => void;
  onChangeFillColor: (color: string) => void;
  selectedElement: any | null;
  opacity: number;
  borderWidth: number;
  borderColor: string;
  fillColor: string;
}

const CustomizerToolbar: React.FC<CustomizerToolbarProps> = ({
  activeTool,
  setActiveTool,
  onAddShape,
  onAddText,
  onUploadImage,
  onRemoveBackground,
  onChangeOpacity,
  onChangeBorderWidth,
  onChangeBorderColor,
  onChangeFillColor,
  selectedElement,
  opacity,
  borderWidth,
  borderColor,
  fillColor,
}) => {
  const [activeTab, setActiveTab] = useState<string>("shapes");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Left Sidebar - Tool Selection */}
      <div className="flex">
        <div className="w-16 border-r border-gray-200 py-3">
          <div className="flex flex-col items-center gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex flex-col items-center w-12 h-14 justify-center rounded-md ${
                      activeTool === "upload"
                        ? "bg-blue-50 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setActiveTool("upload");
                      setActiveTab("upload");
                    }}
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs mt-1">Upload</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload Images</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex flex-col items-center w-12 h-14 justify-center rounded-md ${
                      activeTool === "shapes"
                        ? "bg-blue-50 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setActiveTool("shapes");
                      setActiveTab("shapes");
                    }}
                  >
                    <Square className="h-5 w-5" />
                    <span className="text-xs mt-1">Shapes</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Shapes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex flex-col items-center w-12 h-14 justify-center rounded-md ${
                      activeTool === "text"
                        ? "bg-blue-50 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setActiveTool("text");
                      setActiveTab("text");
                    }}
                  >
                    <TextIcon className="h-5 w-5" />
                    <span className="text-xs mt-1">Text</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex flex-col items-center w-12 h-14 justify-center rounded-md ${
                      activeTool === "effects"
                        ? "bg-blue-50 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setActiveTool("effects");
                      setActiveTab("effects");
                    }}
                  >
                    <Wand2 className="h-5 w-5" />
                    <span className="text-xs mt-1">Effects</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Apply Effects</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex flex-col items-center w-12 h-14 justify-center rounded-md ${
                      activeTool === "qrcode"
                        ? "bg-blue-50 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setActiveTool("qrcode");
                      setActiveTab("qrcode");
                    }}
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs mt-1">QR Code</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add QR Code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Tool Options Area */}
        <div className="flex-1 p-4 min-w-64">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="shapes">Shapes</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleUploadClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="py-3">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, SVG up to 5MB
                  </p>
                </div>
              </div>

              <RemoveBackgroundTool onImageProcessed={onRemoveBackground} />
            </TabsContent>

            <TabsContent value="shapes" className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  className="p-3 h-auto aspect-square flex flex-col items-center"
                  onClick={() => onAddShape("rectangle")}
                >
                  <LayoutGrid className="h-6 w-6 mb-1" />
                  <span className="text-xs">Rectangle</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-3 h-auto aspect-square flex flex-col items-center"
                  onClick={() => onAddShape("square")}
                >
                  <Square className="h-6 w-6 mb-1" />
                  <span className="text-xs">Square</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-3 h-auto aspect-square flex flex-col items-center"
                  onClick={() => onAddShape("circle")}
                >
                  <Circle className="h-6 w-6 mb-1" />
                  <span className="text-xs">Circle</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-3 h-auto aspect-square flex flex-col items-center"
                  onClick={() => onAddShape("heart")}
                >
                  <Heart className="h-6 w-6 mb-1" />
                  <span className="text-xs">Heart</span>
                </Button>
                <Button
                  variant="outline"
                  className="p-3 h-auto aspect-square flex flex-col items-center"
                  onClick={() => onAddShape("star")}
                >
                  <Star className="h-6 w-6 mb-1" />
                  <span className="text-xs">Star</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onAddText}
              >
                <TextIcon className="h-4 w-4 mr-2" />
                Add Text
              </Button>

              {selectedElement && selectedElement.type === "text" && (
                <div className="space-y-3 pt-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Text
                    </label>
                    <Input
                      value={selectedElement.text || ""}
                      onChange={(e) => selectedElement.setText(e.target.value)}
                      placeholder="Enter text"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Font Size
                    </label>
                    <Slider
                      min={10}
                      max={72}
                      step={1}
                      value={[selectedElement.fontSize || 16]}
                      onValueChange={(value) =>
                        selectedElement.setFontSize(value[0])
                      }
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10px</span>
                      <span>72px</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              {selectedElement && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Opacity
                    </label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[opacity]}
                      onValueChange={(value) => onChangeOpacity(value[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Border Width
                    </label>
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={[borderWidth]}
                      onValueChange={(value) => onChangeBorderWidth(value[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>None</span>
                      <span>Thick</span>
                    </div>
                  </div>

                  {borderWidth > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Border Color
                      </label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {[
                          "#000000",
                          "#FFFFFF",
                          "#FF0000",
                          "#00FF00",
                          "#0000FF",
                          "#FFFF00",
                          "#FF00FF",
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => onChangeBorderColor(color)}
                            className={`w-full aspect-square rounded-md border ${
                              borderColor === color
                                ? "border-gray-400 ring-2 ring-primary"
                                : "border-gray-200"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={borderColor}
                        onChange={(e) => onChangeBorderColor(e.target.value)}
                        className="w-full mt-2"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Fill Color
                    </label>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {[
                        "#000000",
                        "#FFFFFF",
                        "#FF0000",
                        "#00FF00",
                        "#0000FF",
                        "#FFFF00",
                        "#FF00FF",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => onChangeFillColor(color)}
                          className={`w-full aspect-square rounded-md border ${
                            fillColor === color
                              ? "border-gray-400 ring-2 ring-primary"
                              : "border-gray-200"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={fillColor}
                      onChange={(e) => onChangeFillColor(e.target.value)}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="qrcode" className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  QR Code URL
                </label>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com" className="flex-1" />
                  <Button>Generate</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomizerToolbar;
