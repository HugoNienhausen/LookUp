/**
 * Seadragon Loader - Encapsulación completa de OpenSeadragon
 * Inicializa el viewer y expone API pública para Toolbox y CanvasOverlay
 */

import OpenSeadragon from 'openseadragon';

let viewer = null;
let navigator = null;
let viewportChangeCallbacks = [];
let isInitialized = false;
let imageWidth = 0;
let imageHeight = 0;

/**
 * Inicializar OpenSeadragon con configuración completa
 * @param {Object} options - Configuración del viewer
 * @param {string} options.elementId - ID del elemento contenedor
 * @param {string} options.tileSource - URL del tile source (DZI/IIIF)
 * @param {string} options.prefixUrl - URL base para iconos de OSD
 * @param {boolean} options.showNavigator - Mostrar navigator nativo
 * @param {string} options.navigatorId - ID del elemento navigator
 * @returns {Promise<Object>} - Instancia del viewer
 */
export async function initSeadragon({
  elementId = 'seadragon',
  tileSource,
  prefixUrl = '/openseadragon-images/',
  showNavigator = false,
  navigatorId = 'seadragon-navigator'
} = {}) {
  
  if (isInitialized && viewer && viewer.container && viewer.container.id === elementId) {
    console.log('Seadragon ya inicializado, reutilizando instancia');
    return viewer;
  }

  console.log('Inicializando Seadragon con tileSource:', tileSource);

  try {
    // Verificar que el elemento contenedor existe
    const container = document.getElementById(elementId);
    if (!container) {
      throw new Error(`Elemento contenedor '${elementId}' no encontrado`);
    }

    // Configuración base de OpenSeadragon
    const config = {
      id: elementId,
      prefixUrl: prefixUrl,
      tileSources: tileSource,
      crossOriginPolicy: 'Anonymous',
      ajaxWithCredentials: false,
      showNavigator: false, // Lo manejamos manualmente
      showNavigationControl: false,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      
      // Configuración de zoom y navegación
      visibilityRatio: 1,
      minZoomImageRatio: 0.8,
      maxZoomPixelRatio: 3,
      zoomPerScroll: 1.2,
      animationTime: 0.5,
      
      // Tile grid nativo - se activará dinámicamente
      showTileBorders: false,
      debugMode: false,
      
      // Gestos táctiles
      gestureSettingsTouch: {
        pinchRotate: false
      }
    };

    // Inicializar viewer
    viewer = OpenSeadragon(config);
    
    // Configurar event handlers
    setupEventHandlers(viewer);
    
    // Nota: El navigator se maneja ahora con el componente Minimap.jsx
    // No se crea el navigator nativo de OpenSeadragon

    // Exponer globalmente para compatibilidad
    window.viewer = viewer;
    window.__osdViewer = viewer;
    
    isInitialized = true;
    console.log('✅ Seadragon inicializado correctamente');
    
    return viewer;

  } catch (error) {
    console.error('❌ Error inicializando Seadragon:', error);
    throw error;
  }
}

/**
 * Configurar event handlers del viewer
 */
function setupEventHandlers(viewer) {
  // Evento cuando la imagen se abre
  viewer.addHandler('open', () => {
    console.log('🖼️ Imagen abierta en Seadragon');
    const tiledImage = viewer.world.getItemAt(0);
    if (tiledImage) {
      imageWidth = tiledImage.source.dimensions.x;
      imageHeight = tiledImage.source.dimensions.y;
      console.log(`📏 Dimensiones: ${imageWidth}x${imageHeight}`);
      
      // Log solo propiedades que sabemos que existen
      try {
        const contentSize = tiledImage.getContentSize();
        console.log('🔗 TileSource info:', {
          url: tiledImage.source.url || 'N/A',
          type: tiledImage.source.type || 'N/A',
          contentSize: contentSize ? `${contentSize.x}x${contentSize.y}` : 'N/A'
        });
      } catch (e) {
        console.log('ℹ️ Info adicional del tile no disponible');
      }
      
    }
    notifyViewportChange();
  });

  // Evento cuando falla la carga de tiles
  viewer.addHandler('tile-load-failed', (event) => {
    console.error('❌ Error cargando tile:', {
      tile: event.tile,
      url: event.tile?.getUrl(),
      level: event.tile?.level,
      x: event.tile?.x,
      y: event.tile?.y,
      error: event.error
    });
  });

  // Evento cuando se carga un tile exitosamente
  viewer.addHandler('tile-loaded', (event) => {
    console.log('✅ Tile cargado:', {
      level: event.tile.level,
      x: event.tile.x,
      y: event.tile.y,
      url: event.tile.getUrl()
    });
  });

  // Eventos de viewport
  viewer.addHandler('viewport-change', () => {
    notifyViewportChange();
  });

  viewer.addHandler('animation', () => {
    notifyViewportChange();
  });

  // Evento de resize
  viewer.addHandler('resize', () => {
    console.log('📐 Seadragon redimensionado');
    notifyViewportChange();
  });
}

