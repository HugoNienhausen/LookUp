import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopMenu = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const isHomePage = location.pathname === '/';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getRoleBadge = () => {
        if (!user) return null;
        const roleLabels = {
            explorer: 'Explorer',
            participant: 'Participant',
            validator: 'Validator',
            agency: 'Agency'
        };
        return roleLabels[user.role] || 'Explorer';
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 px-8 pt-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ zIndex: 1000 }}
        >
            <div
                className="top-menu-base"
                style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    opacity: isHomePage ? 0.92 : (isHovered ? 0.92 : 0.18),
                    transform: isHomePage ? 'translateY(-4px)' : (isHovered ? 'translateY(-4px)' : 'translateY(0)'),
                }}
            >
                {/* Logo */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(108, 207, 246, 0.4)'
                    }}>
                        <span style={{
                            color: 'var(--primary-foreground)',
                            fontWeight: 'bold',
                            fontSize: '20px'
                        }}>L</span>
                    </div>
                    <div>
                        <h1 style={{
                            fontWeight: '600',
                            fontSize: '18px',
                            color: 'white',
                            margin: 0
                        }}>LookUp</h1>
                        <p style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            opacity: 0.8,
                            margin: 0
                        }}>Explore • Annotate • Validate</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        Challenges
                    </button>

                    {user?.role === 'validator' && (
                        <button
                            onClick={() => navigate('/validator')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            Validate
                        </button>
                    )}

                    {user?.role === 'agency' && (
                        <button
                            onClick={() => navigate('/agency')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            Agency
                        </button>
                    )}
                </div>

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
                                        My Profile
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
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                style={{
                                    background: 'var(--primary)',
                                    border: 'none',
                                    color: 'var(--primary-foreground)',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopMenu;
