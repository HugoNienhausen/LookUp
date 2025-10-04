import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, FileText, Map } from 'lucide-react';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  annotations: any[];
}

export function ExportModal({ open, onClose, annotations }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState('geojson');
  const [exportScope, setExportScope] = useState('all');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [selectedAnnotations, setSelectedAnnotations] = useState<string[]>([]);

  const formats = [
    { value: 'geojson', label: 'GeoJSON', description: 'Formato estándar para datos geoespaciales', icon: Map },
    { value: 'stac', label: 'STAC', description: 'SpatioTemporal Asset Catalog', icon: FileText },
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation', icon: FileText }
  ];

  const handleExport = () => {
    const dataToExport = exportScope === 'all' 
      ? annotations 
      : annotations.filter(ann => selectedAnnotations.includes(ann.id));

    let exportData;
    
    switch (exportFormat) {
      case 'geojson':
        exportData = {
          type: 'FeatureCollection',
          features: dataToExport.map(annotation => ({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] // Placeholder coordinates
            },
            properties: {
              id: annotation.id,
              title: annotation.title,
              description: annotation.description,
              type: annotation.type,
              tags: annotation.tags,
              author: includeMetadata ? annotation.author : undefined,
              timestamp: includeMetadata ? annotation.timestamp : undefined,
              score: includeMetadata ? annotation.score : undefined,
              status: annotation.status
            }
          }))
        };
        break;
      
      case 'stac':
        exportData = {
          stac_version: '1.0.0',
          type: 'Collection',
          id: 'marslab-annotations',
          title: 'MarsLab Annotations Collection',
          description: 'Citizen science annotations from MarsLab',
          license: 'CC-BY-4.0',
          features: dataToExport
        };
        break;
      
      default:
        exportData = {
          metadata: {
            exported_at: new Date().toISOString(),
            format: exportFormat,
            count: dataToExport.length,
            include_metadata: includeMetadata
          },
          annotations: dataToExport
        };
    }

    // Simulate file download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marslab-annotations.${exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  const toggleAnnotationSelection = (annotationId: string) => {
    setSelectedAnnotations(prev => 
      prev.includes(annotationId)
        ? prev.filter(id => id !== annotationId)
        : [...prev, annotationId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar Anotaciones</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <Label className="text-base font-medium">Formato de exportación</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="mt-2">
              {formats.map(format => (
                <div key={format.value} className="flex items-center space-x-2 p-2 rounded-lg border">
                  <RadioGroupItem value={format.value} id={format.value} />
                  <format.icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={format.value} className="cursor-pointer">
                      {format.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Export Scope */}
          <div>
            <Label className="text-base font-medium">Anotaciones a exportar</Label>
            <Select value={exportScope} onValueChange={setExportScope}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las anotaciones ({annotations.length})</SelectItem>
                <SelectItem value="validated">Solo validadas ({annotations.filter(a => a.status === 'validada').length})</SelectItem>
                <SelectItem value="selected">Seleccionar manualmente</SelectItem>
              </SelectContent>
            </Select>

            {exportScope === 'selected' && (
              <div className="mt-3 max-h-32 overflow-y-auto space-y-2">
                {annotations.map(annotation => (
                  <div key={annotation.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedAnnotations.includes(annotation.id)}
                      onCheckedChange={() => toggleAnnotationSelection(annotation.id)}
                    />
                    <span className="text-sm">{annotation.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata Options */}
          <div>
            <Label className="text-base font-medium">Opciones</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
              <Label className="text-sm">Incluir metadatos (autor, puntuación, timestamps)</Label>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}