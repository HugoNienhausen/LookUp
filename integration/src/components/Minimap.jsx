import React, { useEffect, useRef, useState } from 'react';
import { getViewer, isViewerReady } from '../lib/seadragon-loader';
import {
    getViewportCenterNormalized,
    getViewportBoundsNormalized,
    getImageBoundsInViewport,
    panToCoordinate
} from '../lib/coords';
import OpenSeadragon from 'openseadragon';

/**
 * Componente de minimapa mejorado inspirado en figmamake
 * Sincronizado con las coordenadas del widget de navegación
 * Muestra:
 * - Miniatura de la imagen completa
 * - Rectángulo del viewport actual
 * - Punto central parpadeante
 * - Bordes de la imagen
 */
const Minimap = () => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const animationFrameRef = useRef(null);
    const lastUpdateTimeRef = useRef(0);

    useEffect(() => {
        if (!isViewerReady()) return;

        const viewer = getViewer();
        if (!viewer) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Configurar tamaño del canvas
        const width = 192; // w-48 = 12rem = 192px
        const height = 128; // h-32
        canvas.width = width;
        canvas.height = height;

        setIsReady(true);

        const FPS = 60;
        const frameInterval = 1000 / FPS;

        // Función de renderizado del minimapa
        const render = (timestamp) => {
            // Throttle para performance
            if (timestamp - lastUpdateTimeRef.current < frameInterval) {
                animationFrameRef.current = requestAnimationFrame(render);
                return;
            }
            lastUpdateTimeRef.current = timestamp;

            try {
                // Limpiar canvas
                ctx.clearRect(0, 0, width, height);

                // Obtener coordenadas usando las mismas funciones que CoordinateNavigator
                const centerNorm = getViewportCenterNormalized(viewer);
                const boundsNorm = getViewportBoundsNormalized(viewer);
                const imageBounds = getImageBoundsInViewport(viewer);

                // 1. Fondo con gradiente (estilo figmamake)
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, 'rgba(13, 27, 42, 0.95)'); // --background
                gradient.addColorStop(1, 'rgba(44, 53, 49, 0.95)'); // --card
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                // 2. Textura sutil de fondo
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                for (let i = 0; i < width; i += 4) {
                    for (let j = 0; j < height; j += 4) {
                        if (Math.random() > 0.5) {
                            ctx.fillRect(i, j, 2, 2);
                        }
                    }
                }

                // 3. Calcular el área del minimapa (con margen)
                const minimapPadding = 4;
                const minimapWidth = width - (minimapPadding * 2);
                const minimapHeight = height - (minimapPadding * 2);

                // 4. Dibujar bordes de la imagen completa
                // Los límites de la imagen en el viewport nos dicen dónde está la imagen
                // Necesitamos convertir esas coordenadas del viewport al espacio del minimapa

                // Calcular el bounds actual del viewport
                const viewportBounds = viewer.viewport.getBounds();

                // Escala: cuánto del espacio del viewport cabe en el minimapa
                const scaleX = minimapWidth / viewportBounds.width;
                const scaleY = minimapHeight / viewportBounds.height;

                // Posición de la imagen en el minimapa
                const imageX = (imageBounds.x - viewportBounds.x) * scaleX + minimapPadding;
                const imageY = (imageBounds.y - viewportBounds.y) * scaleY + minimapPadding;
                const imageWidth = imageBounds.width * scaleX;
                const imageHeight = imageBounds.height * scaleY;

                // Borde exterior de la imagen (marco)
                ctx.strokeStyle = 'rgba(108, 207, 246, 0.4)'; // --primary
                ctx.lineWidth = 2;
                ctx.strokeRect(imageX, imageY, imageWidth, imageHeight);

                // 5. Calcular y dibujar rectángulo del viewport usando coordenadas normalizadas
                // boundsNorm está en [0,1] relativo a la imagen, mapeamos al área de la imagen en el minimapa
                const viewportX = imageX + boundsNorm.x * imageWidth;
                const viewportY = imageY + boundsNorm.y * imageHeight;
                const viewportWidth = boundsNorm.width * imageWidth;
                const viewportHeight = boundsNorm.height * imageHeight;

                // Área visible con relleno translúcido
                ctx.fillStyle = 'rgba(108, 207, 246, 0.15)';
                ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

                // Borde del área visible
                ctx.strokeStyle = 'rgba(108, 207, 246, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

                // 6. Punto central parpadeante usando centerNorm (estilo figmamake)
                // centerNorm está en [0,1] relativo a la imagen, mapeamos al área de la imagen en el minimapa
                const centerX = imageX + centerNorm.x * imageWidth;
                const centerY = imageY + centerNorm.y * imageHeight;

                // Animación de pulso
                const pulse = Math.sin(timestamp / 500) * 0.3 + 0.7;

                // Anillo exterior (glow)
                ctx.beginPath();
                ctx.arc(centerX, centerY, 8 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(108, 207, 246, ${pulse * 0.15})`;
                ctx.fill();

                // Anillo medio
                ctx.beginPath();
                ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(108, 207, 246, ${pulse * 0.4})`;
                ctx.fill();

                // Punto central
                ctx.beginPath();
                ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(108, 207, 246, ${pulse})`;
                ctx.fill();

                // Borde blanco del punto
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // 7. Efecto de ping (animación externa)
                if (pulse > 0.9) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(108, 207, 246, ${1 - pulse})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

            } catch (error) {
                console.warn('Error renderizando minimapa:', error);
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        // Iniciar animación
        animationFrameRef.current = requestAnimationFrame(render);

        // Suscribirse a los mismos eventos que CoordinateNavigator para sincronización
        const scheduleUpdate = () => {
            // La animación ya se encarga de actualizar, solo aseguramos que esté corriendo
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(render);
            }
        };

        const handlers = [
            { event: 'viewport-change', handler: scheduleUpdate },
            { event: 'animation', handler: scheduleUpdate },
            { event: 'pan', handler: scheduleUpdate },
            { event: 'zoom', handler: scheduleUpdate }
        ];

        handlers.forEach(({ event, handler }) => {
            viewer.addHandler(event, handler);
        });

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            handlers.forEach(({ event, handler }) => {
                viewer.removeHandler(event, handler);
            });
        };
    }, []);

    // Manejar clicks en el minimapa para navegar
    const handleClick = (e) => {
        if (!isViewerReady()) return;

        const viewer = getViewer();
        if (!viewer) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Obtener los mismos bounds que usamos para renderizar
        const imageBounds = getImageBoundsInViewport(viewer);
        const viewportBounds = viewer.viewport.getBounds();

        const minimapPadding = 4;
        const minimapWidth = rect.width - (minimapPadding * 2);
        const minimapHeight = rect.height - (minimapPadding * 2);

        // Escala del viewport al minimapa
        const scaleX = minimapWidth / viewportBounds.width;
        const scaleY = minimapHeight / viewportBounds.height;

        // Posición de la imagen en el minimapa
        const imageX = (imageBounds.x - viewportBounds.x) * scaleX + minimapPadding;
        const imageY = (imageBounds.y - viewportBounds.y) * scaleY + minimapPadding;
        const imageWidth = imageBounds.width * scaleX;
        const imageHeight = imageBounds.height * scaleY;

        // Calcular posición del click relativa al canvas
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convertir del canvas al área de la imagen, luego a coordenadas normalizadas [0,1]
        const x = (clickX - imageX) / imageWidth;
        const y = (clickY - imageY) / imageHeight;

        // Clampear a [0,1] por si el click está fuera de la imagen
        const clampedX = Math.max(0, Math.min(1, x));
        const clampedY = Math.max(0, Math.min(1, y));

        // Usar la misma función que CoordinateNavigator para navegar
        panToCoordinate(viewer, clampedX, clampedY, 'normalized', true);
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                width: '192px',
                height: '128px',
                background: 'rgba(44, 53, 49, 0.9)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(108, 207, 246, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                zIndex: 100,
                overflow: 'hidden',
                cursor: 'pointer'
            }}
            onClick={handleClick}
            title="Click para navegar"
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />

            {/* Overlay con información */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    right: '4px',
                    padding: '4px 6px',
                    background: 'rgba(13, 27, 42, 0.8)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '6px',
                    fontSize: '10px',
                    color: 'rgba(203, 213, 209, 0.9)',
                    fontFamily: 'monospace',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none'
                }}
            >
                <span>Vista general</span>
                <span style={{ color: 'rgba(108, 207, 246, 0.8)' }}>●</span>
            </div>
        </div>
    );
};

export default Minimap;
