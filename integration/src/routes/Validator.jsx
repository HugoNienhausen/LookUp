import React, { useEffect, useState, memo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import SeadragonWrapper from '../components/SeadragonWrapper';
import AnnotationViewer from '../components/AnnotationViewer';
import Modal from '../components/Modal';

const AnnotationItem = memo(({ annotation, validating, comment, onCommentChange, onValidate }) => {
    return (
        <div
            className="glass"
            style={{
                padding: '24px',
                borderRadius: '12px',
                border: validating === annotation.id ? '2px solid var(--primary)' : '1px solid var(--border)'
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '300px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        {annotation.dziUrl ? (
                            <>
                                <SeadragonWrapper
                                    imageUrl={annotation.dziUrl}
                                    showNavigator={false}
                                    onReady={() => console.log('Viewer ready for validation')}
                                />
                                <AnnotationViewer 
                                    annotations={annotation.annotations || []} 
                                    showControls={true}
                                />
                            </>
                        ) : (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                fontSize: '48px'
                            }}>
                                🖼️
                            </div>
                        )}
                    </div>
                    <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)'
                    }}>
                        Annotation ID: {annotation.id}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            Annotation Information
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            fontSize: '14px'
                        }}>
                            <div>
                                <span style={{ color: 'var(--muted-foreground)' }}>Challenge:</span>{' '}
                                <span>{annotation.challengeId || 'N/A'}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--muted-foreground)' }}>User:</span>{' '}
                                <span>{annotation.userName || annotation.userId}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--muted-foreground)' }}>Annotations:</span>{' '}
                                <span>{annotation.annotations?.length || 0}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--muted-foreground)' }}>Date:</span>{' '}
                                <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            marginBottom: '8px',
                            color: 'var(--muted-foreground)'
                        }}>
                            Comment (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => onCommentChange(annotation.id, e.target.value)}
                            placeholder="Add a comment about this annotation..."
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

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => onValidate(annotation.id, 'approved')}
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
                            ✓ Approve
                        </button>
                        <button
                            onClick={() => onValidate(annotation.id, 'rejected')}
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
                            ✗ Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    const prevIsValidating = prevProps.validating === prevProps.annotation.id;
    const nextIsValidating = nextProps.validating === nextProps.annotation.id;
    
    return (
        prevProps.annotation.id === nextProps.annotation.id &&
        prevProps.comment === nextProps.comment &&
        prevIsValidating === nextIsValidating
    );
});

AnnotationItem.displayName = 'AnnotationItem';

const Validator = () => {
    const { user } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(null);
    const [comments, setComments] = useState({});
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showModal = useCallback((title, message, type = 'info') => {
        setModal({ isOpen: true, title, message, type });
    }, []);

    const closeModal = useCallback(() => {
        setModal({ isOpen: false, title: '', message: '', type: 'info' });
    }, []);

    const loadQueue = useCallback(async () => {
        try {
            const data = await api.getValidationQueue();
            setQueue(data);
        } catch (error) {
            console.error('Error loading queue:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQueue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Callback memoizado para cambio de comentario
    const handleCommentChange = useCallback((annotationId, value) => {
        setComments(prev => ({
            ...prev,
            [annotationId]: value
        }));
    }, []);

    const handleValidate = useCallback(async (annotationId, decision) => {
        if (validating) return;

        setValidating(annotationId);

        try {
            // El backend extrae validator_id del token JWT automáticamente
            // Usamos una función de actualización para obtener el comentario actual
            let currentComment = '';
            setComments(prev => {
                currentComment = prev[annotationId] || '';
                return prev;
            });
            
            await api.validateAnnotation(annotationId, null, decision, currentComment);
            showModal(
                'Success!', 
                `Annotation ${decision === 'approved' ? 'approved' : 'rejected'} successfully`,
                'success'
            );
            setComments(prev => {
                const newComments = { ...prev };
                delete newComments[annotationId];
                return newComments;
            });
            await loadQueue();
        } catch (error) {
            console.error('Error validating:', error);
            const errorMsg = error.response?.data?.error || 'Error validating annotation';
            showModal('Error', errorMsg, 'error');
        } finally {
            setValidating(null);
        }
    }, [validating, showModal, loadQueue]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'white'
            }}>
                Loading validation queue...
            </div>
        );
    }

    return (
        <div style={{
            padding: '40px',
            paddingBottom: '80px',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'white',
            minHeight: '100%'
        }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
                🛡️ Validation Queue
            </h1>

            {queue.length === 0 ? (
                <div className="glass" style={{
                    padding: '60px',
                    textAlign: 'center',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                        No pending annotations
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '8px' }}>
                        All annotations have been validated
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {queue.map(annotation => (
                        <AnnotationItem
                            key={annotation.id}
                            annotation={annotation}
                            validating={validating}
                            comment={comments[annotation.id] || ''}
                            onCommentChange={handleCommentChange}
                            onValidate={handleValidate}
                        />
                    ))}
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
    );
};

export default Validator;

