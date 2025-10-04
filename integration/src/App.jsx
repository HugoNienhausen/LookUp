import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToolboxProvider } from './context/ToolboxContext';
import TopMenu from './components/TopMenu';
import Home from './routes/Home';
import Login from './routes/Login';
import Register from './routes/Register';
import Challenge from './routes/Challenge';
import Validator from './routes/Validator';
import Agency from './routes/Agency';
import Profile from './routes/Profile';

/**
 * Componente principal de la aplicación
 * Maneja el enrutamiento y la estructura general
 */
function App() {
    const { user } = useAuth();

    return (
        <ToolboxProvider>
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <TopMenu />

                <main style={{
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    height: '100vh'
                }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/challenge/:id"
                            element={user ? <Challenge /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/validator"
                            element={user?.role === 'validator' || user?.role === 'agency' ? <Validator /> : <Navigate to="/" />}
                        />
                        <Route
                            path="/agency"
                            element={user?.role === 'agency' ? <Agency /> : <Navigate to="/" />}
                        />
                        <Route
                            path="/profile"
                            element={user ? <Profile /> : <Navigate to="/login" />}
                        />
                    </Routes>
                </main>
            </div>
        </ToolboxProvider>
    );
}

export default App;

