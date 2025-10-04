import React, { useState, useEffect } from 'react';
import { getViewer, isViewerReady, getZoom } from '../lib/seadragon-loader';
import { useDraggable } from '../hooks/useDraggable';
import { PiMagnifyingGlass, PiPlus, PiMinus } from 'react-icons/pi';

const ZoomControls = () => {
    const [currentZoom, setCurrentZoom] = useState(1);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Hook para hacer los controles de zoom arrastrables
    const initialX = window.innerWidth > 120 ? window.innerWidth - 100 : 20;
    const initialY = window.innerHeight > 250 ? window.innerHeight - 230 : 100;
    const { elementRef, draggableStyle, handleMouseDown } = useDraggable('zoom-controls', { x: initialX, y: initialY });

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
        console.log('Zoom in');
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
        console.log('Zoom out');
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
                <PiMagnifyingGlass size={24} />
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
                    title="Minimize"
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
                <PiPlus size={20} />
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
                <PiMinus size={20} />
            </button>
        </div>
    );
};

export default ZoomControls;
