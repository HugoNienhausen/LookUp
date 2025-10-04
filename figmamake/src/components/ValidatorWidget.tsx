import { useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Check, X, MessageSquare, Eye, Shield, AlertCircle } from 'lucide-react';

interface ValidatorWidgetProps {
  validationQueue: any[];
  onValidate: (itemId: string, action: 'accept' | 'reject', score: number, comment: string) => void;
  onViewAnnotation: (item: any) => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore?: () => void;
}

export function ValidatorWidget({
  validationQueue,
  onValidate,
  onViewAnnotation,
  position,
  onPositionChange,
  isMinimized,
  onMinimize,
  onRestore
}: ValidatorWidgetProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [score, setScore] = useState([75]);

  const handleValidation = (action: 'accept' | 'reject') => {
    if (!selectedItem) return;
    onValidate(selectedItem.id, action, score[0], comment);
    setSelectedItem(null);
    setComment('');
    setScore([75]);
  };

  if (isMinimized) {
    return (
      <BaseWidget
        icon={
          <div className="relative">
            <Shield className="w-4 h-4" />
            {validationQueue.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            )}
          </div>
        }
        position={position}
        onPositionChange={onPositionChange}
        isMinimized={true}
        onMinimize={onMinimize}
        onRestore={onRestore}
        title="Cola de Validación"
      />
    );
  }

  return (
    <BaseWidget
      title="Cola de Validación"
      icon={<Shield className="w-4 h-4" />}
      position={position}
      onPositionChange={onPositionChange}
      minimizable={true}
      onMinimize={onMinimize}
      onRestore={onRestore}
      className="w-96 max-h-[600px]"
      state="active"
    >
      <div className="space-y-4">
        {/* Queue Status */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>{validationQueue.length} pendientes</span>
          </Badge>
          <span className="text-xs text-muted-foreground">Modo Validador Activo</span>
        </div>

        {validationQueue.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tu cola de validación está vacía</p>
            <p className="text-xs text-muted-foreground">Las nuevas anotaciones aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Queue Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">ANOTACIONES PENDIENTES</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-2">
                  {validationQueue.map(item => (
                    <Card 
                      key={item.id} 
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedItem?.id === item.id 
                          ? 'ring-2 ring-primary bg-primary/10' 
                          : 'hover:bg-accent/10'
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={item.thumbnail} 
                              alt="Vista previa"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={item.author.avatar} />
                                <AvatarFallback className="text-xs">
                                  {item.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{item.author.name}</span>
                              <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                            </div>
                            <h4 className="text-sm font-medium truncate">{item.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Validation Controls */}
            {selectedItem && (
              <div className="p-4 bg-widget-bg-idle rounded-lg space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">{selectedItem.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    por {selectedItem.author.name} • {selectedItem.timestamp}
                  </p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>

                <div>
                  <label className="text-xs mb-2 block font-medium">
                    Puntuación de Confianza: {score[0]}
                  </label>
                  <Slider
                    value={score}
                    onValueChange={setScore}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Baja confianza</span>
                    <span>Alta confianza</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs mb-2 block font-medium">Comentario (opcional)</label>
                  <Textarea
                    placeholder="Añade comentarios sobre la validación..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleValidation('accept')}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Validar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleValidation('reject')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewAnnotation(selectedItem)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseWidget>
  );
}