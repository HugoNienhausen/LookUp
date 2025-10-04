import React from 'react';

const Modal = ({ isOpen, onClose, title, message, type = 'info' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return 'var(--primary)';
            case 'error':
                return 'var(--destructive)';
            case 'warning':
                return 'var(--accent)';
            default:
                return 'var(--primary)';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
                animation: 'fadeIn 0.2s ease-in-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                    animation: 'slideUp 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        fontSize: '48px',
                        textAlign: 'center',
                        marginBottom: '16px'
                    }}
                >
                    {getIcon()}
                </div>

                {title && (
                    <h3
                        style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: 'var(--foreground)',
                            textAlign: 'center',
                            marginBottom: '12px'
                        }}
                    >
                        {title}
                    </h3>
                )}

                <p
                    style={{
                        fontSize: '14px',
                        color: 'var(--muted-foreground)',
                        textAlign: 'center',
                        marginBottom: '24px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-line'
                    }}
                >
                    {message}
                </p>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: getColor(),
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.target.style.opacity = '1')}
                >
                    Got it
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Modal;

