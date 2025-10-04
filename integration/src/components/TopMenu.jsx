import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Menú superior con glassmorphism
 * Muestra logo, búsqueda de coordenadas, y perfil de usuario
 */
const TopMenu = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getRoleBadge = () => {
        if (!user) return null;
        const roleLabels = {
            user: 'Usuario',
            validator: 'Validador',
            agency: 'Agencia'
        };
        return roleLabels[user.role] || 'Usuario';
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 px-4 pt-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ zIndex: 1000 }}
        >
            <div
                className="top-menu-base"
                style={{
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    opacity: isHovered ? 0.95 : 0.3,
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    background: 'transparent',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Overlay sutil para mejorar legibilidad */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.15)',
                    pointerEvents: 'none',
                    zIndex: 1
                }} />

                {/* Contenido del topbar */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {/* Logo */}
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--primary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(108, 207, 246, 0.4)'
                        }}>
                            <span style={{
                                color: 'var(--primary-foreground)',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>L</span>
                        </div>
                        <div>
                            <h1 style={{
                                fontWeight: '600',
                                fontSize: '16px',
                                color: 'white',
                                margin: 0
                            }}>LookUp</h1>
                            <p style={{
                                fontSize: '10px',
                                color: 'var(--muted-foreground)',
                                opacity: 0.8,
                                margin: 0
                            }}>Explora • Anota • Valida</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={() => navigate('/')}
                            className="topbar-button"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            Challenges
                        </button>

                        {user?.role === 'validator' && (
                            <button
                                onClick={() => navigate('/validator')}
                                className="topbar-button"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                Validar
                            </button>
                        )}

                        {user?.role === 'agency' && (
                            <button
                                onClick={() => navigate('/agency')}
                                className="topbar-button"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                Agencia
                            </button>
                        )}
                    </div>

                    {/* User menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {user ? (
                            <div style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary-foreground)',
                                        fontWeight: 'bold'
                                    }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: 'white',
                                            fontWeight: '500'
                                        }}>{user.name}</div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'var(--muted-foreground)'
                                        }}>{getRoleBadge()} • {user.score || 0} pts</div>
                                    </div>
                                </div>

                                {showDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        background: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        minWidth: '200px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                        zIndex: 1001
                                    }}>
                                        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>
                                                {user.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setShowDropdown(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'white',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            Mi Perfil
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setShowDropdown(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'white',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="topbar-button"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="topbar-button"
                                    style={{
                                        background: 'var(--primary)',
                                        border: 'none',
                                        color: 'var(--primary-foreground)',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--accent)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'var(--primary)';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Registrarse
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopMenu;

