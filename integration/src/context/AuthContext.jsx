import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../lib/api';

const AuthContext = createContext(null);

/**
 * Hook personalizado para acceder al contexto de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

/**
 * Provider de autenticación
 * Maneja login, logout, registro y estado del usuario
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario desde localStorage al iniciar
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    /**
     * Iniciar sesión con email y password
     */
    const login = async (email, password) => {
        try {
            const userData = await api.login(email, password);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    /**
     * Registrar nuevo usuario
     */
    const register = async (name, email, password) => {
        try {
            const userData = await api.register(name, email, password);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    /**
     * Cerrar sesión
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    /**
     * Actualizar datos del usuario (ej: después de promoción a validator)
     */
    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser
    };

    if (loading) {
        return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--foreground)'
        }}>
            Cargando...
        </div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

