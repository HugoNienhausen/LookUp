import { BaseWidget } from './BaseWidget';
import { AnnotationCard } from './AnnotationCard';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileText, Search, Filter } from 'lucide-react';

interface AnnotationsWidgetProps {
  annotations: any[];
  onAnnotationSelect: (annotation: any) => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore?: () => void;
}

export function AnnotationsWidget({
  annotations,
  onAnnotationSelect,
  position,
  onPositionChange,
  isMinimized,
  onMinimize,
  onRestore
}: AnnotationsWidgetProps) {
  const validatedCount = annotations.filter(ann => ann.status === 'validada').length;
  const pendingCount = annotations.filter(ann => ann.status === 'pendiente').length;

  if (isMinimized) {
    return (
      <BaseWidget
        icon={<FileText className="w-4 h-4" />}
        position={position}
        onPositionChange={onPositionChange}
        isMinimized={true}
        onMinimize={onMinimize}
        onRestore={onRestore}
        title="Mis Anotaciones"
      />
    );
  }

  return (
    <BaseWidget
      title="Mis Anotaciones"
      icon={<FileText className="w-4 h-4" />}
      position={position}
      onPositionChange={onPositionChange}
      minimizable={true}
      onMinimize={onMinimize}
      onRestore={onRestore}
      className="w-80 max-h-96"
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Total: {annotations.length}
          </Badge>
          <Badge variant="default" className="text-xs bg-green-500">
            Validadas: {validatedCount}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-yellow-500">
            Pendientes: {pendingCount}
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar anotaciones..."
              className="pl-8 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select defaultValue="all">
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="validated">Validadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Annotations List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {annotations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay anotaciones en esta vista</p>
              <p className="text-xs text-muted-foreground">Usa el pincel para crear tu primera anotación</p>
            </div>
          ) : (
            annotations.map(annotation => (
              <AnnotationCard
                key={annotation.id}
                annotation={annotation}
                onSelect={() => onAnnotationSelect(annotation)}
              />
            ))
          )}
        </div>
      </div>
    </BaseWidget>
  );
}