import { BaseWidget } from './BaseWidget';
import { Badge } from './ui/badge';
import { Map, Navigation, Target } from 'lucide-react';

interface MinimapWidgetProps {
  coordinates: { lat: number; lon: number };
  zoom: number;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore?: () => void;
}

export function MinimapWidget({
  coordinates,
  zoom,
  position,
  onPositionChange,
  isMinimized,
  onMinimize,
  onRestore
}: MinimapWidgetProps) {
  if (isMinimized) {
    return (
      <BaseWidget
        icon={<Map className="w-4 h-4" />}
        position={position}
        onPositionChange={onPositionChange}
        isMinimized={true}
        onMinimize={onMinimize}
        onRestore={onRestore}
        title="Mapa general"
      />
    );
  }

  return (
    <BaseWidget
      title="Mapa general"
      icon={<Map className="w-4 h-4" />}
      position={position}
      onPositionChange={onPositionChange}
      minimizable={true}
      onMinimize={onMinimize}
      onRestore={onRestore}
      className="w-48"
      size="small"
    >
      <div className="space-y-3">
        {/* Mini map display */}
        <div className="relative w-full h-32 bg-gradient-to-br from-orange-900 to-red-900 rounded-lg overflow-hidden">
          {/* Mars surface texture */}
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-gradient-radial from-transparent to-black"></div>
          </div>
          
          {/* Current viewport indicator */}
          <div 
            className="absolute w-4 h-4 border-2 border-primary bg-primary/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: '50%', 
              top: '50%',
              animation: 'pulse 2s infinite'
            }}
          >
            <div className="absolute inset-0 bg-primary rounded-full animate-ping"></div>
          </div>

          {/* Region markers */}
          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-accent rounded-full" title="Jezero Crater"></div>
          <div className="absolute bottom-3 right-4 w-1 h-1 bg-green-400 rounded-full" title="Perseverance Landing"></div>
          
          {/* Navigation compass */}
          <div className="absolute top-2 right-2">
            <Navigation className="w-3 h-3 text-primary transform rotate-45" />
          </div>
        </div>

        {/* Coordinates display */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono">
              {coordinates?.lat?.toFixed(4) || '0.0000'}°N
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono">
              {coordinates?.lon?.toFixed(4) || '0.0000'}°E
            </span>
          </div>
        </div>

        {/* Current region info */}
        <div className="pt-2 border-t border-widget-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Región:</span>
            <Badge variant="outline" className="text-xs">
              Jezero Crater
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">Zoom:</span>
            <span className="text-xs font-mono">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}