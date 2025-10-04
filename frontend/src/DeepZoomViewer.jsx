import React, { useRef, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';

const DeepZoomViewer = () => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Inicializando OpenSeadragon...');
    
    // Configuración de OpenSeadragon
    const config = {
      tileSources: 'https://lookuphack.s3.eu-north-1.amazonaws.com/fotos/output/mars_hellas.dzi',
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      visibilityRatio: 1,
      minZoomImageRatio: 0.8,
      zoomPerScroll: 1.2,
      gestureSettingsTouch: {
        pinchRotate: true
      },
      crossOriginPolicy: 'Anonymous',
      showNavigator: true,
      maxZoomPixelRatio: 2,
      debugMode: true
    };

    // Inicializar OpenSeadragon
    if (containerRef.current) {
      try {
        console.log('Creando instancia de OpenSeadragon...');
        viewerRef.current = OpenSeadragon({
          ...config,
          element: containerRef.current
        });

        // Manejar evento de carga
        viewerRef.current.addHandler('open', () => {
          console.log('✅ Imagen de Marte cargada correctamente!');
          setLoading(false);
          setError(null);
        });

        // Manejar errores de tiles
        viewerRef.current.addHandler('tile-load-failed', (event) => {
          console.error('❌ Error cargando tile:', event);
        });

        // Manejar errores generales
        viewerRef.current.addHandler('open-failed', (event) => {
          console.error('❌ Error abriendo imagen:', event);
          setError('Error cargando la imagen de Marte');
          setLoading(false);
        });

        // Manejar eventos de zoom
        viewerRef.current.addHandler('zoom', (event) => {
          console.log('🔍 Zoom level:', event.zoom);
        });

        console.log('OpenSeadragon inicializado correctamente');
      } catch (err) {
        console.error('❌ Error inicializando OpenSeadragon:', err);
        setError('Error inicializando el visor');
        setLoading(false);
      }
    }

    // Cleanup al desmontar
    return () => {
      if (viewerRef.current) {
        console.log('Destruyendo OpenSeadragon...');
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#000',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {loading && !error && (
        <div style={{
          color: 'white',
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div>🔄 Cargando imagen de Marte...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            Hellas Planitia
          </div>
        </div>
      )}
      
      {error && (
        <div style={{
          color: '#ff6b6b',
          fontSize: '18px',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div>❌ {error}</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            Verifica la consola para más detalles
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepZoomViewer;
