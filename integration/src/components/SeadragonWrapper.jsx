import React, { useEffect, useRef, useState } from 'react';
import { initSeadragon, destroyViewer, isViewerReady } from '../lib/seadragon-loader';
import Annotorious from '@recogito/annotorious-openseadragon';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';

/**
 * Wrapper del viewer OpenSeadragon usando el nuevo loader encapsulado
 * Inicializa el viewer y maneja fallbacks
 */
const SeadragonWrapper = ({ imageUrl, onReady, showNavigator = true, onAnnotoriousReady }) => {
    const containerRef = useRef(null);
    const annotoriousRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadingTimeout, setLoadingTimeout] = useState(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Resetear estados al cambiar imagen
        setIsReady(false);
        setHasError(false);
        setIsLoading(true);
        setErrorMessage('');

        // Timeout de seguridad para evitar loaders infinitos
        const timeout = setTimeout(() => {
            console.warn('⏰ Timeout de carga - ocultando loader');
            setIsLoading(false);
        }, 10000); // 10 segundos máximo

        setLoadingTimeout(timeout);

        const initializeViewer = async () => {
            try {
                console.log('🔄 Inicializando Seadragon con imagen:', imageUrl);

                // Configurar el contenedor con ID único
                const containerId = `seadragon-${Date.now()}`;
                containerRef.current.id = containerId;

                // Inicializar usando el loader encapsulado
                const viewer = await initSeadragon({
                    elementId: containerId,
                    tileSource: imageUrl,
                    prefixUrl: '/openseadragon-images/',
                    showNavigator: showNavigator,
                    navigatorId: `${containerId}-navigator`
                });

                // Configurar callbacks cuando esté listo
                if (viewer) {
                    // Evento cuando la imagen se abre completamente
                    viewer.addHandler('open', () => {
                        console.log('✅ Imagen abierta - ocultando loader');
                        setIsReady(true);
                        setHasError(false);
                        setIsLoading(false);

                        // Limpiar timeout
                        if (timeout) {
                            clearTimeout(timeout);
                        }

                        // Inicializar Annotorious después de que la imagen esté abierta
                        if (!annotoriousRef.current) {
                            try {
                                console.log('🎨 Inicializando Annotorious...');

                                // Guardar el viewport actual antes de inicializar Annotorious
                                const currentZoom = viewer.viewport.getZoom();
                                const currentCenter = viewer.viewport.getCenter();

                                const anno = Annotorious(viewer, {
                                    allowEmpty: true,
                                    widgets: [],
                                    disableEditor: false,
                                    readOnly: false
                                });

                                annotoriousRef.current = anno;

                                // Restaurar el viewport después de inicializar Annotorious
                                setTimeout(() => {
                                    viewer.viewport.zoomTo(currentZoom, null, true);
                                    viewer.viewport.panTo(currentCenter, true);
                                }, 10);

                                // Configurar eventos de Annotorious
                                anno.on('createAnnotation', (annotation) => {
                                    console.log('📝 Anotación creada:', annotation);
                                    // Restaurar viewport después de crear anotación
                                    const zoom = viewer.viewport.getZoom();
                                    const center = viewer.viewport.getCenter();
                                    viewer.viewport.zoomTo(zoom, null, true);
                                    viewer.viewport.panTo(center, true);
                                });

                                anno.on('updateAnnotation', (annotation) => {
                                    console.log('✏️ Anotación actualizada:', annotation);
                                });

                                anno.on('deleteAnnotation', (annotation) => {
                                    console.log('🗑️ Anotación eliminada:', annotation);
                                });

                                // Habilitar navegación por defecto
                                viewer.setMouseNavEnabled(true);
                                viewer.outerTracker.setTracking(true);

                                if (onAnnotoriousReady) {
                                    onAnnotoriousReady(anno);
                                }

                                console.log('✅ Annotorious inicializado correctamente');
                            } catch (error) {
                                console.error('❌ Error inicializando Annotorious:', error);
                            }
                        }

                        if (onReady) onReady(viewer);
                    });

                    // Evento cuando se cargan tiles exitosamente
                    viewer.addHandler('tile-loaded', () => {
                        console.log('✅ Tiles cargados - verificando si ocultar loader');
                        // Solo ocultar si no hay error y la imagen está abierta
                        if (!hasError && viewer.world.getItemCount() > 0) {
                            setIsLoading(false);
                            if (timeout) {
                                clearTimeout(timeout);
                            }
                        }
                    });

                    // Evento cuando falla la carga de tiles
                    viewer.addHandler('tile-load-failed', (event) => {
                        console.error('❌ Error cargando tiles:', event);
                        setHasError(true);
                        setErrorMessage('Error cargando imagen. Verificando fallback...');
                        // No ocultar loader inmediatamente, esperar timeout o fallback
                    });

                    // Evento cuando el viewer está completamente listo
                    viewer.addHandler('ready', () => {
                        console.log('✅ Viewer completamente listo');
                        setIsReady(true);
                        setIsLoading(false);
                        if (timeout) {
                            clearTimeout(timeout);
                        }
                    });
                }

            } catch (error) {
                console.error('❌ Error inicializando Seadragon:', error);
                setHasError(true);
                setErrorMessage(`Error: ${error.message}`);
                setIsLoading(false);

                // Limpiar timeout en caso de error
                if (timeout) {
                    clearTimeout(timeout);
                }
            }
        };

        initializeViewer();

        // Cleanup
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }

            // Limpiar Annotorious
            if (annotoriousRef.current) {
                try {
                    annotoriousRef.current.destroy();
                    annotoriousRef.current = null;
                    console.log('🧹 Annotorious limpiado');
                } catch (error) {
                    console.error('❌ Error limpiando Annotorious:', error);
                }
            }

            destroyViewer();
        };
    }, [imageUrl, onReady, showNavigator]);

    // Exponer la instancia de Annotorious
    const getAnnotorious = () => {
        return annotoriousRef.current;
    };

    // Exponer función para cambiar herramienta
    const setDrawingTool = (tool) => {
        if (annotoriousRef.current) {
            annotoriousRef.current.setDrawingTool(tool);
        }
    };

    // Exponer funciones útiles
    React.useImperativeHandle(React.forwardRef(() => null), () => ({
        getAnnotorious,
        setDrawingTool
    }));

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: '#1a1a1a'
        }}>
            {/* Contenedor principal del viewer */}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}
            />

            {/* Navigator/Minimapa */}
            {showNavigator && (
                <div
                    id={`${containerRef.current?.id || 'seadragon'}-navigator`}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        width: '200px',
                        height: '150px',
                        background: 'rgba(44, 53, 49, 0.9)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        zIndex: 100,
                        overflow: 'hidden'
                    }}
                />
            )}

            {/* Loading state */}
            {isLoading && !hasError && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '16px',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '20px',
                        borderRadius: '12px',
                        backdropFilter: 'blur(6px)'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(108, 207, 246, 0.3)',
                        borderTop: '3px solid var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <div>Cargando imagen...</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        {imageUrl.includes('openseadragon.github.io') ? 'Ejemplo' : 'S3'}
                    </div>
                </div>
            )}

            {/* Error state con fallback */}
            {hasError && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '16px',
                        zIndex: 1,
                        textAlign: 'center',
                        background: 'rgba(212, 24, 61, 0.1)',
                        border: '1px solid var(--destructive)',
                        borderRadius: '8px',
                        padding: '20px',
                        maxWidth: '400px'
                    }}
                >
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                    <div style={{ marginBottom: '12px' }}>{errorMessage}</div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        Usando imagen estática como fallback
                    </div>

                    {/* Fallback con imagen estática */}
                    <div style={{
                        marginTop: '20px',
                        width: '100%',
                        height: '300px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <img
                            src={imageUrl}
                            alt="Fallback"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div style={{
                            display: 'none',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--muted-foreground)'
                        }}>
                            <div style={{ fontSize: '48px' }}>🖼️</div>
                            <div>Imagen no disponible</div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS para animación de loading */}
            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default SeadragonWrapper;

