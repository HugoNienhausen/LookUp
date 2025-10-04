import { useState, useEffect } from 'react';
import { BaseWidget } from './BaseWidget';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

import { 
  Brush, 
  Eraser, 
  Move, 
  Tag, 
  ZoomIn, 
  ZoomOut, 
  Undo, 
  Redo, 
  Save, 
  Download,
  Settings,
  Palette,
  MousePointer,
  ChevronDown,
  ChevronRight,
  Layers,
  Eye,
  EyeOff,
  Globe,
  Satellite,
  Mountain
} from 'lucide-react';

interface ToolboxWidgetProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  brushSize: number;
  brushOpacity: number;
  onBrushSizeChange: (size: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore?: () => void;
  zoom?: number;
}

export function ToolboxWidget({
  selectedTool,
  onToolSelect,
  brushSize,
  brushOpacity,
  onBrushSizeChange,
  onBrushOpacityChange,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onSave,
  onExport,
  canUndo,
  canRedo,
  position,
  onPositionChange,
  isMinimized,
  onMinimize,
  onRestore,
  zoom = 1
}: ToolboxWidgetProps) {
  const [activeTab, setActiveTab] = useState('tools');
  const [isBrushHudOpen, setIsBrushHudOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [layers, setLayers] = useState({
    mars: true,
    hirise: true,
    ctx: false
  });

  const tools = [
    { id: 'brush', icon: Brush, name: 'Pincel', shortcut: 'B', tooltip: 'Pincel (B)' },
    { id: 'eraser', icon: Eraser, name: 'Borrar', shortcut: 'E', tooltip: 'Borrar (E)' },
    { id: 'move', icon: Move, name: 'Mover', shortcut: 'M', tooltip: 'Mover (M)' },
    { id: 'tag', icon: Tag, name: 'Etiqueta', shortcut: 'T', tooltip: 'Etiqueta (T)' },
    { id: 'picker', icon: MousePointer, name: 'Selector', shortcut: 'V', tooltip: 'Selector (V)' }
  ];

  // Auto-expand Brush HUD when brush is selected
  useEffect(() => {
    if (selectedTool === 'brush') {
      setIsBrushHudOpen(true);
    } else {
      setIsBrushHudOpen(false);
    }
  }, [selectedTool]);

  const toggleLayer = (layerName: string) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const getToolIcon = () => {
    const tool = tools.find(t => t.id === selectedTool);
    return tool ? <tool.icon className="w-4 h-4" /> : <Settings className="w-4 h-4" />;
  };

  if (isMinimized) {
    return (
      <BaseWidget
        icon={getToolIcon()}
        position={position}
        onPositionChange={onPositionChange}
        isMinimized={true}
        onMinimize={onMinimize}
        onRestore={onRestore}
        className="widget-minimized"
        title="Toolbox"
      />
    );
  }

  return (
    <BaseWidget
      title="Toolbox"
      icon={<Settings className="w-4 h-4" />}
      position={position}
      onPositionChange={onPositionChange}
      minimizable={true}
      onMinimize={onMinimize}
      onRestore={onRestore}
      className="w-72"
      state={selectedTool !== 'move' ? 'active' : 'idle'}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="tools" className="text-xs">Herramientas</TabsTrigger>
          <TabsTrigger value="controls" className="text-xs">Controles</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {tools.map(tool => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                title={tool.tooltip}
                className={`h-12 flex flex-col items-center gap-1 ${
                  selectedTool === tool.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <tool.icon className="w-4 h-4" />
                <span className="text-xs">{tool.shortcut}</span>
              </Button>
            ))}
          </div>

          {/* Brush HUD - Collapsible */}
          <Collapsible open={isBrushHudOpen} onOpenChange={setIsBrushHudOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center space-x-2">
                  <Brush className="w-4 h-4" />
                  <span className="text-xs">Brush HUD</span>
                </div>
                {isBrushHudOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2 p-3 bg-widget-bg-idle rounded-lg">
              <div>
                <label className="text-xs mb-2 block">Tamaño: {brushSize}px</label>
                <Slider
                  value={[brushSize]}
                  onValueChange={([value]) => onBrushSizeChange(value)}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs mb-2 block">Opacidad: {Math.round(brushOpacity * 100)}%</label>
                <Slider
                  value={[brushOpacity]}
                  onValueChange={([value]) => onBrushOpacityChange(value)}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs mb-2 block">Dureza: 80%</label>
                <Slider
                  value={[0.8]}
                  onValueChange={() => {}}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Color: #6CCFF6</span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Compact Layers Section */}
          <Collapsible open={isLayersOpen} onOpenChange={setIsLayersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs">Layers (compact)</span>
                </div>
                {isLayersOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="flex items-center justify-between p-2 rounded bg-widget-bg-idle">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3 h-3 text-primary" />
                  <span className="text-xs">Mars Global</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLayer('mars')}
                  className="h-5 w-5 p-0"
                >
                  {layers.mars ? 
                    <Eye className="w-3 h-3 text-primary" /> : 
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  }
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-widget-bg-idle">
                <div className="flex items-center space-x-2">
                  <Satellite className="w-3 h-3 text-accent" />
                  <span className="text-xs">HiRISE</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLayer('hirise')}
                  className="h-5 w-5 p-0"
                >
                  {layers.hirise ? 
                    <Eye className="w-3 h-3 text-primary" /> : 
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  }
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-widget-bg-idle">
                <div className="flex items-center space-x-2">
                  <Mountain className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">CTX Context</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLayer('ctx')}
                  className="h-5 w-5 p-0"
                >
                  {layers.ctx ? 
                    <Eye className="w-3 h-3 text-primary" /> : 
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  }
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-2 block">Zoom</label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onZoomOut}
                  title="Alejar zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <div className="flex-1 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onZoomIn}
                  title="Acercar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-xs mb-2 block">Historial</label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex-1"
                  title="Deshacer (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4 mr-1" />
                  <span className="text-xs">Ctrl+Z</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex-1"
                  title="Rehacer (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4 mr-1" />
                  <span className="text-xs">Ctrl+Y</span>
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-xs mb-2 block">Ir a coordenada</label>
              <Input 
                placeholder="18.38, 77.58"
                className="text-xs"
                onKeyPress={(e) => e.key === 'Enter' && console.log('Navigate to coordinate')}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Button onClick={onSave} className="w-full" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar anotación
              </Button>
              <Button variant="outline" onClick={onExport} className="w-full" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </BaseWidget>
  );
}