import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Página de login
 */
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }

        setLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 80px)',
            padding: '40px'
        }}>
            <div className="glass" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                borderRadius: '16px'
            }}>
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    Iniciar Sesión
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--muted-foreground)',
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    Ingresa tus credenciales para continuar
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            color: 'white',
                            marginBottom: '8px',
                            fontWeight: '500'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            color: 'white',
                            marginBottom: '8px',
                            fontWeight: '500'
                        }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(212, 24, 61, 0.1)',
                            border: '1px solid var(--destructive)',
                            borderRadius: '8px',
                            color: 'var(--destructive)',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--primary)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--primary-foreground)',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: 'var(--muted-foreground)'
                }}>
                    ¿No tienes cuenta?{' '}
                    <span
                        onClick={() => navigate('/register')}
                        style={{
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Regístrate aquí
                    </span>
                </div>

                {/* Demo credentials */}
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(108, 207, 246, 0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>
                        Credenciales de prueba:
                    </div>
                    <div>Usuario: ana@example.com / demo123</div>
                    <div>Validador: carlos@example.com / demo123</div>
                    <div>Agencia: maria@example.com / demo123</div>
                </div>
            </div>
        </div>
    );
};

export default Login;

