import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface MainCanvasProps {
  selectedTool: string;
  brushSize: number;
  brushOpacity: number;
  zoom: number;
  onCoordinateChange: (lat: number, lon: number) => void;
  coordinates: { lat: number; lon: number };
  onAnnotationDraw: (path: any) => void;
}

export function MainCanvas({
  selectedTool,
  brushSize,
  brushOpacity,
  zoom,
  onCoordinateChange,
  coordinates,
  onAnnotationDraw
}: MainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{x: number, y: number}>>([]);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const [backgroundImageError, setBackgroundImageError] = useState(false);
  const backgroundContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    overlayCanvas.width = overlayCanvas.offsetWidth;
    overlayCanvas.height = overlayCanvas.offsetHeight;

    // Clear canvas to make it transparent for background image
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add grid lines for coordinate reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [zoom, panOffset]);

  // Load background image
  useEffect(() => {
    const container = backgroundContainerRef.current;
    if (!container) return;

    const img = new Image();
    const imageUrl = 'https://images.unsplash.com/photo-1603725305853-1d9da426518c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJzJTIwcm92ZXIlMjBwZXJzZXZlcmFuY2UlMjBuYXNhfGVufDF8fHx8MTc1OTU1NzQyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
    
    img.onload = () => {
      setBackgroundImageLoaded(true);
      setBackgroundImageError(false);
      container.style.backgroundImage = `url('${imageUrl}')`;
      console.log('Background image loaded successfully');
    };
    
    img.onerror = () => {
      setBackgroundImageError(true);
      setBackgroundImageLoaded(false);
      console.warn('Background image failed to load, using fallback');
    };
    
    img.src = imageUrl;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'move') {
      setIsPanning(true);
      setLastPanPoint({ x, y });
    } else if (selectedTool === 'brush') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update coordinates display
    if (coordinates?.lat !== undefined && coordinates?.lon !== undefined) {
      const lat = coordinates.lat + (y - rect.height / 2) * 0.0001;
      const lon = coordinates.lon + (x - rect.width / 2) * 0.0001;
      onCoordinateChange(lat, lon);
    }

    if (isPanning && selectedTool === 'move') {
      const dx = x - lastPanPoint.x;
      const dy = y - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x, y });
    } else if (isDrawing && selectedTool === 'brush') {
      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas?.getContext('2d');
      if (!overlayCtx) return;

      const newPath = [...currentPath, { x, y }];
      setCurrentPath(newPath);

      // Draw on overlay canvas
      overlayCtx.globalAlpha = brushOpacity;
      overlayCtx.fillStyle = '#6CCFF6';
      overlayCtx.beginPath();
      overlayCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      overlayCtx.fill();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 0) {
      onAnnotationDraw(currentPath);
      setCurrentPath([]);
    }
    setIsDrawing(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(zoom * zoomFactor, 5));
    
    // Calculate pan offset to zoom towards mouse position
    const deltaX = (mouseX - rect.width / 2) * (newZoom - zoom) / zoom;
    const deltaY = (mouseY - rect.height / 2) * (newZoom - zoom) / zoom;
    
    setPanOffset(prev => ({
      x: prev.x - deltaX,
      y: prev.y - deltaY
    }));
  };

  return (
    <div className="flex-1 relative bg-background overflow-hidden">
      {/* Background Mars Rover Image */}
      <div 
        ref={backgroundContainerRef}
        className="absolute inset-0 w-full h-full mars-rover-background"
        style={{
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#0d1b2a'
        }}
        aria-label="Mars rover surface background"
      >
        {backgroundImageError && (
          <div className="w-full h-full bg-gradient-to-br from-[#8B4513] via-[#654321] to-[#2F1B14] flex items-center justify-center">
            <div className="text-muted-foreground text-lg opacity-60">
              Imagen rover no disponible
            </div>
          </div>
        )}
        
        {/* Overlay for contrast - only show when image is loaded */}
        {backgroundImageLoaded && (
          <div className="absolute inset-0 bg-black/18" />
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          cursor: selectedTool === 'move' ? 'move' : selectedTool === 'brush' ? 'crosshair' : 'default',
          backgroundColor: 'transparent'
        }}
      />
      
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`
        }}
      />

      <div
        className="absolute inset-0 w-full h-full z-30"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}