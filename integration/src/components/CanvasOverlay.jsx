import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useToolbox } from '../context/ToolboxContext';
import { getViewer, OpenSeadragon } from '../lib/seadragon-loader';

const CanvasOverlay = () => {
    const canvasRef = useRef(null);
    const { selectedTool, brushSize, brushOpacity } = useToolbox();
    const isDrawingRef = useRef(false);
    const isPanningRef = useRef(false);
    const lastPointRef = useRef(null);
    const lastPanPointRef = useRef(null);

    // Estado para guardar los trazos
    const [strokes, setStrokes] = useState([]);
    const currentStrokeRef = useRef(null);

    // Inicializar canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
                console.log('🖼️ Canvas redimensionado:', canvas.width, 'x', canvas.height);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });

        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
        };
    }, []);

    // Obtener coordenadas del mouse
    const getMousePos = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }, []);

    // Convertir coordenadas del canvas a coordenadas de imagen normalizadas (0-1)
    const canvasToImageCoords = useCallback((canvasPoint) => {
        try {
            const viewer = getViewer();
            if (!viewer) {
                console.warn('⚠️ Viewer no disponible');
                return null;
            }
            if (!viewer.world.getItemCount()) {
                console.warn('⚠️ No hay items en el viewer');
                return null;
            }

            // Convertir a coordenadas del viewport de OpenSeadragon
            const viewportPoint = viewer.viewport.pointFromPixel(
                new OpenSeadragon.Point(canvasPoint.x, canvasPoint.y)
            );

            // Convertir a coordenadas de la imagen
            const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);

            // Obtener dimensiones de la imagen para normalizar
            const tiledImage = viewer.world.getItemAt(0);
            const imageSize = tiledImage.getContentSize();

            // Normalizar entre 0 y 1
            const normalized = {
                x: imagePoint.x / imageSize.x,
                y: imagePoint.y / imageSize.y
            };
            
            return normalized;
        } catch (error) {
            console.error('❌ Error convirtiendo coordenadas:', error);
            return null;
        }
    }, []);

    // Convertir coordenadas normalizadas de imagen a píxeles del canvas
    const imageToCanvasCoords = useCallback((imagePoint) => {
        try {
            const viewer = getViewer();
            if (!viewer || !viewer.world.getItemCount()) return null;

            const tiledImage = viewer.world.getItemAt(0);
            const imageSize = tiledImage.getContentSize();

            // Des-normalizar (0-1 → píxeles de imagen)
            const imageCoords = new OpenSeadragon.Point(
                imagePoint.x * imageSize.x,
                imagePoint.y * imageSize.y
            );

            // Convertir a viewport
            const viewportPoint = viewer.viewport.imageToViewportCoordinates(imageCoords);

            // Convertir a píxeles del canvas
            const canvasPoint = viewer.viewport.pixelFromPoint(viewportPoint);

            return canvasPoint;
        } catch (error) {
            console.error('Error convirtiendo coordenadas de imagen a canvas:', error);
            return null;
        }
    }, []);

    // Redibujar todos los trazos guardados en el canvas
    const redrawStrokes = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewer = getViewer();
        if (!viewer || !viewer.world.getItemCount()) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar cada trazo guardado
        strokes.forEach((stroke, index) => {
            if (!stroke || !stroke.points || stroke.points.length === 0) {
                return;
            }

            ctx.globalAlpha = stroke.style?.opacity || 0.8;
            ctx.strokeStyle = stroke.style?.color || '#6ccff6';
            ctx.lineWidth = stroke.style?.size || 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();

            // Convertir todos los puntos a coordenadas del canvas
            const canvasPoints = stroke.points
                .map(p => imageToCanvasCoords(p))
                .filter(p => p !== null);

            if (canvasPoints.length > 0) {
                ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);

                for (let i = 1; i < canvasPoints.length; i++) {
                    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
                }

                ctx.stroke();
            }
        });

        // Si hay un trazo en progreso, dibujarlo también
        if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
            ctx.globalAlpha = currentStrokeRef.current.style?.opacity || 0.8;
            ctx.strokeStyle = currentStrokeRef.current.style?.color || '#6ccff6';
            ctx.lineWidth = currentStrokeRef.current.style?.size || 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();

            const currentCanvasPoints = currentStrokeRef.current.points
                .map(p => imageToCanvasCoords(p))
                .filter(p => p !== null);

            if (currentCanvasPoints.length > 0) {
                ctx.moveTo(currentCanvasPoints[0].x, currentCanvasPoints[0].y);

                for (let i = 1; i < currentCanvasPoints.length; i++) {
                    ctx.lineTo(currentCanvasPoints[i].x, currentCanvasPoints[i].y);
                }

                ctx.stroke();
            }
        }
    }, [strokes, imageToCanvasCoords]);

    // Manejar pan del viewer
    const handlePan = useCallback((e) => {
        if (!isPanningRef.current || !lastPanPointRef.current) return;

        const viewer = getViewer();
        if (!viewer) return;

        const currentPoint = getMousePos(e);
        const deltaX = currentPoint.x - lastPanPointRef.current.x;
        const deltaY = currentPoint.y - lastPanPointRef.current.y;

        const viewport = viewer.viewport;
        const deltaPointsX = deltaX / viewport.getContainerSize().x * viewport.getHomeBounds().width;
        const deltaPointsY = deltaY / viewport.getContainerSize().y * viewport.getHomeBounds().height;

        const center = viewport.getCenter();
        viewport.panTo(new OpenSeadragon.Point(
            center.x - deltaPointsX,
            center.y - deltaPointsY
        ), false);

        lastPanPointRef.current = currentPoint;
    }, [getMousePos]);

    // Event handlers
    const handleMouseDown = useCallback((e) => {
        const point = getMousePos(e);

        if (e.button === 0) { // Click izquierdo
            if (selectedTool === 'brush') {
                // Pincel: click izquierdo pinta
                // Iniciar un nuevo trazo
                const imageCoords = canvasToImageCoords(point);
                if (imageCoords && imageCoords.x !== null && imageCoords.y !== null) {
                    // Solo activar el dibujo si se pudieron obtener coordenadas válidas
                    isDrawingRef.current = true;
                    lastPointRef.current = point;
                    
                    currentStrokeRef.current = {
                        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: selectedTool,
                        points: [imageCoords],
                        style: {
                            size: brushSize,
                            opacity: brushOpacity,
                            color: '#6ccff6'
                        },
                        timestamp: new Date().toISOString()
                    };
                    console.log('🎨 Nuevo trazo iniciado:', currentStrokeRef.current.id);
                    
                    // Redibujar para mostrar el primer punto
                    redrawStrokes();
                } else {
                    console.warn('⚠️ No se pudo obtener coordenadas de imagen válidas - Asegúrate de que la imagen esté completamente cargada');
                }
            } else if (selectedTool === 'move') {
                // Mover: click izquierdo arrastra
                isPanningRef.current = true;
                lastPanPointRef.current = point;
            }
        } else if (e.button === 2) { // Click derecho
            // Click derecho: siempre arrastra/pan
            e.preventDefault();
            isPanningRef.current = true;
            lastPanPointRef.current = point;
        }
    }, [selectedTool, getMousePos, canvasToImageCoords, brushSize, brushOpacity, redrawStrokes]);

    const handleMouseMove = useCallback((e) => {
        const point = getMousePos(e);

        // Manejo de pan
        if (isPanningRef.current) {
            handlePan(e);
            return;
        }

        // Manejo de dibujo
        if (isDrawingRef.current && selectedTool === 'brush') {
            if (lastPointRef.current) {
                // Agregar punto al trazo actual
                const imageCoords = canvasToImageCoords(point);
                if (currentStrokeRef.current && imageCoords && imageCoords.x !== null && imageCoords.y !== null) {
                    currentStrokeRef.current.points.push(imageCoords);
                    // Redibujar para mostrar el trazo en progreso
                    redrawStrokes();
                }
            }
            lastPointRef.current = point;
        }
    }, [selectedTool, getMousePos, handlePan, canvasToImageCoords, redrawStrokes]);

    const handleMouseUp = useCallback(() => {
        // Guardar el trazo completado
        if (isDrawingRef.current && currentStrokeRef.current) {
            if (currentStrokeRef.current.points.length > 0) {
                // Capturar el trazo en una variable local ANTES de establecer el ref a null
                const completedStroke = currentStrokeRef.current;
                console.log('✅ Trazo guardado:', completedStroke.id, `(${completedStroke.points.length} puntos)`);
                
                setStrokes(prev => [...prev, completedStroke]);
            }
            currentStrokeRef.current = null;
        }

        isDrawingRef.current = false;
        isPanningRef.current = false;
        lastPointRef.current = null;
        lastPanPointRef.current = null;
    }, []);

    const handleMouseLeave = useCallback(() => {
        isDrawingRef.current = false;
        isPanningRef.current = false;
        lastPointRef.current = null;
        lastPanPointRef.current = null;
    }, []);

    // Doble click para zoom (solo en modo move)
    const handleDoubleClick = useCallback((e) => {
        if (selectedTool !== 'move') return;

        const viewer = getViewer();
        if (!viewer) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const viewportPoint = viewer.viewport.pointFromPixel(
            new OpenSeadragon.Point(
                e.clientX - rect.left,
                e.clientY - rect.top
            )
        );

        viewer.viewport.zoomTo(viewer.viewport.getZoom() * 2, viewportPoint, false);
    }, [selectedTool]);

    // Limpiar canvas
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setStrokes([]);
        currentStrokeRef.current = null;
        console.log('🧹 Canvas limpiado');
    }, []);

    // Exponer funciones globalmente
    useEffect(() => {
        window.clearCanvas = clearCanvas;
        window.getAnnotationsData = () => strokes;
        window.__annotationStrokes = strokes;

        return () => {
            delete window.clearCanvas;
            delete window.getAnnotationsData;
            delete window.__annotationStrokes;
        };
    }, [clearCanvas, strokes]);

    // Log de trazos actuales
    useEffect(() => {
        if (strokes.length > 0) {
            console.log(`📝 Trazos en canvas: ${strokes.length}`);
        }
    }, [strokes]);

    // Establecer cursor según herramienta
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        switch (selectedTool) {
            case 'brush':
                canvas.style.cursor = 'crosshair';
                break;
            case 'move':
                canvas.style.cursor = isPanningRef.current ? 'grabbing' : 'grab';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }, [selectedTool]);

    // Limpiar estado al cambiar herramienta
    useEffect(() => {
        isDrawingRef.current = false;
        isPanningRef.current = false;
        lastPointRef.current = null;
        lastPanPointRef.current = null;
    }, [selectedTool]);

    // Redibujar cuando cambien los strokes
    useEffect(() => {
        redrawStrokes();
    }, [strokes, redrawStrokes]);

    // Sincronizar canvas con zoom/pan del viewer - REDIBUJAR
    useEffect(() => {
        const viewer = getViewer();
        if (!viewer) return;

        const handleUpdate = () => {
            redrawStrokes();
        };

        viewer.addHandler('zoom', handleUpdate);
        viewer.addHandler('pan', handleUpdate);
        viewer.addHandler('update-viewport', handleUpdate);

        return () => {
            viewer.removeHandler('zoom', handleUpdate);
            viewer.removeHandler('pan', handleUpdate);
            viewer.removeHandler('update-viewport', handleUpdate);
        };
    }, [redrawStrokes]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 10
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

export default CanvasOverlay;
