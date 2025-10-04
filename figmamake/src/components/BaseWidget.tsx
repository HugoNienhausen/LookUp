import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from './ui/utils';

type WidgetState = 'hidden' | 'idle' | 'hover' | 'active' | 'disabled';

interface BaseWidgetProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  state?: WidgetState;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  draggable?: boolean;
  minimizable?: boolean;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onRestore?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  autoHide?: boolean;
  onStateChange?: (state: WidgetState) => void;
  prevPosition?: { x: number; y: number };
  prevSize?: { width: number; height: number };
}

export function BaseWidget({
  children,
  title,
  icon,
  state = 'idle',
  position = { x: 16, y: 16 },
  onPositionChange,
  draggable = true,
  minimizable = false,
  isMinimized = false,
  onMinimize,
  onRestore,
  className,
  size = 'medium',
  autoHide = true,
  onStateChange,
  prevPosition,
  prevSize
}: BaseWidgetProps) {
  const [currentState, setCurrentState] = useState<WidgetState>(state);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'widget-small';
      case 'large': return 'p-6';
      default: return 'p-4';
    }
  };

  const getStateClasses = () => {
    if (isDragging) return 'widget-drag';
    switch (currentState) {
      case 'hidden': return 'widget-hidden';
      case 'hover': return 'widget-hover';
      case 'active': return 'widget-active';
      case 'disabled': return 'widget-disabled';
      default: return 'widget-idle';
    }
  };

  const handleMouseEnter = () => {
    if (currentState !== 'disabled' && !isDragging) {
      setCurrentState('hover');
      onStateChange?.('hover');
      if (hideTimer) {
        clearTimeout(hideTimer);
        setHideTimer(null);
      }
    }
  };

  const handleMouseLeave = () => {
    if (currentState !== 'disabled' && currentState !== 'active' && !isDragging) {
      if (autoHide) {
        const timer = setTimeout(() => {
          setCurrentState('idle');
          onStateChange?.('idle');
        }, 300);
        setHideTimer(timer);
      } else {
        setCurrentState('idle');
        onStateChange?.('idle');
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || !widgetRef.current) return;
    
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setCurrentState('active');
    onStateChange?.('active');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onPositionChange) return;
    
    const newX = Math.max(16, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x));
    const newY = Math.max(16, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y));
    
    onPositionChange({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Snap to edges if close
      if (position.x < 32) {
        onPositionChange?.({ ...position, x: 16 });
      }
      if (position.y < 32) {
        onPositionChange?.({ ...position, y: 16 });
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, position]);

  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  if (isMinimized) {
    return (
      <div
        ref={widgetRef}
        className={cn(
          'widget-base widget-minimized fixed z-40 transition-all duration-200 ease-out cursor-pointer',
          getStateClasses(),
          className
        )}
        style={{ left: position.x, top: position.y }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onClick={onRestore}
        title="Restaurar widget"
        role="button"
        aria-pressed={false}
        aria-label={`Restaurar ${title || 'widget'}`}
      >
        {icon}
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={cn(
        'widget-base fixed z-40 transition-all duration-200 ease-out',
        getSizeClasses(),
        getStateClasses(),
        className
      )}
      style={{ left: position.x, top: position.y }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {(title || minimizable) && (
        <div 
          className={cn(
            'drag-handle flex items-center justify-between mb-3 pb-2 border-b border-widget-border',
            draggable && 'cursor-move'
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            {icon && <div className="w-4 h-4">{icon}</div>}
            {title && <h3 className="font-semibold text-sm">{title}</h3>}
          </div>
          {minimizable && (
            <button
              onClick={onMinimize}
              className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
              title="Minimizar widget"
              role="button"
              aria-pressed={isMinimized}
              aria-label={`Minimizar ${title || 'widget'}`}
            >
              −
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}