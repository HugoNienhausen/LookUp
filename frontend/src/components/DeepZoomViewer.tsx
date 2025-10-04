import React, { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';

export interface DeepZoomViewerProps {
  dziUrl: string;
  maxZoomPixelRatio?: number;
  showNavigator?: boolean;
  onReady?: () => void;
}

const DeepZoomViewer: React.FC<DeepZoomViewerProps> = ({
  dziUrl,
  maxZoomPixelRatio = 2,
  showNavigator = true,
  onReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configuración de OpenSeadragon
    const config: OpenSeadragon.Options = {
      tileSources: dziUrl,
      prefixUrl: "/openseadragon-images/",
      visibilityRatio: 1,
      minZoomImageRatio: 0.8,
      zoomPerScroll: 1.2,
      gestureSettingsTouch: {
        pinchRotate: true
      },
      crossOriginPolicy: "Anonymous",
      maxZoomPixelRatio,
      showNavigator,
      element: containerRef.current
    };

    // Inicializar OpenSeadragon
    const viewer = OpenSeadragon(config);
    viewerRef.current = viewer;

    // Manejar evento OPEN
    viewer.addHandler('open', () => {
      setIsReady(true);
      onReady?.();
    });

    // Configurar ResizeObserver para manejar cambios de tamaño
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (viewerRef.current) {
          viewerRef.current.resize();
        }
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Cleanup al desmontar
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [dziUrl, maxZoomPixelRatio, showNavigator, onReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '70vh',
        position: 'relative',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '16px',
            zIndex: 1
          }}
        >
          Cargando visor de imágenes...
        </div>
      )}
    </div>
  );
};

export default DeepZoomViewer;