/**
 * Crear navigator/minimapa
 */
async function createNavigator(viewer, navigatorId) {
  try {
    const navElement = document.getElementById(navigatorId);
    if (!navElement) {
      console.warn(`⚠️ Elemento navigator '${navigatorId}' no encontrado`);
      return null;
    }

    // Esperar a que la imagen esté cargada
    if (!viewer.world.getItemAt(0)) {
      console.log('⏳ Esperando imagen para crear navigator...');
      return new Promise((resolve) => {
        viewer.addHandler('open', () => {
          const nav = createNavigatorInstance(viewer, navElement);
          resolve(nav);
        });
      });
    }

    return createNavigatorInstance(viewer, navElement);

  } catch (error) {
    console.error('❌ Error creando navigator:', error);
    return null;
  }
}

/**
 * Crear instancia del navigator
 */
function createNavigatorInstance(viewer, navElement) {
  try {
    // Limpiar navigator anterior
    navElement.innerHTML = '';
    
    // Crear navigator usando la API de OpenSeadragon
    navigator = new OpenSeadragon.Navigator({
      viewer: viewer,
      element: navElement,
      maintainSizeRatio: true,
      sizeRatio: 0.25,
      position: 'BOTTOM_LEFT',
      // Configuración mejorada para mejor visualización
      showNavigator: true,
      navigatorBorderColor: '#6ccff6',
      navigatorBorderWidth: 2,
      navigatorOpacity: 0.8,
      navigatorBackground: 'rgba(0,0,0,0.3)',
      navigatorDisplayMode: 'always'
    });
    
    // Configurar eventos para sincronización
    setupNavigatorEvents(viewer, navigator);

    console.log('✅ Navigator creado correctamente');
    return navigator;

  } catch (error) {
    console.warn('⚠️ Navigator nativo no disponible, creando fallback');
    return createNavigatorFallback(viewer, navElement);
  }
}

/**
 * Configurar eventos del navigator para sincronización
 */
function setupNavigatorEvents(viewer, navigator) {
  // Actualizar navigator cuando cambie el viewport
  viewer.addHandler('viewport-change', () => {
    if (navigator && navigator.update) {
      navigator.update();
    }
  });
  
  // Actualizar navigator cuando se abra una nueva imagen
  viewer.addHandler('open', () => {
    if (navigator && navigator.update) {
      setTimeout(() => navigator.update(), 100);
    }
  });
  
  // Actualizar navigator cuando cambie el tamaño
  viewer.addHandler('resize', () => {
    if (navigator && navigator.update) {
      navigator.update();
    }
  });
  
  // Permitir navegación haciendo click en el navigator
  if (navigator && navigator.element) {
    navigator.element.addEventListener('click', (event) => {
      handleNavigatorClick(viewer, navigator, event);
    });
  }
}

/**
 * Manejar clicks en el navigator para navegación
 */
function handleNavigatorClick(viewer, navigator, event) {
  try {
    const rect = navigator.element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Convertir coordenadas del navigator a coordenadas de imagen
    const imagePoint = new OpenSeadragon.Point(x, y);
    viewer.viewport.panTo(imagePoint, true);
    
    console.log('📍 Navegando a coordenadas del navigator:', { x, y });
  } catch (error) {
    console.error('Error manejando click del navigator:', error);
  }
}

/**
 * Fallback del navigator si la API nativa no está disponible
 */
