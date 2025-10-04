import React, { useRef, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';

const DEFAULT_DZI_URL = "https://lookuphack.s3.eu-north-1.amazonaws.com/fotos/PIA26080_Anaglyph_dz.dzi";

const SimpleViewer = ({ dziUrl }) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const [status, setStatus] = useState('Verificando URL...');
  const [hasTileErrors, setHasTileErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dziInfo, setDziInfo] = useState(null);

  // Determinar URL del DZI
  const getDziUrl = () => {
    return import.meta.env.VITE_DZI_URL || dziUrl || DEFAULT_DZI_URL;
  };

  // Verificar URL con HEAD request
  const checkDziUrl = async (url) => {
    if (!url) {
      throw new Error('No se proporcionó URL del DZI');
    }

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return { status: response.status, url };
    } catch (err) {
      throw new Error(`Error verificando URL: ${err.message}`);
    }
  };

  // Probar descarga de un tile
  const testTileDownload = async (dziUrl) => {
    try {
      // Obtener información del DZI
      const response = await fetch(dziUrl);
      const dziText = await response.text();

      // Parsear XML para encontrar el primer tile
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(dziText, 'text/xml');
      const sizeElement = xmlDoc.querySelector('Size');
      const tileSizeElement = xmlDoc.querySelector('TileSize');

      if (sizeElement && tileSizeElement) {
        const width = parseInt(sizeElement.getAttribute('Width'));
        const height = parseInt(sizeElement.getAttribute('Height'));
        const tileSize = parseInt(tileSizeElement.getAttribute('Width'));

        // Construir URL del primer tile (zoom level 0, tile 0,0)
        const baseUrl = dziUrl.replace('.dzi', '_files');
        const tileUrl = `${baseUrl}/0/0_0.jpg`;

        // Intentar descargar el tile
        const tileResponse = await fetch(tileUrl, { method: 'HEAD' });
        if (tileResponse.ok) {
          return `✅ Tile de prueba accesible: ${tileUrl}`;
        } else {
          return `⚠️ Tile de prueba no accesible (${tileResponse.status}): ${tileUrl}`;
        }
      }
      return "⚠️ No se pudo parsear información del DZI";
    } catch (err) {
      return `❌ Error probando tile: ${err.message}`;
    }
  };

  // Inicializar OpenSeadragon
  const initializeOpenSeadragon = (url) => {
    if (!containerRef.current) return;

    try {
      const config = {
        element: containerRef.current,
        prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
        crossOriginPolicy: "Anonymous",
        showNavigator: true,
        loadTilesWithAjax: true,
        ajaxWithCredentials: false,
        debugMode: true,
        showTileBorders: true,
        tileSources: url
      };

      console.log('Creando instancia de OpenSeadragon...');
      viewerRef.current = OpenSeadragon(config);

      // Handler para cuando la imagen se abre correctamente
      viewerRef.current.addHandler('open', () => {
        console.log('✅ Imagen abierta correctamente');
        setStatus(hasTileErrors ? "✅ Imagen cargada (con errores parciales)" : "✅ Imagen cargada completa");
        setIsLoading(false);
        setError(null);
      });

      // Handler para errores al abrir la imagen
      viewerRef.current.addHandler('open-failed', (event) => {
        console.error('❌ Error abriendo imagen:', event);
        setError(`Error abriendo imagen: ${event.message}`);
        setStatus("❌ Error abriendo imagen");
        setIsLoading(false);
      });

      // Handler para tiles que fallan al cargar - SOLO LOGUEAR, NO ROMPER
      viewerRef.current.addHandler('tile-load-failed', (event) => {
        console.warn('⚠️ Tile falló al cargar:', event.tile.url);
        setHasTileErrors(true);
        setStatus("✅ Imagen cargada (con errores parciales)");
        // NO interrumpir el visor, solo marcar que hay errores parciales
      });

      // Handler para tiles que se cargan correctamente
      viewerRef.current.addHandler('tile-loaded', (event) => {
        console.log('✅ Tile cargado:', event.tile.url);
      });

      // Handler para cuando se completa la carga inicial
      viewerRef.current.addHandler('tile-drawn', () => {
        if (hasTileErrors) {
          setStatus("✅ Imagen cargada (con errores parciales)");
        } else {
          setStatus("✅ Imagen cargada completa");
        }
      });

      // Handler para errores de red de tiles - SOLO LOGUEAR
      viewerRef.current.addHandler('tile-load-error', (event) => {
        console.warn('⚠️ Error de red cargando tile:', event.tile.url);
        setHasTileErrors(true);
        setStatus("✅ Imagen cargada (con errores parciales)");
        // NO interrumpir el visor
      });

      console.log('OpenSeadragon inicializado correctamente');
    } catch (err) {
      console.error('❌ Error inicializando OpenSeadragon:', err);
      setError(`Error inicializando visor: ${err.message}`);
      setStatus("❌ Error inicializando visor");
      setIsLoading(false);
    }
  };

  // Función para reintentar
  const retry = async () => {
    setError(null);
    setStatus('Verificando URL...');
    setIsLoading(true);
    setHasTileErrors(false);

    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    const url = getDziUrl();
    if (!url) {
      setError('No se proporcionó URL del DZI');
      setStatus('❌ No se proporcionó URL del DZI');
      setIsLoading(false);
      return;
    }

    try {
      const result = await checkDziUrl(url);
      setDziInfo(result);
      setStatus('Inicializando visor...');
      initializeOpenSeadragon(url);
    } catch (err) {
      setError(err.message);
      setStatus(`❌ ${err.message}`);
      setIsLoading(false);
    }
  };

  // Función para probar tile
  const testTile = async () => {
    const url = getDziUrl();
    if (!url) {
      setError('No se proporcionó URL del DZI');
      return;
    }

    setStatus('Probando descarga de tile...');
    try {
      const result = await testTileDownload(url);
      setStatus(result);
    } catch (err) {
      setStatus(`❌ Error probando tile: ${err.message}`);
    }
  };

  useEffect(() => {
    retry();

    return () => {
      if (viewerRef.current) {
        console.log('Destruyendo SimpleViewer...');
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const currentUrl = getDziUrl();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: error ? '#2d1b1b' : '#000',
      zIndex: 1000
    }}>
      {/* Barra superior con estado */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1001,
        background: error ? 'rgba(220, 53, 69, 0.9)' : 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        backdropFilter: 'blur(10px)',
        border: error ? '1px solid rgba(220, 53, 69, 0.5)' : '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Estado y URL */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <span>🔍</span>
            <span style={{ fontWeight: 'bold' }}>{status}</span>
          </div>
          {currentUrl && (
            <div style={{ fontSize: '12px', opacity: 0.8, wordBreak: 'break-all' }}>
              URL: {currentUrl}
            </div>
          )}
          {error && (
            <div style={{ fontSize: '12px', color: '#ffcccb', marginTop: '5px' }}>
              Error: {error}
            </div>
          )}
        </div>

        {/* Botones de control */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={retry}
            disabled={isLoading}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Verificando...' : 'Reintentar'}
          </button>

          {!error && currentUrl && (
            <button
              onClick={testTile}
              disabled={isLoading}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Probar Tile
            </button>
          )}
        </div>

        {/* Indicador de carga */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#4CAF50',
            marginTop: '10px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #4CAF50',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Cargando...</span>
          </div>
        )}
      </div>

      {/* Contenedor del visor */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      />

      {/* Estilos CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimpleViewer;