import React, { useState, useEffect } from 'react';
import {
    zoomIn,
    zoomOut,
    getViewer,
    panTo,
    getZoom,
    isViewerReady
} from '../lib/seadragon-loader';
import { useDraggable } from '../hooks/useDraggable';
import {
    Brush,
    Eraser,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    RotateCw,
    Save,
    Download,
    Settings,
    Eye,
    EyeOff,
    Minus,
    Plus,
    Palette,
    Layers,
    Move
} from 'lucide-react';

/**
 * Toolbox widget flotante
 * Combina herramientas, controles de brush, zoom y acciones
 */
const Toolbox = ({
    selectedTool,
    onToolSelect,
    brushSize,
    brushOpacity,
    onBrushSizeChange,
    onBrushOpacityChange,
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState('tools');
    const [currentZoom, setCurrentZoom] = useState(1);
    const [viewerReady, setViewerReady] = useState(false);

    // Hook para hacer el toolbox arrastrable
    const { elementRef, draggableStyle, handleMouseDown } = useDraggable('toolbox', { x: window.innerWidth - 320, y: 120 });

    // Actualizar estado del viewer
    useEffect(() => {
        const checkViewer = () => {
            const ready = isViewerReady();
            setViewerReady(ready);
            if (ready) {
                setCurrentZoom(getZoom());
            }
        };

        checkViewer();
        const interval = setInterval(checkViewer, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handlers mejorados con logging
    const handleToolSelect = (toolId) => {
        console.log('🛠️ Toolbox: Seleccionando herramienta:', toolId);
        onToolSelect(toolId);
    };

    const handleZoomIn = () => {
        console.log('🔍 Toolbox: Zoom in');
        zoomIn();
        setTimeout(() => setCurrentZoom(getZoom()), 100);
    };

    const handleZoomOut = () => {
        console.log('🔍 Toolbox: Zoom out');
        zoomOut();
        setTimeout(() => setCurrentZoom(getZoom()), 100);
    };

    const handleGoToCoordinate = (lat, lon) => {
        console.log('📍 Toolbox: Navegando a coordenadas:', lat, lon);
        // Convertir coordenadas geográficas a normalizadas (ejemplo)
        const x = (lon + 180) / 360; // Normalizar longitud
        const y = (90 - lat) / 180;  // Normalizar latitud
        panTo(x, y);
    };

    const tools = [
        { id: 'brush', icon: Brush, name: 'Pincel' },
        { id: 'eraser', icon: Eraser, name: 'Borrar' },
        { id: 'move', icon: Move, name: 'Mover' }
    ];

    if (isMinimized) {
        return (
            <div
                className="widget-base widget-minimized"
                style={{
                    position: 'fixed',
                    right: '24px',
                    top: '120px',
                    cursor: 'pointer',
                    background: 'var(--widget-bg-idle)'
                }}
                onClick={() => setIsMinimized(false)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <span style={{ fontSize: '24px' }}>🛠️</span>
            </div>
        );
    }

    return (
        <div
            ref={elementRef}
            className="widget-base"
            style={{
                ...draggableStyle,
                width: '280px',
                background: isHovered ? 'var(--widget-bg-hover)' : 'var(--widget-bg-idle)',
                padding: '16px',
                pointerEvents: 'auto', // Asegurar que reciba eventos
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid var(--widget-border)',
                borderRadius: '16px',
                transition: 'all 0.18s ease'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div
                className="widget-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    cursor: 'grab'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>Toolbox</h3>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: viewerReady ? '#22c55e' : '#ef4444',
                        animation: viewerReady ? 'none' : 'pulse 2s infinite'
                    }} />
                </div>
                <button
                    onClick={() => setIsMinimized(true)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    ─
                </button>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border)'
            }}>
                <button
                    onClick={() => setActiveTab('tools')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: activeTab === 'tools' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'tools' ? 'var(--primary-foreground)' : 'white',
                        border: 'none',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    Herramientas
                </button>
                <button
                    onClick={() => setActiveTab('controls')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: activeTab === 'controls' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'controls' ? 'var(--primary-foreground)' : 'white',
                        border: 'none',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    Controles
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'tools' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Tools grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {tools.map(tool => {
                            const IconComponent = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    style={{
                                        padding: '16px 8px',
                                        background: selectedTool === tool.id
                                            ? 'var(--primary)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        border: selectedTool === tool.id
                                            ? '2px solid var(--primary)'
                                            : '1px solid var(--border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: selectedTool === tool.id
                                            ? 'var(--primary-foreground)'
                                            : 'white',
                                        fontSize: '24px'
                                    }}
                                >
                                    <IconComponent size={20} />
                                    <span style={{ fontSize: '10px' }}>{tool.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Brush controls */}
                    {selectedTool === 'brush' && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div>
                                <label style={{
                                    fontSize: '12px',
                                    color: 'var(--muted-foreground)',
                                    display: 'block',
                                    marginBottom: '4px'
                                }}>
                                    Tamaño: {brushSize}px
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={brushSize}
                                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    fontSize: '12px',
                                    color: 'var(--muted-foreground)',
                                    display: 'block',
                                    marginBottom: '4px'
                                }}>
                                    Opacidad: {Math.round(brushOpacity * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    value={brushOpacity}
                                    onChange={(e) => onBrushOpacityChange(Number(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'controls' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Zoom controls */}
                    <div>
                        <label style={{
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            display: 'block',
                            marginBottom: '8px'
                        }}>
                            Zoom
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleZoomOut}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={handleZoomIn}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Undo/Redo */}
                    <div>
                        <label style={{
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            display: 'block',
                            marginBottom: '8px'
                        }}>
                            Historial
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: canUndo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: canUndo ? 'white' : 'var(--muted-foreground)',
                                    cursor: canUndo ? 'pointer' : 'not-allowed',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                }}
                            >
                                <RotateCcw size={14} />
                                Deshacer
                            </button>
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: canRedo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: canRedo ? 'white' : 'var(--muted-foreground)',
                                    cursor: canRedo ? 'pointer' : 'not-allowed',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                }}
                            >
                                <RotateCw size={14} />
                                Rehacer
                            </button>
                        </div>
                    </div>

                    {/* Save button */}
                    <button
                        onClick={onSave}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--primary)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--primary-foreground)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={16} />
                        Guardar Anotación
                    </button>
                </div>
            )}

            {/* CSS para animaciones */}
            <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
};

export default Toolbox;

