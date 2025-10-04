import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

/**
 * Página de Validador - Cola de validación
 * Muestra anotaciones pendientes para validar
 */
const Validator = () => {
    const { user } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        try {
            const data = await api.getValidationQueue();
            setQueue(data);
        } catch (error) {
            console.error('Error cargando cola:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (annotationId, decision) => {
        if (validating) return;

        setValidating(annotationId);

        try {
            await api.validateAnnotation(annotationId, user.id, decision, comment);
            alert(`Anotación ${decision === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
            setComment('');
            await loadQueue();
        } catch (error) {
            console.error('Error validando:', error);
            alert('Error al validar la anotación');
        } finally {
            setValidating(null);
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
                Cargando cola de validación...
            </div>
        );
    }

    return (
        <div style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'white'
        }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
                🛡️ Cola de Validación
            </h1>

            {queue.length === 0 ? (
                <div className="glass" style={{
                    padding: '60px',
                    textAlign: 'center',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                        No hay anotaciones pendientes
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                        Todas las anotaciones han sido validadas
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {queue.map(annotation => (
                        <div
                            key={annotation.id}
                            className="glass"
                            style={{
                                padding: '24px',
                                borderRadius: '12px',
                                border: validating === annotation.id ? '2px solid var(--primary)' : '1px solid var(--border)'
                            }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                                {/* Preview */}
                                <div>
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontSize: '48px'
                                    }}>
                                        🖼️
                                    </div>
                                    <div style={{
                                        marginTop: '12px',
                                        fontSize: '12px',
                                        color: 'var(--muted-foreground)'
                                    }}>
                                        Anotación ID: {annotation.id}
                                    </div>
                                </div>

                                {/* Info & Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                            Información de la Anotación
                                        </h3>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '12px',
                                            fontSize: '14px'
                                        }}>
                                            <div>
                                                <span style={{ color: 'var(--muted-foreground)' }}>Challenge:</span>{' '}
                                                <span>{annotation.challengeId}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--muted-foreground)' }}>Usuario:</span>{' '}
                                                <span>{annotation.userId}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--muted-foreground)' }}>Strokes:</span>{' '}
                                                <span>{annotation.strokes?.length || 0}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--muted-foreground)' }}>Fecha:</span>{' '}
                                                <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                            color: 'var(--muted-foreground)'
                                        }}>
                                            Comentario (opcional)
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Añade un comentario sobre esta anotación..."
                                            style={{
                                                width: '100%',
                                                minHeight: '80px',
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => handleValidate(annotation.id, 'approved')}
                                            disabled={validating === annotation.id}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                background: 'var(--primary)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'var(--primary-foreground)',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: validating === annotation.id ? 'not-allowed' : 'pointer',
                                                opacity: validating === annotation.id ? 0.6 : 1
                                            }}
                                        >
                                            ✓ Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleValidate(annotation.id, 'rejected')}
                                            disabled={validating === annotation.id}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                background: 'var(--destructive)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'var(--destructive-foreground)',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: validating === annotation.id ? 'not-allowed' : 'pointer',
                                                opacity: validating === annotation.id ? 0.6 : 1
                                            }}
                                        >
                                            ✗ Rechazar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Validator;

