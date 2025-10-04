import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook personalizado para hacer elementos arrastrables
 * Maneja drag and drop con persistencia en localStorage
 */
export const useDraggable = (widgetId, initialPosition = { x: 0, y: 0 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);

  // Cargar posición guardada al montar
  useEffect(() => {
    const savedPosition = localStorage.getItem(`widget-position-${widgetId}`);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        // Validar que la posición guardada esté dentro de límites razonables
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;
        
        if (parsed.x >= 0 && parsed.x <= maxX && parsed.y >= 0 && parsed.y <= maxY) {
          setPosition(parsed);
        } else {
          // Si está fuera de límites, usar posición inicial
          console.warn(`Posición guardada fuera de límites para ${widgetId}, usando inicial`);
          localStorage.removeItem(`widget-position-${widgetId}`);
        }
      } catch (error) {
        console.warn(`Error cargando posición de widget ${widgetId}:`, error);
      }
    }
  }, [widgetId]);

  // Guardar posición cuando cambie
  useEffect(() => {
    if (position.x !== initialPosition.x || position.y !== initialPosition.y) {
      localStorage.setItem(`widget-position-${widgetId}`, JSON.stringify(position));
    }
  }, [position, widgetId, initialPosition]);

  // Calcular posición dentro de los límites de la ventana
  const constrainPosition = useCallback((x, y) => {
    const element = elementRef.current;
    if (!element) return { x, y };

    const rect = element.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Mantener el widget dentro de los límites de la ventana
    const constrainedX = Math.max(0, Math.min(x, windowWidth - rect.width));
    const constrainedY = Math.max(0, Math.min(y, windowHeight - rect.height));

    return { x: constrainedX, y: constrainedY };
  }, []);

  // Estado para distinguir click de drag
  const dragStartRef = useRef(null);
  const dragThresholdRef = useRef({ moved: false, time: 0 });

  // Manejar inicio del drag
  const handleMouseDown = useCallback((e) => {
    // Solo permitir drag en el header del widget
    if (!e.target.closest('.widget-header')) return;
    
    // Ignorar si el click es en un botón de control (minimizar, cerrar, etc.)
    if (e.target.closest('button')) {
      return; // Dejar que el botón maneje su propio evento
    }
    
    e.preventDefault();
    e.stopPropagation();

    const rect = elementRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Guardar posición inicial y tiempo para detectar drag
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragThresholdRef.current = { moved: false, time: Date.now() };

    setDragOffset({ x: offsetX, y: offsetY });
    
    // NO activar isDragging inmediatamente
    // Esperar a que se mueva el mouse más allá del threshold
  }, []);

  // Manejar movimiento del drag
  const handleMouseMove = useCallback((e) => {
    // Si aún no estamos arrastrando, verificar si se superó el threshold
    if (!isDragging && dragStartRef.current) {
      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      const DRAG_THRESHOLD = 5; // píxeles mínimos para considerar drag
      const TIME_THRESHOLD = 200; // ms máximo para considerar click
      
      const elapsedTime = Date.now() - dragThresholdRef.current.time;
      
      // Si se movió más allá del threshold, iniciar drag
      if (distance > DRAG_THRESHOLD) {
        dragThresholdRef.current.moved = true;
        setIsDragging(true);
        
        // Añadir clases para feedback visual
        if (elementRef.current) {
          elementRef.current.classList.add('dragging');
        }
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      // Si pasó mucho tiempo sin moverse, cancelar
      else if (elapsedTime > TIME_THRESHOLD) {
        dragStartRef.current = null;
        return;
      }
    }

    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const constrained = constrainPosition(newX, newY);
    setPosition(constrained);
  }, [isDragging, dragOffset, constrainPosition]);

  // Manejar fin del drag
  const handleMouseUp = useCallback(() => {
    // Limpiar estado de drag
    dragStartRef.current = null;
    
    if (!isDragging) return;

    setIsDragging(false);
    
    // Remover clases de feedback visual
    if (elementRef.current) {
      elementRef.current.classList.remove('dragging');
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  // Añadir event listeners globales
  useEffect(() => {
    // Escuchar siempre mousemove y mouseup cuando hay dragStartRef
    // para detectar si se supera el threshold
    const needsListeners = isDragging || dragStartRef.current !== null;
    
    if (needsListeners) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Resetear posición
  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
    localStorage.removeItem(`widget-position-${widgetId}`);
  }, [initialPosition, widgetId]);

  // Estilos del elemento arrastrable
  const draggableStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: 10000, // Asegurar que esté por encima de todo
    transition: isDragging ? 'none' : 'all 0.2s ease',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isDragging 
      ? '0 12px 32px rgba(0,0,0,0.4), 0 0 0 2px var(--primary)' 
      : 'var(--widget-shadow)'
  };

  return {
    elementRef,
    position,
    isDragging,
    draggableStyle,
    handleMouseDown,
    resetPosition
  };
};
