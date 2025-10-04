import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import SeadragonWrapper from '../components/SeadragonWrapper';
import Toolbox from '../components/Toolbox';

/**
 * Página de Challenge - Viewer + Anotación
 * Combina SeadragonWrapper, Annotorious y Toolbox
 */
const Challenge = () => {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPromotion, setShowPromotion] = useState(false);
    const [annotorious, setAnnotorious] = useState(null);
    const [annotations, setAnnotations] = useState([]);

    // Estado del toolbox
    const [selectedTool, setSelectedTool] = useState('select');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Handlers para Annotorious
    const handleAnnotoriousReady = (anno) => {
        console.log('🎨 Annotorious listo en Challenge');
        setAnnotorious(anno);

        // Configurar eventos sin interferir con el viewport
        anno.on('createAnnotation', (annotation) => {
            console.log('📝 Nueva anotación creada:', annotation);
            setAnnotations(prev => [...prev, annotation]);

            // Después de crear, volver automáticamente al modo selección
            setTimeout(() => {
                setSelectedTool('select');
                anno.setDrawingTool(null);
                const viewer = window.viewer || window.__osdViewer;
                if (viewer) {
                    viewer.setMouseNavEnabled(true);
                    viewer.outerTracker.setTracking(true);
                }
                console.log('🔄 Volviendo al modo selección automáticamente');
            }, 100);
        });

        anno.on('updateAnnotation', (annotation, previous) => {
            console.log('✏️ Anotación actualizada:', annotation);
            setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a));
        });

        anno.on('deleteAnnotation', (annotation) => {
            console.log('🗑️ Anotación eliminada:', annotation);
            setAnnotations(prev => prev.filter(a => a.id !== annotation.id));
        });

        // Evento cuando se cancela una anotación (restaurar pan)
        anno.on('cancelAnnotation', () => {
            console.log('❌ Anotación cancelada - restaurando navegación');
            const viewer = window.viewer || window.__osdViewer;
            if (viewer) {
                viewer.setMouseNavEnabled(true);
                viewer.outerTracker.setTracking(true);
            }
        });
    };

    useEffect(() => {
        loadChallenge();
    }, [id]);

    // Actualizar can undo/redo
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.canvasOverlayCanUndo) {
                setCanUndo(window.canvasOverlayCanUndo());
            }
            if (window.canvasOverlayCanRedo) {
                setCanRedo(window.canvasOverlayCanRedo());
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const loadChallenge = async () => {
        try {
            const data = await api.getChallenge(id);
            setChallenge(data);
        } catch (error) {
            console.error('Error cargando challenge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (annotations.length === 0) {
            alert('No hay anotaciones para guardar');
            return;
        }

        setSaving(true);

        try {
            const currentImage = challenge.images[currentImageIndex];

            const annotationData = {
                challengeId: id,
                imageId: currentImage.id,
                userId: user.id,
                annotations: annotations,
                meta: {
                    tool: 'annotorious',
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

            alert('¡Anotación guardada exitosamente!');
            setStrokes([]);

        } catch (error) {
            console.error('Error guardando anotación:', error);
            alert('Error al guardar la anotación');
        } finally {
            setSaving(false);
        }
    };

    const handleUndo = () => {
        if (window.canvasOverlayUndo) {
            window.canvasOverlayUndo();
        }
    };

    const handleRedo = () => {
        if (window.canvasOverlayRedo) {
            window.canvasOverlayRedo();
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'white'
            }}>
                Cargando challenge...
            </div>
        );
    }

    if (!challenge) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'white'
            }}>
                Challenge no encontrado
            </div>
        );
    }

    const currentImage = challenge.images[currentImageIndex];

    return (
        <div style={{ position: 'relative', height: 'calc(100vh - 80px)' }}>
            {/* Promotion banner */}
            {showPromotion && (
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    color: 'var(--primary-foreground)',
                    padding: '20px 40px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 2000,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    animation: 'slideDown 0.5s ease'
                }}>
                    🎉 ¡Felicidades! Ahora eres Validador
                </div>
            )}

            {/* Info panel */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 100,
                background: 'rgba(44, 53, 49, 0.92)',
                backdropFilter: 'blur(6px)',
                padding: '20px',
                borderRadius: '12px',
                maxWidth: '300px',
                border: '1px solid var(--border)'
            }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'white'
                }}>
                    {challenge.title}
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--muted-foreground)',
                    marginBottom: '16px'
                }}>
                    {challenge.description}
                </p>

                {/* Image selector */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        display: 'block',
                        marginBottom: '8px'
                    }}>
                        Imagen {currentImageIndex + 1} de {challenge.images.length}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {challenge.images.map((img, idx) => (
                            <button
                                key={img.id}
                                onClick={() => setCurrentImageIndex(idx)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: idx === currentImageIndex ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    borderRadius: '6px',
                                    background: idx === currentImageIndex ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '12px'
                }}>
                    <div style={{ color: 'var(--muted-foreground)' }}>Anotaciones: {annotations.length}</div>
                    <div style={{ color: 'var(--muted-foreground)' }}>Herramienta: {selectedTool}</div>
                </div>
            </div>

            {/* Viewer con Annotorious */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <SeadragonWrapper
                    imageUrl={currentImage.dziUrl || currentImage.url}
                    showNavigator={true}
                    onReady={() => console.log('✅ Viewer listo para anotaciones')}
                    onAnnotoriousReady={handleAnnotoriousReady}
                />
            </div>

            {/* Toolbox */}
            <Toolbox
                selectedTool={selectedTool}
                onToolSelect={setSelectedTool}
                onSave={handleSave}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                annotorious={annotorious}
            />

            {/* Saving overlay */}
            {saving && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3000,
                    color: 'white',
                    fontSize: '20px'
                }}>
                    Guardando anotación...
                </div>
            )}
        </div>
    );
};

export default Challenge;

