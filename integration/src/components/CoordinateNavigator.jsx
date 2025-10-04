import React, { useState, useEffect } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { isViewerReady, getViewer, onViewportChange, getImageDimensions } from '../lib/seadragon-loader';
import {
    getViewportCenterPx,
    getViewportCenterNormalized,
    mouseEventToImagePx,
    imagePxToNormalized,
    panToCoordinate
} from '../lib/coords';
import { PiMapPin, PiNavigationArrow } from 'react-icons/pi';

/**
 * Widget para navegar a coordenadas específicas
 * Permite al usuario introducir coordenadas y centrar el viewer en ese punto
 */
const CoordinateNavigator = () => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [coordinateType, setCoordinateType] = useState('normalized'); // 'normalized' o 'pixel'
    const [x, setX] = useState('');
    const [y, setY] = useState('');
    const [error, setError] = useState('');
    const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0 });
    const [currentCoordsPx, setCurrentCoordsPx] = useState({ x: 0, y: 0 });
    const [currentCoordsNorm, setCurrentCoordsNorm] = useState({ x: 0, y: 0 });
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const [showMouseCoords, setShowMouseCoords] = useState(false);

    // Hook para hacer el widget arrastrable
    const { elementRef, draggableStyle, handleMouseDown } = useDraggable('coordinate-navigator', { x: 20, y: 20 });

    // Actualizar coordenadas en tiempo real
    useEffect(() => {
        if (!isViewerReady()) return;

        const viewer = getViewer();
        if (!viewer) return;

        let animationFrameId = null;
        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 16; // ~60fps

        const updateCoordinates = () => {
            const now = Date.now();

            // Throttle para evitar demasiadas actualizaciones
            if (now - lastUpdateTime < UPDATE_INTERVAL) {
                return;
            }

            lastUpdateTime = now;

            try {
                // Obtener ambos formatos para tenerlos siempre disponibles
                const coordsPx = getViewportCenterPx(viewer);
                const coordsNorm = getViewportCenterNormalized(viewer);

                setCurrentCoordsPx(coordsPx);
                setCurrentCoordsNorm(coordsNorm);

                // Actualizar currentCoords según el tipo seleccionado
                if (coordinateType === 'normalized') {
                    setCurrentCoords(coordsNorm);
                } else {
                    setCurrentCoords(coordsPx);
                }
            } catch (error) {
                console.warn('Error actualizando coordenadas:', error);
            }
        };

        // Función con requestAnimationFrame para mejor rendimiento
        const scheduleUpdate = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = requestAnimationFrame(updateCoordinates);
        };

        // Actualizar coordenadas iniciales
        updateCoordinates();

        // Suscribirse a múltiples eventos de OpenSeadragon
        const handlers = [
            { event: 'viewport-change', handler: scheduleUpdate },
            { event: 'animation', handler: scheduleUpdate },
            { event: 'animation-finish', handler: updateCoordinates },
            { event: 'pan', handler: scheduleUpdate },
            { event: 'zoom', handler: scheduleUpdate }
        ];

        // Registrar todos los event handlers
        handlers.forEach(({ event, handler }) => {
            viewer.addHandler(event, handler);
        });

        // Cleanup
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            handlers.forEach(({ event, handler }) => {
                viewer.removeHandler(event, handler);
            });
        };
    }, [coordinateType]);

    // Manejar movimiento del mouse para mostrar coordenadas del cursor
    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!isViewerReady()) return;

            const viewer = getViewer();
            if (!viewer) return;

            // Convertir evento del mouse a coordenadas de imagen
            const imagePx = mouseEventToImagePx(viewer, event);

            if (imagePx) {
                if (coordinateType === 'normalized') {
                    const normalized = imagePxToNormalized(imagePx.x, imagePx.y, viewer);
                    setMouseCoords(normalized);
                } else {
                    setMouseCoords(imagePx);
                }
                setShowMouseCoords(true);
            } else {
                setShowMouseCoords(false);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [coordinateType]);

    const handleGoToCoordinate = () => {
        setError('');

        if (!isViewerReady()) {
            setError('Viewer no está listo');
            return;
        }

        const numX = parseFloat(x);
        const numY = parseFloat(y);

        if (isNaN(numX) || isNaN(numY)) {
            setError('Coordenadas inválidas');
            return;
        }

        const viewer = getViewer();
        if (!viewer) {
            setError('Viewer no disponible');
            return;
        }

        try {
            // Validar rangos según el tipo
            if (coordinateType === 'normalized') {
                if (numX < 0 || numX > 1 || numY < 0 || numY > 1) {
                    setError('Coordenadas normalizadas deben estar entre 0 y 1');
                    return;
                }
            } else {
                const dims = getImageDimensions();
                if (numX < 0 || numX > dims.width || numY < 0 || numY > dims.height) {
                    setError(`Coordenadas deben estar entre 0 y ${dims.width}x${dims.height}`);
                    return;
                }
            }

            // Usar la función unificada de navegación
            const success = panToCoordinate(viewer, numX, numY, coordinateType);

            if (success) {
                // Limpiar inputs después de navegar exitosamente
                setX('');
                setY('');
                setShowInput(false);
            } else {
                setError('Error navegando a las coordenadas');
            }
        } catch (err) {
            setError(`Error: ${err.message}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGoToCoordinate();
        }
    };

    if (isMinimized) {
        return (
            <div
                ref={elementRef}
                className="widget-base widget-minimized"
                style={{
                    ...draggableStyle,
                    cursor: 'pointer',
                    background: isHovered ? 'var(--widget-bg-hover)' : 'var(--widget-bg-idle)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--widget-border)',
                    transition: 'all 0.18s ease'
                }}
                onClick={() => setIsMinimized(false)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={handleMouseDown}
            >
                <PiMapPin size={24} />
            </div>
        );
    }

    return (
        <div
            ref={elementRef}
            className="widget-base"
            style={{
                ...draggableStyle,
                background: isHovered ? 'var(--widget-bg-hover)' : 'var(--widget-bg-idle)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid var(--widget-border)',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '240px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.18s ease'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div
                className="widget-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    cursor: 'grab'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>Navegación</h3>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(true);
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px',
                        pointerEvents: 'auto',
                        zIndex: 10
                    }}
                    title="Minimizar"
                >
                    ─
                </button>
            </div>

            {/* Coordenadas actuales en tiempo real */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500'
                }}>
                    Centro del viewport
                </label>
                <div className="coordinate-display" style={{
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    {/* Mostrar ambos formatos siempre */}
                    <div style={{
                        opacity: coordinateType === 'pixels' ? 1 : 0.7,
                        fontWeight: coordinateType === 'pixels' ? '600' : '400'
                    }}>
                        X: {currentCoordsPx.x}px • Y: {currentCoordsPx.y}px
                    </div>
                    <div style={{
                        opacity: coordinateType === 'normalized' ? 1 : 0.7,
                        fontWeight: coordinateType === 'normalized' ? '600' : '400',
                        fontSize: '10px'
                    }}>
                        X: {currentCoordsNorm.x.toFixed(4)} • Y: {currentCoordsNorm.y.toFixed(4)}
                    </div>
                </div>
            </div>

            {/* Coordenadas del mouse */}
            {showMouseCoords && (
                <div style={{ marginBottom: '12px' }}>
                    <label style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        Cursor
                    </label>
                    <div className="coordinate-display" style={{
                        padding: '8px',
                        background: 'rgba(108, 207, 246, 0.1)',
                        border: '1px solid rgba(108, 207, 246, 0.3)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#6ccff6'
                    }}>
                        {coordinateType === 'normalized' ? (
                            <>X: {mouseCoords.x.toFixed(3)}<br />Y: {mouseCoords.y.toFixed(3)}</>
                        ) : (
                            <>X: {mouseCoords.x}px<br />Y: {mouseCoords.y}px</>
                        )}
                    </div>
                </div>
            )}

            {/* Tipo de coordenadas */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500'
                }}>
                    Tipo de coordenadas
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setCoordinateType('normalized')}
                        style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: coordinateType === 'normalized' ? 'var(--primary)' : 'transparent',
                            border: `1px solid ${coordinateType === 'normalized' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                            borderRadius: '4px',
                            color: coordinateType === 'normalized' ? 'var(--primary-foreground)' : 'white',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500'
                        }}
                    >
                        Normalizadas
                    </button>
                    <button
                        onClick={() => setCoordinateType('pixel')}
                        style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: coordinateType === 'pixel' ? 'var(--primary)' : 'transparent',
                            border: `1px solid ${coordinateType === 'pixel' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                            borderRadius: '4px',
                            color: coordinateType === 'pixel' ? 'var(--primary-foreground)' : 'white',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500'
                        }}
                    >
                        Píxeles
                    </button>
                </div>
            </div>

            {/* Botón para mostrar/ocultar inputs */}
            <button
                onClick={() => setShowInput(!showInput)}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--accent-foreground)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: showInput ? '12px' : '0',
                    transition: 'all 0.2s ease'
                }}
            >
                {showInput ? 'Ocultar coordenadas' : (
                    <>
                        <PiNavigationArrow size={14} style={{ marginRight: '6px' }} />
                        Ir a coordenada
                    </>
                )}
            </button>

            {/* Inputs de coordenadas */}
            {showInput && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            display: 'block',
                            marginBottom: '4px'
                        }}>
                            X {coordinateType === 'normalized' ? '(0-1)' : '(píxeles)'}
                        </label>
                        <input
                            type="number"
                            value={x}
                            onChange={(e) => setX(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={coordinateType === 'normalized' ? '0.5' : '2000'}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '12px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            display: 'block',
                            marginBottom: '4px'
                        }}>
                            Y {coordinateType === 'normalized' ? '(0-1)' : '(píxeles)'}
                        </label>
                        <input
                            type="number"
                            value={y}
                            onChange={(e) => setY(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={coordinateType === 'normalized' ? '0.5' : '1500'}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '12px'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleGoToCoordinate}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'var(--primary)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'var(--primary-foreground)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        Ir a coordenada
                    </button>

                    {error && (
                        <div style={{
                            padding: '8px',
                            background: 'rgba(212, 24, 61, 0.2)',
                            border: '1px solid var(--destructive)',
                            borderRadius: '4px',
                            color: '#d4183d',
                            fontSize: '11px'
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CoordinateNavigator;
