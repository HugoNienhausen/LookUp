import React, { useRef, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';

const DeepZoomViewerTest = () => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useTestImage, setUseTestImage] = useState(false);

  const testImageUrl = 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi';
  const marsImageUrl = 'https://lookuphack.s3.eu-north-1.amazonaws.com/fotos/output/mars_hellas.dzi';

  useEffect(() => {
    console.log('Inicializando OpenSeadragon...');
    
    // Configuración de OpenSeadragon
    const config = {
      tileSources: useTestImage ? testImageUrl : marsImageUrl,
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
        console.log('URL de imagen:', config.tileSources);
        
        viewerRef.current = OpenSeadragon({
          ...config,
          element: containerRef.current
        });

        // Manejar evento de carga
        viewerRef.current.addHandler('open', () => {
          console.log('✅ Imagen cargada correctamente!');
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
          setError(`Error cargando la imagen: ${event.message || 'Error desconocido'}`);
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
  }, [useTestImage]);

  const switchImage = () => {
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }
    setUseTestImage(!useTestImage);
    setLoading(true);
    setError(null);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#000',
        zIndex: 1000
      }}
    >
      {/* Botón de control */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1001,
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white'
      }}>
        <button 
          onClick={switchImage}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {useTestImage ? 'Ver Marte' : 'Ver Imagen de Prueba'}
        </button>
        <span style={{ fontSize: '12px' }}>
          {useTestImage ? 'Imagen de prueba' : 'Imagen de Marte'}
        </span>
      </div>

      {/* Contenedor del visor */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
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
            <div>🔄 Cargando imagen...</div>
            <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
              {useTestImage ? 'Imagen de prueba' : 'Hellas Planitia, Marte'}
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
            <button 
              onClick={switchImage}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Probar otra imagen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepZoomViewerTest;
