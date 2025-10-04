import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToolboxProvider } from '../context/ToolboxContext';
import * as api from '../lib/api';
import SeadragonWrapper from '../components/SeadragonWrapper';
import CanvasOverlay from '../components/CanvasOverlay';
import MinimalToolbox from '../components/MinimalToolbox';
import ZoomControls from '../components/ZoomControls';
import CoordinateNavigator from '../components/CoordinateNavigator';
import { getViewer, getZoom, panTo, isViewerReady } from '../lib/seadragon-loader';

/**
 * Página de Challenge - Viewer + Anotación
 * Combina SeadragonWrapper, CanvasOverlay y MinimalToolbox
 */
const Challenge = () => {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPromotion, setShowPromotion] = useState(false);
    const [savedViewport, setSavedViewport] = useState(null);

    useEffect(() => {
        loadChallenge();
    }, [id]);

    // Restaurar viewport cuando la imagen esté lista
    useEffect(() => {
        if (challenge && savedViewport) {
            // Esperar un poco para que la imagen se cargue completamente
            const timer = setTimeout(() => {
                restoreViewport();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [currentImageIndex, challenge, savedViewport]);

    const loadChallenge = async () => {
        try {
            setLoading(true);
            const data = await api.getChallenge(id);
            setChallenge(data);
        } catch (error) {
            console.error('Error cargando challenge:', error);
            alert('Error al cargar el challenge');
        } finally {
            setLoading(false);
        }
    };

    // Guardar viewport actual
    const saveCurrentViewport = () => {
        if (isViewerReady()) {
            const viewer = getViewer();
            if (viewer) {
                const viewport = viewer.viewport;
                const center = viewport.getCenter();
                const zoom = viewport.getZoom();
                const bounds = viewport.getBounds();
                setSavedViewport({ center, zoom, bounds });
                console.log('💾 Viewport guardado:', { center, zoom, bounds });
            }
        }
    };

    // Restaurar viewport guardado
    const restoreViewport = () => {
        if (savedViewport && isViewerReady()) {
            const viewer = getViewer();
            if (viewer) {
                const viewport = viewer.viewport;

                // Usar fitBounds si está disponible, sino usar center y zoom
                if (savedViewport.bounds) {
                    viewport.fitBounds(savedViewport.bounds);
                } else {
                    viewport.zoomTo(savedViewport.zoom);
                    viewport.panTo(savedViewport.center);
                }

                console.log('🔄 Viewport restaurado:', savedViewport);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentImage = challenge.images[currentImageIndex];

            // Obtener datos del canvas
            const canvas = document.querySelector('canvas');
            if (!canvas) {
                alert('No hay canvas para guardar');
                return;
            }

            const annotationData = {
                challengeId: id,
                imageId: currentImage.id,
                userId: user.id,
                canvasData: canvas.toDataURL(),
                meta: {
                    timestamp: new Date().toISOString()
                }
            };

            const result = await api.createAnnotation(annotationData);

            // Actualizar usuario local
            if (result.userUpdates) {
                updateUser(result.userUpdates);

                // Mostrar promoción si cambió el rol
                if (result.userUpdates.role === 'validator') {
                    setShowPromotion(true);
                    setTimeout(() => setShowPromotion(false), 5000);
                }
            }

            alert('Anotación guardada correctamente');
        } catch (error) {
            console.error('Error guardando anotación:', error);
            alert('Error al guardar la anotación');
        } finally {
            setSaving(false);
        }
    };

    const nextImage = () => {
        if (challenge && currentImageIndex < challenge.images.length - 1) {
            // Guardar viewport actual antes de cambiar imagen
            saveCurrentViewport();
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            // Guardar viewport actual antes de cambiar imagen
            saveCurrentViewport();
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--background)',
                color: 'var(--foreground)'
            }}>
                <div>Cargando challenge...</div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--background)',
                color: 'var(--foreground)'
            }}>
                <div>Challenge no encontrado</div>
            </div>
        );
    }

    const currentImage = challenge.images[currentImageIndex];

    return (
        <ToolboxProvider>
            <div style={{
                width: '100%',
                height: '100%',
                background: 'var(--background)',
                color: 'var(--foreground)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Header con información */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(44, 53, 49, 0.9)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    zIndex: 1000,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        {challenge.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        Imagen {currentImageIndex + 1} de {challenge.images.length}
                    </div>
                </div>

                {/* Controles de navegación */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(44, 53, 49, 0.9)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                }}>
                    <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        style={{
                            padding: '8px 12px',
                            background: currentImageIndex === 0 ? 'rgba(255, 255, 255, 0.1)' : 'var(--primary)',
                            border: 'none',
                            borderRadius: '6px',
                            color: currentImageIndex === 0 ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                            cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        ← Anterior
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'var(--accent-foreground)',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        {saving ? 'Guardando...' : '💾 Guardar'}
                    </button>

                    <button
                        onClick={nextImage}
                        disabled={currentImageIndex === challenge.images.length - 1}
                        style={{
                            padding: '8px 12px',
                            background: currentImageIndex === challenge.images.length - 1 ? 'rgba(255, 255, 255, 0.1)' : 'var(--primary)',
                            border: 'none',
                            borderRadius: '6px',
                            color: currentImageIndex === challenge.images.length - 1 ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                            cursor: currentImageIndex === challenge.images.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        Siguiente →
                    </button>
                </div>

                {/* Viewer + Canvas */}
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <SeadragonWrapper
                        imageUrl={currentImage.dziUrl || currentImage.url}
                        showNavigator={true}
                        onReady={() => {
                            console.log('✅ Viewer listo para anotaciones');
                            // Restaurar viewport si está guardado
                            if (savedViewport) {
                                setTimeout(() => {
                                    restoreViewport();
                                }, 500);
                            }
                        }}
                    />
                    <CanvasOverlay />
                </div>

                {/* Toolbox */}
                <MinimalToolbox />

                {/* Zoom Controls */}
                <ZoomControls />

                {/* Coordinate Navigator */}
                <CoordinateNavigator />

                {/* Promoción */}
                {showPromotion && (
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'var(--accent)',
                        color: 'var(--accent-foreground)',
                        padding: '20px 30px',
                        borderRadius: '12px',
                        zIndex: 10000,
                        fontSize: '16px',
                        fontWeight: '500',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
                    }}>
                        🎉 ¡Promocionado a Validator!
                    </div>
                )}
            </div>
        </ToolboxProvider>
    );
};

export default Challenge;