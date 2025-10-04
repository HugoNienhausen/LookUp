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
import Modal from '../components/Modal';
import { getViewer, getZoom, panTo, isViewerReady } from '../lib/seadragon-loader';
import { PiFloppyDisk, PiClipboardText } from 'react-icons/pi';

const Challenge = () => {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPromotion, setShowPromotion] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [isInfoMinimized, setIsInfoMinimized] = useState(false);

    useEffect(() => {
        loadChallenge();
    }, [id]);

    const showModal = (title, message, type = 'info') => {
        setModal({ isOpen: true, title, message, type });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: '', message: '', type: 'info' });
    };

    const loadChallenge = async () => {
        try {
            setLoading(true);
            const data = await api.getChallenge(id);
            setChallenge(data);
        } catch (error) {
            console.error('Error loading challenge:', error);
            showModal('Error', 'Could not load the challenge', 'error');
        } finally{
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentImage = challenge.images[currentImageIndex];

            const rawAnnotations = window.getAnnotationsData ? window.getAnnotationsData() : [];
            
            const annotations = rawAnnotations.filter(s => 
                s && 
                s.points && 
                Array.isArray(s.points) && 
                s.points.length > 0 &&
                s.points.every(p => p !== null && p !== undefined)
            );
            
            if (!annotations || annotations.length === 0) {
                showModal('No annotations', 'You have not drawn any valid annotations. Use the brush to mark areas of interest.', 'warning');
                setSaving(false);
                return;
            }

            console.log('📤 Sending annotations:', {
                cantidad: annotations.length,
                puntosTotales: annotations.reduce((sum, s) => sum + s.points.length, 0)
            });

            const annotationData = {
                imageId: currentImage.id,
                annotations: annotations,
                metadata: {
                    timestamp: new Date().toISOString(),
                    imageIndex: currentImageIndex,
                    challengeId: id,
                    imageUrl: currentImage.dziUrl || currentImage.url,
                    totalStrokes: annotations.length,
                    totalPoints: annotations.reduce((sum, s) => sum + s.points.length, 0)
                }
            };

            const result = await api.createAnnotation(annotationData);

            if (window.clearCanvas) {
                window.clearCanvas();
            }

            // Actualizar usuario local si hubo promoción
            if (result.userUpdates) {
                updateUser(result.userUpdates);

                // Mostrar promoción si cambió el rol
                if (result.userUpdates.role === 'validator') {
                    setShowPromotion(true);
                    setTimeout(() => setShowPromotion(false), 5000);
                }
            }

            showModal('Success!', `Annotation saved successfully\n${annotations.length} strokes saved`, 'success');
        } catch (error) {
            console.error('Error saving annotation:', error);
            const errorMsg = error.response?.data?.error || 'Error saving annotation';
            showModal('Error', errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const nextImage = () => {
        if (challenge && currentImageIndex < challenge.images.length - 1) {
            // Limpiar canvas antes de cambiar imagen
            if (window.clearCanvas) {
                window.clearCanvas();
            }
            // Resetear zoom
            if (isViewerReady()) {
                const viewer = getViewer();
                if (viewer) {
                    viewer.viewport.goHome(false);
                }
            }
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            if (window.clearCanvas) {
                window.clearCanvas();
            }
            if (isViewerReady()) {
                const viewer = getViewer();
                if (viewer) {
                    viewer.viewport.goHome(false);
                }
            }
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
                <div>Loading challenge...</div>
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
                <div>Challenge not found</div>
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
                {isInfoMinimized ? (
                    // Versión minimizada
                    <div 
                        onClick={() => setIsInfoMinimized(false)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            background: 'rgba(44, 53, 49, 0.9)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            zIndex: 1000,
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(44, 53, 49, 1)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(44, 53, 49, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <PiClipboardText size={18} color="white" />
                        <div style={{ fontSize: '12px', fontWeight: '500', opacity: 0.8 }}>
                            {currentImageIndex + 1}/{challenge.images.length}
                        </div>
                    </div>
                ) : (
                    // Versión expandida
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'rgba(44, 53, 49, 0.9)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        zIndex: 1000,
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                        maxWidth: '280px',
                        transition: 'all 0.2s ease'
                    }}>
                        {/* Botón minimizar */}
                        <button
                            onClick={() => setIsInfoMinimized(true)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted-foreground)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = 'var(--foreground)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--muted-foreground)';
                            }}
                        >
                            ─
                        </button>

                        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', paddingRight: '24px' }}>
                            {challenge.title || challenge.name}
                        </div>
                        
                        {challenge.description && (
                            <div style={{ 
                                fontSize: '12px', 
                                color: 'var(--muted-foreground)', 
                                marginBottom: '8px',
                                lineHeight: '1.5',
                                opacity: 0.95
                            }}>
                                {challenge.description}
                            </div>
                        )}
                        
                        <div style={{ 
                            fontSize: '11px', 
                            color: 'var(--muted-foreground)', 
                            opacity: 0.7,
                            paddingTop: '4px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            Image {currentImageIndex + 1} of {challenge.images.length}
                        </div>
                    </div>
                )}

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
                        ← Previous
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
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {saving ? (
                            'Saving...'
                        ) : (
                            <>
                                <PiFloppyDisk size={16} />
                                Save
                            </>
                        )}
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
                        Next →
                    </button>
                </div>

                {/* Viewer + Canvas */}
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <SeadragonWrapper
                        imageUrl={currentImage.dziUrl || currentImage.url}
                        showNavigator={true}
                        onReady={() => {
                            console.log('✅ Viewer listo para anotaciones');
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
                        🎉 Promoted to Validator!
                    </div>
                )}

                {/* Modal */}
                <Modal
                    isOpen={modal.isOpen}
                    onClose={closeModal}
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                />
            </div>
        </ToolboxProvider>
    );
};

export default Challenge;