import React, { useState, useEffect } from 'react';
import { getViewer, isViewerReady, getZoom } from '../lib/seadragon-loader';
import { useDraggable } from '../hooks/useDraggable';

const ZoomControls = () => {
    const [currentZoom, setCurrentZoom] = useState(1);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Hook para hacer los controles de zoom arrastrables
    const { elementRef, draggableStyle, handleMouseDown } = useDraggable('zoom-controls', { x: window.innerWidth - 80, y: window.innerHeight - 200 });

    useEffect(() => {
        const updateZoom = () => {
            if (isViewerReady()) {
                setCurrentZoom(getZoom());
            }
        };

        updateZoom();
        const interval = setInterval(updateZoom, 500);
        return () => clearInterval(interval);
    }, []);

    const handleZoomIn = () => {
        console.log('🔍 Toolbox: Zoom in');
        const viewer = getViewer();
        if (viewer) {
            const currentCenter = viewer.viewport.getCenter();
            viewer.viewport.zoomBy(1.2);
            setTimeout(() => {
                setCurrentZoom(viewer.viewport.getZoom());
            }, 100);
        }
    };

    const handleZoomOut = () => {
        console.log('🔍 Toolbox: Zoom out');
        const viewer = getViewer();
        if (viewer) {
            const currentCenter = viewer.viewport.getCenter();
            viewer.viewport.zoomBy(0.8);
            setTimeout(() => {
                setCurrentZoom(viewer.viewport.getZoom());
            }, 100);
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
                    transition: 'all 0.18s ease'
                }}
                onClick={() => setIsMinimized(false)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={handleMouseDown}
            >
                <span style={{ fontSize: '24px' }}>🔍</span>
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
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
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
                    marginBottom: '8px',
                    cursor: 'grab'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>Zoom</h3>
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
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '2px',
                        pointerEvents: 'auto',
                        zIndex: 10
                    }}
                    title="Minimizar"
                >
                    ─
                </button>
            </div>
            {/* Zoom indicator */}
            <div style={{
                fontSize: '10px',
                color: 'var(--muted-foreground)',
                textAlign: 'center',
                padding: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
            }}>
                {(currentZoom * 100).toFixed(0)}%
            </div>

            {/* Zoom In */}
            <button
                onClick={handleZoomIn}
                style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--primary-foreground)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = 'var(--accent)';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                +
            </button>

            {/* Zoom Out */}
            <button
                onClick={handleZoomOut}
                style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--primary-foreground)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = 'var(--accent)';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                −
            </button>
        </div>
    );
};

export default ZoomControls;
