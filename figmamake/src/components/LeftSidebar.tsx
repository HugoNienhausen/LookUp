import { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AnnotationCard } from './AnnotationCard';
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
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';

interface LeftSidebarProps {
  annotations: any[];
  brushSize: number;
  brushOpacity: number;
  onBrushSizeChange: (size: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onToolSelect: (tool: string) => void;
  selectedTool: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveAnnotation: () => void;
  onExport: () => void;
  onAnnotationSelect: (annotation: any) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function LeftSidebar({
  annotations,
  brushSize,
  brushOpacity,
  onBrushSizeChange,
  onBrushOpacityChange,
  onToolSelect,
  selectedTool,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onSaveAnnotation,
  onExport,
  onAnnotationSelect,
  canUndo,
  canRedo
}: LeftSidebarProps) {
  const [layers, setLayers] = useState({
    mars: true,
    hirise: true,
    ctx: false
  });

  const tools = [
    { id: 'brush', icon: Brush, name: 'Pincel' },
    { id: 'eraser', icon: Eraser, name: 'Borrar' },
    { id: 'move', icon: Move, name: 'Mover' },
    { id: 'tag', icon: Tag, name: 'Etiqueta' }
  ];

  const toggleLayer = (layerName: string) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <div className="w-80 bg-card border-r border-border p-4 space-y-6 overflow-y-auto">
      {/* Capas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm">
            <Layers className="w-4 h-4 mr-2" />
            Capas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Mars Global</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLayer('mars')}
            >
              {layers.mars ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">HiRISE Preview</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLayer('hirise')}
            >
              {layers.hirise ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">CTX Context</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLayer('ctx')}
            >
              {layers.ctx ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datasets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">HiRISE_E_1234</div>
          <div className="text-sm text-muted-foreground">CTX_Jezero_2016</div>
          <div className="text-sm text-muted-foreground">MarsRover_Perseverance_2024</div>
        </CardContent>
      </Card>

      {/* Herramientas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Herramientas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {tools.map(tool => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                className="flex flex-col items-center gap-1 h-12"
              >
                <tool.icon className="w-4 h-4" />
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>

          {selectedTool === 'brush' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm mb-2 block">Tamaño: {brushSize}px</label>
                <Slider
                  value={[brushSize]}
                  onValueChange={([value]) => onBrushSizeChange(value)}
                  max={100}
                  min={1}
                  step={1}
                />
              </div>
              <div>
                <label className="text-sm mb-2 block">Opacidad: {Math.round(brushOpacity * 100)}%</label>
                <Slider
                  value={[brushOpacity]}
                  onValueChange={([value]) => onBrushOpacityChange(value)}
                  max={1}
                  min={0.1}
                  step={0.1}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de Zoom y Acciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Controles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
          <Button className="w-full" onClick={onSaveAnnotation}>
            <Save className="w-4 h-4 mr-2" />
            Guardar anotación
          </Button>
          <Button variant="outline" className="w-full" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardContent>
      </Card>

      {/* Anotaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Mis Anotaciones ({annotations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {annotations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay anotaciones en esta vista</p>
          ) : (
            annotations.map(annotation => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                onSelect={() => onAnnotationSelect(annotation)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}