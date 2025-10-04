import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Search, Settings, LogOut, User, Shield } from 'lucide-react';

interface TopBarProps {
  user: any;
  userRole: 'guest' | 'user' | 'validator';
  onLogin: () => void;
  onLogout: () => void;
  onGoToCoordinate: (lat: number, lon: number) => void;
  onModeChange: (mode: 'public' | 'validator') => void;
  currentMode: 'public' | 'validator';
}

export function TopBar({ 
  user, 
  userRole, 
  onLogin, 
  onLogout, 
  onGoToCoordinate, 
  onModeChange,
  currentMode 
}: TopBarProps) {
  const [coordinates, setCoordinates] = useState('18.38, 77.58');
  const [isHovered, setIsHovered] = useState(false);

  const handleGoToCoordinate = () => {
    const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lon)) {
      onGoToCoordinate(lat, lon);
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 w-full h-16 px-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        top-menu-base h-full flex items-center justify-between px-6
        ${isHovered ? 'top-menu-hover' : 'top-menu-idle'}
      `}>
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="font-semibold text-lg text-white">MarsLab</h1>
              <p className="text-xs text-muted-foreground opacity-80">Explora • Anota • Valida</p>
            </div>
          </div>
        </div>

        {/* Coordinate Search */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-black/20 rounded-lg px-4 py-2 border border-white/10">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Lat: 18.38°N Lon: 77.58°E (Jezero Crater)"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              className="w-64 border-0 bg-transparent text-white placeholder:text-white/60 focus:ring-primary/50 top-menu-element"
              onKeyPress={(e) => e.key === 'Enter' && handleGoToCoordinate()}
            />
          </div>
          <Button 
            onClick={handleGoToCoordinate} 
            size="sm"
            className="bg-primary/80 hover:bg-primary text-primary-foreground shadow-md top-menu-element"
          >
            Ir a coordenada
          </Button>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {userRole !== 'guest' && (
            <div className="flex items-center space-x-2">
              <Badge 
                variant={currentMode === 'validator' ? 'default' : 'secondary'}
                className="bg-accent/80 text-accent-foreground shadow-sm"
              >
                {currentMode === 'public' ? 'Público' : 'Validador'}
              </Badge>
              {userRole === 'validator' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onModeChange(currentMode === 'public' ? 'validator' : 'public')}
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white shadow-md top-menu-element"
                >
                  {currentMode === 'public' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </Button>
              )}
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 shadow-md top-menu-element"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-card/95 backdrop-blur-md border-white/10 shadow-xl" 
                align="end" 
                forceMount
              >
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-white">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="w-fit text-xs border-white/20 text-white/80">
                    {userRole === 'validator' ? 'Validador' : 'Usuario'} • Reputación: {user.reputation}
                  </Badge>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-white hover:bg-white/10">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-white hover:bg-white/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={onLogin}
              className="bg-primary/80 hover:bg-primary text-primary-foreground shadow-md top-menu-element"
            >
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}