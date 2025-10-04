/**
 * Seadragon Wrapper - API mínima para integrar con OpenSeadragon
 * Proporciona funciones de conversión de coordenadas y control del visor
 */

let viewerInstance = null;
let viewportChangeCallbacks = [];

/**
 * Inicializar el wrapper con una instancia de viewer
 */
export const initWrapper = (viewer) => {
  viewerInstance = viewer;
  
  // Escuchar eventos de viewport para notificar a los listeners
  if (viewer) {
    viewer.addHandler('viewport-change', () => {
      viewportChangeCallbacks.forEach(cb => cb());
    });
    
    viewer.addHandler('animation', () => {
      viewportChangeCallbacks.forEach(cb => cb());
    });
  }
};

/**
 * Obtener la instancia del viewer
 */
export const getViewer = () => {
  if (!viewerInstance) {
    console.warn('Viewer no inicializado. Usa initWrapper(viewer) primero.');
  }
  return viewerInstance;
};

/**
 * Registrar callback para cambios de viewport
 */
export const onViewportChange = (callback) => {
  viewportChangeCallbacks.push(callback);
  
  // Retornar función para deregistrar
  return () => {
    viewportChangeCallbacks = viewportChangeCallbacks.filter(cb => cb !== callback);
  };
};

/**
 * Convertir coordenadas de viewport a coordenadas de imagen
 * @param {Object} point - {x, y} en coordenadas de viewport
 * @returns {Object} {x, y} en coordenadas de píxeles de imagen
 */
export const viewportToImage = (point) => {
  if (!viewerInstance) return point;
  
  try {
    const viewportPoint = viewerInstance.viewport.pointFromPixel(point);
    const imagePoint = viewerInstance.viewport.viewportToImageCoordinates(viewportPoint);
    return imagePoint;
  } catch (e) {
    console.error('Error convirtiendo viewport a imagen:', e);
    return point;
  }
};

/**
 * Convertir coordenadas de imagen a viewport
 * @param {number} x - coordenada x en imagen
 * @param {number} y - coordenada y en imagen
 * @returns {Object} {x, y} en coordenadas de viewport
 */
export const imageToViewport = (x, y) => {
  if (!viewerInstance) return { x, y };
  
  try {
    const imagePoint = new window.OpenSeadragon.Point(x, y);
    const viewportPoint = viewerInstance.viewport.imageToViewportCoordinates(imagePoint);
    return viewerInstance.viewport.pixelFromPoint(viewportPoint);
  } catch (e) {
    console.error('Error convirtiendo imagen a viewport:', e);
    return { x, y };
  }
};

/**
 * Obtener dimensiones de la imagen actual
 * @returns {Object} {width, height}
 */
export const getImageDimensions = () => {
  if (!viewerInstance || !viewerInstance.world.getItemAt(0)) {
    return { width: 4000, height: 3000 }; // Fallback
  }
  
  try {
    const tiledImage = viewerInstance.world.getItemAt(0);
    const size = tiledImage.getContentSize();
    return { width: size.x, height: size.y };
  } catch (e) {
    console.error('Error obteniendo dimensiones:', e);
    return { width: 4000, height: 3000 };
  }
};

/**
 * Zoom in
 */
export const zoomIn = () => {
  if (viewerInstance) {
    viewerInstance.viewport.zoomBy(1.2);
  }
};

/**
 * Zoom out
 */
export const zoomOut = () => {
  if (viewerInstance) {
    viewerInstance.viewport.zoomBy(0.8);
  }
};

/**
 * Obtener nivel de zoom actual
 */
export const getZoom = () => {
  if (!viewerInstance) return 1;
  return viewerInstance.viewport.getZoom();
};

/**
 * Ir a coordenadas específicas (para "go to coordinate")
 * @param {number} x - coordenada x normalizada [0-1]
 * @param {number} y - coordenada y normalizada [0-1]
 */
export const panTo = (x, y) => {
  if (viewerInstance) {
    const point = new window.OpenSeadragon.Point(x, y);
    viewerInstance.viewport.panTo(point, true);
  }
};

/**
 * Obtener bounds del viewport actual
 */
export const getViewportBounds = () => {
  if (!viewerInstance) return null;
  
  try {
    const bounds = viewerInstance.viewport.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
  } catch (e) {
    return null;
  }
};

/**
 * Normalizar coordenadas de imagen a [0,1]
 * @param {number} x - coordenada x en píxeles
 * @param {number} y - coordenada y en píxeles
 * @returns {Object} {x, y} normalizado
 */
export const normalizeCoords = (x, y) => {
  const dims = getImageDimensions();
  return {
    x: x / dims.width,
    y: y / dims.height
  };
};

/**
 * Desnormalizar coordenadas de [0,1] a píxeles
 * @param {number} x - coordenada x normalizada
 * @param {number} y - coordenada y normalizada
 * @returns {Object} {x, y} en píxeles
 */
export const denormalizeCoords = (x, y) => {
  const dims = getImageDimensions();
  return {
    x: x * dims.width,
    y: y * dims.height
  };
};

