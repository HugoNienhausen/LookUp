import React, { useState } from 'react';
import DeepZoomViewer from './components/DeepZoomViewer';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [viewerReady, setViewerReady] = useState<boolean>(false);

  // URL de imagen de Marte - Hellas Planitia
  const marsDziUrl = 'https://mis-imagenes-espaciales.s3.eu-west-3.amazonaws.com/mars/mars_hellas.dzi';

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/`);
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error al conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  const handleViewerReady = () => {
    setViewerReady(true);
    console.log('DeepZoom Viewer está listo!');
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Hackathon Monorepo</h1>
        <p>Frontend: React 18 + Vite + TypeScript</p>
        <p>Backend: Django 5 + DRF</p>
        
        <div className="api-section">
          <h2>Estado de la API:</h2>
          {loading ? (
            <p>🔄 Cargando...</p>
          ) : (
            <p>✅ {message}</p>
          )}
          <button onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        <div className="viewer-section">
          <h2>🔍 DeepZoom Viewer - Marte</h2>
          <p>Imagen de alta resolución de Hellas Planitia, Marte</p>
          {viewerReady && <p className="ready-indicator">✅ Visor listo</p>}
          
          <DeepZoomViewer
            dziUrl={marsDziUrl}
            maxZoomPixelRatio={2}
            showNavigator={true}
            onReady={handleViewerReady}
          />
        </div>
      </header>
    </div>
  );
}

export default App;