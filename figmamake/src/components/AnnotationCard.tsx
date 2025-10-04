import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ThumbsUp, ThumbsDown, Edit, Trash2, Download } from 'lucide-react';

interface AnnotationCardProps {
  annotation: {
    id: string;
    title: string;
    description: string;
    author: {
      name: string;
      avatar?: string;
    };
    timestamp: string;
    score: number;
    votes: {
      up: number;
      down: number;
    };
    status: 'pendiente' | 'validada' | 'rechazada';
    tags: string[];
    type: string;
  };
  onSelect: () => void;
}

export function AnnotationCard({ annotation, onSelect }: AnnotationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validada': return 'bg-green-500';
      case 'rechazada': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'validada': return 'Validada';
      case 'rechazada': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/10 transition-colors"
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={annotation.author.avatar} />
              <AvatarFallback className="text-xs">
                {annotation.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{annotation.author.name}</span>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor(annotation.status)} text-white border-none`}
          >
            {getStatusText(annotation.status)}
          </Badge>
        </div>

        <h4 className="font-medium text-sm mb-1">{annotation.title}</h4>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {annotation.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {annotation.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{annotation.timestamp}</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{annotation.votes.up}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ThumbsDown className="w-3 h-3" />
              <span>{annotation.votes.down}</span>
            </div>
            <span>Score: {annotation.score}</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-1 mt-2">
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Edit className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}