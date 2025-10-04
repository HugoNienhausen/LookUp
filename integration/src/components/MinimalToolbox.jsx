import React, { useState, useEffect } from 'react';
import { useToolbox } from '../context/ToolboxContext';
import { useDraggable } from '../hooks/useDraggable';
import { PiPaintBrush, PiArrowsOut, PiWrench, PiTrash } from 'react-icons/pi';
import ConfirmModal from './ConfirmModal';

const MinimalToolbox = () => {
    const {
        selectedTool,
        setSelectedTool,
        brushSize,
        setBrushSize,
        brushOpacity,
        setBrushOpacity
    } = useToolbox();

    const [isMinimized, setIsMinimized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [strokeCount, setStrokeCount] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Actualizar contador de trazos
    useEffect(() => {
        const updateStrokeCount = () => {
            const strokes = window.__annotationStrokes || [];
            setStrokeCount(strokes.length);
        };

        // Actualizar cada segundo
        const interval = setInterval(updateStrokeCount, 500);
        updateStrokeCount(); // Inicial

        return () => clearInterval(interval);
    }, []);

    // Hook para hacer el toolbox arrastrable
    const initialX = window.innerWidth > 300 ? window.innerWidth - 260 : 20;
    const { elementRef, draggableStyle, handleMouseDown } = useDraggable('minimal-toolbox', { x: initialX, y: 100 });

    const tools = [
        { id: 'brush', label: 'Brush', icon: PiPaintBrush },
        { id: 'move', label: 'Move', icon: PiArrowsOut }
    ];

    const handleClear = () => {
        if (strokeCount === 0) {
            return; // No hay nada que limpiar
        }

        setShowConfirmModal(true);
    };

    const confirmClear = () => {
        if (window.clearCanvas) {
            window.clearCanvas();
            setStrokeCount(0);
        }
    };

    if (isMinimized) {
        return (
            <div
                ref={elementRef}
                className="widget-base widget-minimized"
                style={{
                    ...draggableStyle,
                    cursor: 'pointer',
                    background: isHovered ? 'var(--widget-bg-hover)' : 'var(--widget-bg-idle)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--widget-border)',
                    transition: 'all 0.18s ease',
                    zIndex: 10001
                }}
                onClick={() => setIsMinimized(false)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={handleMouseDown}
            >
                <PiWrench size={24} color="white" />
            </div>
        );
    }

    return (
        <div
            ref={elementRef}
            className="widget-base"
            style={{
                ...draggableStyle,
                background: isHovered ? 'var(--widget-bg-hover)' : 'var(--widget-bg-idle)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid var(--widget-border)',
                borderRadius: '12px',
                padding: '16px',
                minWidth: '200px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.18s ease',
                zIndex: 10001
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
                    }}>Tools</h3>
                    {strokeCount > 0 && (
                        <span style={{
                            background: '#6ccff6',
                            color: '#000',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                        }}>
                            {strokeCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(true);
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px',
                        pointerEvents: 'auto',
                        zIndex: 10
                    }}
                    title="Minimize"
                >
                    ─
                </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setSelectedTool(tool.id)}
                            style={{
                                padding: '8px 12px',
                                background: selectedTool === tool.id ? 'var(--primary)' : 'transparent',
                                border: `1px solid ${selectedTool === tool.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.2)'}`,
                                borderRadius: '6px',
                                color: selectedTool === tool.id ? 'var(--primary-foreground)' : 'var(--foreground)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <tool.icon size={16} />
                            <span>{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {(selectedTool === 'brush' || selectedTool === 'erase') && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>
                        {selectedTool === 'brush' ? 'Brush' : 'Eraser'}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            marginBottom: '4px'
                        }}>
                            Size: {brushSize}px
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="50"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '2px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    <div>
                        <div style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            marginBottom: '4px'
                        }}>
                            Opacity: {Math.round(brushOpacity * 100)}%
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={brushOpacity}
                            onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                            style={{
                                width: '100%',
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '2px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                </div>
            )}

            <div>
                <button
                    onClick={handleClear}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(212, 24, 61, 0.2)',
                        border: '1px solid rgba(212, 24, 61, 0.3)',
                        borderRadius: '6px',
                        color: '#d4183d',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <PiTrash size={14} />
                    Clear Canvas
                </button>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmClear}
                title="Delete strokes?"
                message={`${strokeCount} ${strokeCount === 1 ? 'stroke' : 'strokes'} will be deleted. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

export default MinimalToolbox;
