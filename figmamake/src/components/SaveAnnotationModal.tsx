import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { X } from 'lucide-react';

interface SaveAnnotationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (annotationData: any) => void;
}

export function SaveAnnotationModal({ open, onClose, onSave }: SaveAnnotationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    tags: [] as string[],
    privacy: 'public'
  });
  const [newTag, setNewTag] = useState('');

  const annotationTypes = [
    { value: 'crater', label: 'Cráter' },
    { value: 'dune', label: 'Duna' },
    { value: 'ice', label: 'Hielo' },
    { value: 'geological', label: 'Formación Geológica' },
    { value: 'other', label: 'Otro' }
  ];

  const predefinedTags = [
    'impacto', 'erosión', 'sedimento', 'volcánico', 'tectónico', 
    'hielo', 'agua', 'mineral', 'superficie', 'atmosférico'
  ];

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPredefinedTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.type) return;

    const annotationData = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleDateString('es-ES'),
      status: 'pendiente',
      score: 0,
      votes: { up: 0, down: 0 }
    };

    onSave(annotationData);
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: '',
      tags: [],
      privacy: 'public'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guardar Anotación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Nombre de la anotación"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {annotationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe lo que has anotado..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label>Etiquetas</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                placeholder="Añadir etiqueta"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Añadir
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-1">Etiquetas sugeridas:</p>
              <div className="flex flex-wrap gap-1">
                {predefinedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addPredefinedTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="privacy"
                checked={formData.privacy === 'public'}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, privacy: checked ? 'public' : 'private' }))
                }
              />
              <Label htmlFor="privacy">Público</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {formData.privacy === 'public' ? 'Visible para todos' : 'Solo visible para ti'}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar anotación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}