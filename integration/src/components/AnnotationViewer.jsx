import React, { useEffect, useRef } from 'react';
import { getViewer, OpenSeadragon } from '../lib/seadragon-loader';
import { PiMapPin } from 'react-icons/pi';

/**
 * Componente para visualizar anotaciones guardadas
 * Convierte coordenadas normalizadas (0-1) de vuelta a píxeles del canvas
 */
const AnnotationViewer = ({ annotations, showControls = false }) => {
    const canvasRef = useRef(null);
    const viewerReadyRef = useRef(false);

    // Convertir coordenadas normalizadas de imagen a píxeles del canvas
    const imageToCanvasCoords = (imagePoint) => {
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
            console.error('Error convirtiendo coordenadas:', error);
            return null;
        }
    };

    // Dibujar todas las anotaciones
    const drawAnnotations = () => {
        if (!annotations || annotations.length === 0) {
            console.log('⚠️ No hay anotaciones para dibujar');
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewer = getViewer();
        if (!viewer || !viewer.world.getItemCount()) {
            console.log('⚠️ Viewer no está listo');
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        console.log('🎨 Dibujando', annotations.length, 'anotaciones');

        // Dibujar cada trazo
        annotations.forEach((stroke, index) => {
            if (!stroke.points || stroke.points.length === 0) {
                console.warn(`⚠️ Trazo ${index} no tiene puntos`);
                return;
            }

            ctx.globalAlpha = stroke.style?.opacity || 0.8;
            ctx.strokeStyle = stroke.style?.color || '#6ccff6';
            ctx.lineWidth = stroke.style?.size || 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();

            // Convertir todos los puntos y dibujar
            const canvasPoints = stroke.points.map(p => imageToCanvasCoords(p)).filter(p => p !== null);

            if (canvasPoints.length > 0) {
                ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);

                for (let i = 1; i < canvasPoints.length; i++) {
                    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
                }

                ctx.stroke();
            }
        });

        console.log('✅ Anotaciones dibujadas');
    };

    // Inicializar canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;

                // Redibujar después de redimensionar
                if (viewerReadyRef.current) {
                    drawAnnotations();
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const resizeObserver = new ResizeObserver(resizeCanvas);
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            resizeObserver.disconnect();
        };
    }, [annotations]);

    // Dibujar cuando las anotaciones cambien o el viewer se actualice
    useEffect(() => {
        const viewer = getViewer();
        if (!viewer) {
            console.log('⏳ Esperando viewer...');
            // Reintentar después de un momento
            const timer = setTimeout(() => {
                viewerReadyRef.current = true;
                drawAnnotations();
            }, 500);
            return () => clearTimeout(timer);
        }

        viewerReadyRef.current = true;

        // Dibujar inmediatamente
        drawAnnotations();

        // Redibujar cuando el viewer se mueva o haga zoom
        const handleUpdate = () => {
            drawAnnotations();
        };

        viewer.addHandler('zoom', handleUpdate);
        viewer.addHandler('pan', handleUpdate);
        viewer.addHandler('update-viewport', handleUpdate);

        return () => {
            viewer.removeHandler('zoom', handleUpdate);
            viewer.removeHandler('pan', handleUpdate);
            viewer.removeHandler('update-viewport', handleUpdate);
        };
    }, [annotations]);

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10
                }}
            />
            {showControls && annotations && annotations.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    zIndex: 11,
                    pointerEvents: 'none'
                }}>
                    <PiMapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {annotations.length} {annotations.length === 1 ? 'trazo' : 'trazos'}
                </div>
            )}
        </>
    );
};

export default AnnotationViewer;

