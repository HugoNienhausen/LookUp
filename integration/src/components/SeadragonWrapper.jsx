import React, { useEffect, useRef, useState } from 'react';
import { initSeadragon, destroyViewer, isViewerReady } from '../lib/seadragon-loader';
import Minimap from './Minimap';

/**
 * Wrapper del viewer OpenSeadragon usando el nuevo loader encapsulado
 * Inicializa el viewer y maneja fallbacks
 */
const SeadragonWrapper = ({ imageUrl, onReady, showNavigator = true }) => {
    const containerRef = useRef(null);
    const navigatorRef = useRef(null);
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
            destroyViewer();
        };
    }, [imageUrl, onReady, showNavigator]);

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

            {/* Minimapa personalizado */}
            {showNavigator && isReady && <Minimap />}

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

        </div>
    );
};

export default SeadragonWrapper;

