import React, { useRef, useEffect, useCallback } from 'react';
import { useToolbox } from '../context/ToolboxContext';
import { getViewer, OpenSeadragon } from '../lib/seadragon-loader';

const CanvasOverlay = () => {
    const canvasRef = useRef(null);
    const { selectedTool, brushSize, brushOpacity } = useToolbox();
    const isDrawingRef = useRef(false);
    const isPanningRef = useRef(false);
    const lastPointRef = useRef(null);
    const lastPanPointRef = useRef(null);

    // Inicializar canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tempCtx.drawImage(canvas, 0, 0);

                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempCanvas, 0, 0);

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

    // Dibujar punto
    const drawPoint = useCallback((point, size = brushSize, opacity = brushOpacity) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = selectedTool === 'erase' ? 'destination-out' : 'source-over';
        ctx.fillStyle = '#6ccff6';

        ctx.beginPath();
        ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }, [selectedTool, brushSize, brushOpacity]);

    // Dibujar línea
    const drawLine = useCallback((from, to, size = brushSize, opacity = brushOpacity) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = selectedTool === 'erase' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = '#6ccff6';
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }, [selectedTool, brushSize, brushOpacity]);

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
            if (selectedTool === 'brush' || selectedTool === 'erase') {
                // Pincel/Borrador: click izquierdo pinta/borra
                isDrawingRef.current = true;
                lastPointRef.current = point;
                drawPoint(point);
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
    }, [selectedTool, getMousePos, drawPoint]);

    const handleMouseMove = useCallback((e) => {
        const point = getMousePos(e);

        // Manejo de pan
        if (isPanningRef.current) {
            handlePan(e);
            return;
        }

        // Manejo de dibujo
        if (isDrawingRef.current && (selectedTool === 'brush' || selectedTool === 'erase')) {
            if (lastPointRef.current) {
                drawLine(lastPointRef.current, point);
            }
            lastPointRef.current = point;
        }
    }, [selectedTool, getMousePos, drawLine, handlePan]);

    const handleMouseUp = useCallback((e) => {
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
    }, []);

    // Exponer función de limpiar globalmente
    useEffect(() => {
        window.clearCanvas = clearCanvas;
        return () => {
            delete window.clearCanvas;
        };
    }, [clearCanvas]);

    // Establecer cursor según herramienta
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        switch (selectedTool) {
            case 'brush':
                canvas.style.cursor = 'crosshair';
                break;
            case 'erase':
                canvas.style.cursor = 'not-allowed';
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

    // Sincronizar canvas con zoom del viewer
    useEffect(() => {
        const viewer = getViewer();
        if (!viewer) return;

        const handleZoom = () => {
            // El canvas se redimensiona automáticamente con el ResizeObserver
            console.log('🔍 Zoom actualizado');
        };

        viewer.addHandler('zoom', handleZoom);
        viewer.addHandler('pan', handleZoom);

        return () => {
            viewer.removeHandler('zoom', handleZoom);
            viewer.removeHandler('pan', handleZoom);
        };
    }, []);

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