function createNavigatorFallback(viewer, navElement) {
  const fallbackDiv = document.createElement('div');
  fallbackDiv.style.cssText = `
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  `;
  
  // Crear canvas para mostrar la imagen en miniatura
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: contain;
  `;
  
  // Crear overlay para mostrar el viewport
  const viewportOverlay = document.createElement('div');
  viewportOverlay.style.cssText = `
    position: absolute;
    border: 2px solid #6ccff6;
    background: rgba(108, 207, 246, 0.2);
    pointer-events: none;
    transition: all 0.2s ease;
  `;
  
  fallbackDiv.appendChild(canvas);
  fallbackDiv.appendChild(viewportOverlay);
  navElement.appendChild(fallbackDiv);
  
  // Función para actualizar el viewport overlay
  const updateViewport = () => {
    if (!viewer || !viewer.world.getItemAt(0)) return;
    
    try {
      const viewport = viewer.viewport;
      const bounds = viewport.getBounds();
      const containerSize = viewport.getContainerSize();
      
      // Calcular posición y tamaño del viewport en el minimapa
      const x = bounds.x * 100;
      const y = bounds.y * 100;
      const width = bounds.width * 100;
      const height = bounds.height * 100;
      
      viewportOverlay.style.left = `${x}%`;
      viewportOverlay.style.top = `${y}%`;
      viewportOverlay.style.width = `${width}%`;
      viewportOverlay.style.height = `${height}%`;
    } catch (error) {
      console.warn('Error actualizando viewport overlay:', error);
    }
  };
  
  // Configurar eventos para actualizar el viewport
  viewer.addHandler('viewport-change', updateViewport);
  viewer.addHandler('open', () => {
    setTimeout(updateViewport, 100);
  });
  
  // Permitir navegación haciendo click
  fallbackDiv.addEventListener('click', (event) => {
    const rect = fallbackDiv.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    const imagePoint = new OpenSeadragon.Point(x, y);
    viewer.viewport.panTo(imagePoint, true);
  });
  
  return { 
    element: fallbackDiv, 
    update: updateViewport,
    canvas: canvas
  };
}

/**
 * Obtener instancia del viewer
 */
export function getViewer() {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado. Usa initSeadragon() primero.');
  }
  return viewer;
}

/**
 * Obtener instancia del navigator
 */
export function getNavigator() {
  return navigator;
}

/**
 * Verificar si el viewer está inicializado
 */
export function isViewerReady() {
  return isInitialized && viewer && viewer.world.getItemAt(0);
}

/**
 * Registrar callback para cambios de viewport
 */
export function onViewportChange(callback) {
  if (typeof callback !== 'function') {
    console.warn('⚠️ onViewportChange requiere una función como callback');
    return;
  }
  
  viewportChangeCallbacks.push(callback);
  
  // Retornar función para deregistrar
  return () => {
    viewportChangeCallbacks = viewportChangeCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Notificar cambios de viewport a todos los callbacks
 */
function notifyViewportChange() {
  viewportChangeCallbacks.forEach(callback => {
    try {
      callback(viewer.viewport);
    } catch (error) {
      console.error('Error en viewport callback:', error);
    }
  });
}

/**
 * Convertir coordenadas de viewport a imagen
 * @param {Object} pixelPoint - {x, y} en píxeles del viewport
 * @returns {Object} - {x, y} en coordenadas de imagen
 */
export function viewportToImageCoords(pixelPoint) {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado');
    return null;
  }
  
  try {
    const viewportPoint = viewer.viewport.pointFromPixel(pixelPoint);
    const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
    return imagePoint;
  } catch (error) {
    console.error('Error convirtiendo viewport a imagen:', error);
    return null;
  }
}

/**
 * Convertir coordenadas de imagen a viewport
 * @param {number} imgX - coordenada x en imagen
 * @param {number} imgY - coordenada y en imagen
 * @returns {Object} - {x, y} en píxeles del viewport
 */
export function imageToViewportCoords(imgX, imgY) {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado');
    return null;
  }
  
  try {
    const imagePoint = new OpenSeadragon.Point(imgX, imgY);
    const viewportPoint = viewer.viewport.imageToViewportCoordinates(imagePoint);
    const pixelPoint = viewer.viewport.pixelFromPoint(viewportPoint);
    return pixelPoint;
  } catch (error) {
    console.error('Error convirtiendo imagen a viewport:', error);
    return null;
  }
}

/**
 * Obtener dimensiones de la imagen actual
 * @returns {Object} - {width, height}
 */
export function getImageDimensions() {
  if (!viewer || !viewer.world.getItemAt(0)) {
    console.warn('⚠️ No hay imagen cargada, usando dimensiones fallback');
    return { width: 4000, height: 3000 };
  }
  
  try {
    const tiledImage = viewer.world.getItemAt(0);
    const source = tiledImage.source;
    
    // Intentar obtener dimensiones desde source (fuente de verdad)
    let width = source.width || source.dimensions?.x;
    let height = source.height || source.dimensions?.y;

    // Fallback a getContentSize si no hay width/height directo
    if (!width || !height) {
      const size = tiledImage.getContentSize();
      width = size.x;
      height = size.y;
    }

    // Actualizar variables globales para compatibilidad
    imageWidth = width;
    imageHeight = height;

    return { width, height };
  } catch (error) {
    console.error('❌ Error obteniendo dimensiones:', error);
    return { width: imageWidth || 4000, height: imageHeight || 3000 };
  }
}

/**
 * Normalizar coordenadas a [0,1]
 * @param {number} x - coordenada x en píxeles
 * @param {number} y - coordenada y en píxeles
 * @returns {Object} - {x, y} normalizado
 */
export function normalizeCoords(x, y) {
  const dims = getImageDimensions();
  return {
    x: x / dims.width,
    y: y / dims.height
  };
}

/**
 * Desnormalizar coordenadas de [0,1] a píxeles
 * @param {number} x - coordenada x normalizada
 * @param {number} y - coordenada y normalizada
 * @returns {Object} - {x, y} en píxeles
 */
export function denormalizeCoords(x, y) {
  const dims = getImageDimensions();
  return {
    x: x * dims.width,
    y: y * dims.height
  };
}

/**
 * Zoom in
 */
export function zoomIn() {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado');
    return;
  }
  viewer.viewport.zoomBy(1.2);
}

/**
 * Zoom out
 */
export function zoomOut() {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado');
    return;
  }
  viewer.viewport.zoomBy(0.8);
}

/**
 * Obtener nivel de zoom actual
 */
export function getZoom() {
  if (!viewer) return 1;
  return viewer.viewport.getZoom();
}

/**
 * Ir a coordenadas específicas
 * @param {number} x - coordenada x (normalizada [0-1] por defecto)
 * @param {number} y - coordenada y (normalizada [0-1] por defecto)
 * @param {boolean} immediately - Si true, navegar sin animación
 */
export function panTo(x, y, immediately = true) {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado');
    return false;
  }
  
  try {
    // Las coordenadas vienen normalizadas [0-1]
    // Convertir a coordenadas de imagen en píxeles
    const dims = getImageDimensions();
    const x_px = Math.round(x * dims.width);
    const y_px = Math.round(y * dims.height);
    
    // Clampear para evitar salir de los bordes
    const clamped_x = Math.max(0, Math.min(dims.width, x_px));
    const clamped_y = Math.max(0, Math.min(dims.height, y_px));
    
    console.log('📍 panTo:', {
      input: { x, y },
      pixels: { x: x_px, y: y_px },
      clamped: { x: clamped_x, y: clamped_y },
      dims
    });
    
    // Convertir píxeles de imagen a punto del viewport
    const imagePoint = new OpenSeadragon.Point(clamped_x, clamped_y);
    const viewportPoint = viewer.viewport.imageToViewportCoordinates(imagePoint);
    
    // Navegar manteniendo el zoom actual
    viewer.viewport.panTo(viewportPoint, immediately);
    return true;
  } catch (error) {
    console.error('❌ Error navegando a coordenadas:', error);
    return false;
  }
}

/**
 * Obtener bounds del viewport actual
 */
export function getViewportBounds() {
  if (!viewer) return null;
  
  try {
    const bounds = viewer.viewport.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
  } catch (error) {
    console.error('Error obteniendo bounds:', error);
    return null;
  }
}

/**
 * Destruir el viewer y limpiar recursos
 */
export function destroyViewer() {
  if (viewer) {
    console.log('🧹 Destruyendo Seadragon...');
    viewer.destroy();
    viewer = null;
  }
  if (navigator) {
    navigator = null;
  }
  viewportChangeCallbacks = [];
  isInitialized = false;
  imageWidth = 0;
  imageHeight = 0;
  window.viewer = null;
  window.__osdViewer = null;
  console.log('🧹 Seadragon destruido y limpiado');
}

/**
 * Redimensionar el viewer
 */
export function resizeViewer() {
  if (!viewer) {
    console.warn('⚠️ Viewer no inicializado');
    return;
  }
  viewer.resize();
}



// Exportar OpenSeadragon para uso en otros módulos
export { OpenSeadragon };
