import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Check, X, MessageSquare, Eye } from 'lucide-react';

interface ValidatorPanelProps {
  validationQueue: any[];
  onValidate: (itemId: string, action: 'accept' | 'reject', score: number, comment: string) => void;
  onViewAnnotation: (item: any) => void;
}

export function ValidatorPanel({ validationQueue, onValidate, onViewAnnotation }: ValidatorPanelProps) {
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

  return (
    <div className="w-96 bg-card border-l border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Cola de Validación</h3>
        <Badge variant="secondary">
          {validationQueue.length} pendientes
        </Badge>
      </div>

      {validationQueue.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Tu cola de validación está vacía</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Queue Items */}
          <div className="grid gap-3 max-h-64 overflow-y-auto">
            {validationQueue.map(item => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-colors ${
                  selectedItem?.id === item.id ? 'ring-2 ring-primary' : 'hover:bg-accent/10'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={item.thumbnail} 
                        alt="Annotation preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.author.avatar} />
                          <AvatarFallback className="text-xs">
                            {item.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{item.author.name}</span>
                      </div>
                      <h4 className="text-sm font-medium truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Validation Controls */}
          {selectedItem && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Validar Anotación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">{selectedItem.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    por {selectedItem.author.name}
                  </p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>

                <div>
                  <label className="text-sm mb-2 block">
                    Puntuación: {score[0]}
                  </label>
                  <Slider
                    value={score}
                    onValueChange={setScore}
                    max={100}
                    min={0}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-sm mb-2 block">Comentario (opcional)</label>
                  <Textarea
                    placeholder="Añade comentarios sobre la validación..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}