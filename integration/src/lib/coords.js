/**
 * Sistema unificado de coordenadas
 * 
 * Sistema canónico: Píxeles de imagen (0,0 = esquina superior izquierda)
 * Sistema normalizado: [0,1] donde (0,0) = esquina superior izquierda, (1,1) = esquina inferior derecha
 * 
 * Fuente de verdad: dimensiones reales de la imagen desde viewer.world.getItemAt(0).source
 */

import OpenSeadragon from 'openseadragon';

/**
 * Obtener dimensiones reales de la imagen desde el viewer
 * @param {Object} viewer - Instancia del viewer OpenSeadragon
 * @returns {Object} {width, height} en píxeles
 */
export function getImageDimensions(viewer) {
    if (!viewer || !viewer.world.getItemAt(0)) {
        console.warn('⚠️ No hay imagen cargada, usando dimensiones fallback');
        return { width: 4000, height: 3000 };
    }

    try {
        const tiledImage = viewer.world.getItemAt(0);
        const source = tiledImage.source;
        
        // Intentar obtener dimensiones desde source
        let width = source.width || source.dimensions?.x;
        let height = source.height || source.dimensions?.y;

        // Fallback a getContentSize si no hay width/height directo
        if (!width || !height) {
            const size = tiledImage.getContentSize();
            width = size.x;
            height = size.y;
        }

        return { width, height };
    } catch (error) {
        console.error('❌ Error obteniendo dimensiones de la imagen:', error);
        return { width: 4000, height: 3000 };
    }
}

/**
 * Convertir coordenadas de imagen en píxeles a normalizadas [0,1]
 * @param {number} x_px - Coordenada x en píxeles
 * @param {number} y_px - Coordenada y en píxeles
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y} normalizado [0,1]
 */
export function imagePxToNormalized(x_px, y_px, viewer) {
    const dims = getImageDimensions(viewer);
    return {
        x: x_px / dims.width,
        y: y_px / dims.height
    };
}

/**
 * Convertir coordenadas normalizadas [0,1] a píxeles de imagen
 * @param {number} x_norm - Coordenada x normalizada [0,1]
 * @param {number} y_norm - Coordenada y normalizada [0,1]
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y} en píxeles
 */
export function normalizedToImagePx(x_norm, y_norm, viewer) {
    const dims = getImageDimensions(viewer);
    return {
        x: Math.round(x_norm * dims.width),
        y: Math.round(y_norm * dims.height)
    };
}

/**
 * Convertir un punto del viewport a coordenadas de imagen en píxeles
 * @param {Object} viewer - Instancia del viewer
 * @param {Object} viewportPoint - Punto en coordenadas del viewport {x, y}
 * @returns {Object} {x, y} en píxeles de imagen
 */
export function viewportPointToImagePx(viewer, viewportPoint) {
    if (!viewer) {
        return { x: 0, y: 0 };
    }

    try {
        const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
        return {
            x: Math.round(imagePoint.x),
            y: Math.round(imagePoint.y)
        };
    } catch (error) {
        console.error('Error convirtiendo viewport point a image px:', error);
        return { x: 0, y: 0 };
    }
}

/**
 * Convertir coordenadas de imagen en píxeles a punto del viewport
 * @param {Object} viewer - Instancia del viewer
 * @param {number} x_px - Coordenada x en píxeles
 * @param {number} y_px - Coordenada y en píxeles
 * @returns {Object} Punto en coordenadas del viewport
 */
export function imagePxToViewportPoint(viewer, x_px, y_px) {
    if (!viewer) {
        return null;
    }

    try {
        const imagePoint = new OpenSeadragon.Point(x_px, y_px);
        return viewer.viewport.imageToViewportCoordinates(imagePoint);
    } catch (error) {
        console.error('Error convirtiendo image px a viewport point:', error);
        return null;
    }
}

/**
 * Convertir evento del mouse a coordenadas de imagen en píxeles
 * @param {Object} viewer - Instancia del viewer
 * @param {Event} event - Evento del mouse
 * @returns {Object} {x, y} en píxeles de imagen, o null si está fuera
 */
export function mouseEventToImagePx(viewer, event) {
    if (!viewer) {
        return null;
    }

    try {
        const container = viewer.container;
        const rect = container.getBoundingClientRect();

        // Verificar si el mouse está dentro del contenedor
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) {
            return null;
        }

        // Convertir a coordenadas relativas del contenedor [0,1]
        const x_rel = (event.clientX - rect.left) / rect.width;
        const y_rel = (event.clientY - rect.top) / rect.height;

        const viewportPoint = new OpenSeadragon.Point(x_rel, y_rel);
        const webPoint = new OpenSeadragon.Point(event.clientX - rect.left, event.clientY - rect.top);
        
        // Convertir de posición en pantalla a viewport point
        const viewportPointFromWeb = viewer.viewport.pointFromPixel(webPoint);
        
        // Convertir de viewport a coordenadas de imagen
        const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPointFromWeb);

        return {
            x: Math.round(imagePoint.x),
            y: Math.round(imagePoint.y)
        };
    } catch (error) {
        console.error('Error convirtiendo mouse event a image px:', error);
        return null;
    }
}

/**
 * Obtener el centro del viewport en píxeles de imagen
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y} en píxeles de imagen
 */
export function getViewportCenterPx(viewer) {
    if (!viewer) {
        return { x: 0, y: 0 };
    }

    try {
        const center = viewer.viewport.getCenter();
        const imagePoint = viewer.viewport.viewportToImageCoordinates(center);
        return {
            x: Math.round(imagePoint.x),
            y: Math.round(imagePoint.y)
        };
    } catch (error) {
        console.error('Error obteniendo centro del viewport:', error);
        return { x: 0, y: 0 };
    }
}

/**
 * Obtener el centro del viewport en coordenadas normalizadas
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y} normalizado [0,1]
 */
export function getViewportCenterNormalized(viewer) {
    const centerPx = getViewportCenterPx(viewer);
    return imagePxToNormalized(centerPx.x, centerPx.y, viewer);
}

/**
 * Obtener bounds del viewport en formato normalizado [0,1]
 * Retorna la posición y tamaño del área visible
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y, width, height} normalizado [0,1]
 */
export function getViewportBoundsNormalized(viewer) {
    if (!viewer) {
        return { x: 0, y: 0, width: 1, height: 1 };
    }

    try {
        const bounds = viewer.viewport.getBounds();
        const dims = getImageDimensions(viewer);
        
        // Convertir esquinas del viewport a coordenadas de imagen
        const topLeft = viewer.viewport.viewportToImageCoordinates(
            new OpenSeadragon.Point(bounds.x, bounds.y)
        );
        const bottomRight = viewer.viewport.viewportToImageCoordinates(
            new OpenSeadragon.Point(bounds.x + bounds.width, bounds.y + bounds.height)
        );
        
        // Normalizar a [0,1]
        const x = topLeft.x / dims.width;
        const y = topLeft.y / dims.height;
        const width = (bottomRight.x - topLeft.x) / dims.width;
        const height = (bottomRight.y - topLeft.y) / dims.height;
        
        return { x, y, width, height };
    } catch (error) {
        console.error('Error obteniendo bounds normalizados:', error);
        return { x: 0, y: 0, width: 1, height: 1 };
    }
}

/**
 * Obtener los límites de la imagen completa en el espacio del viewport
 * Útil para saber dónde están los bordes de la imagen en el viewport actual
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y, width, height} en coordenadas del viewport
 */
export function getImageBoundsInViewport(viewer) {
    if (!viewer) {
        return { x: 0, y: 0, width: 1, height: 1 };
    }

    try {
        const dims = getImageDimensions(viewer);
        
        // Convertir esquinas de la imagen (0,0) y (width, height) a viewport coords
        const topLeft = viewer.viewport.imageToViewportCoordinates(
            new OpenSeadragon.Point(0, 0)
        );
        const bottomRight = viewer.viewport.imageToViewportCoordinates(
            new OpenSeadragon.Point(dims.width, dims.height)
        );
        
        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    } catch (error) {
        console.error('Error obteniendo límites de la imagen en viewport:', error);
        return { x: 0, y: 0, width: 1, height: 1 };
    }
}

/**
 * Calcular límites para el centro del viewport (clamping)
 * Evita que el viewport se salga de los bordes de la imagen
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {minX, maxX, minY, maxY} en coordenadas de viewport
 */
export function getViewportCenterBounds(viewer) {
    if (!viewer) {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }

    try {
        const dims = getImageDimensions(viewer);
        const bounds = viewer.viewport.getBounds();
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;

        // Convertir dimensiones de imagen a coordenadas de viewport
        const topLeft = viewer.viewport.imageToViewportCoordinates(new OpenSeadragon.Point(0, 0));
        const bottomRight = viewer.viewport.imageToViewportCoordinates(new OpenSeadragon.Point(dims.width, dims.height));

        return {
            minX: topLeft.x + halfWidth,
            maxX: bottomRight.x - halfWidth,
            minY: topLeft.y + halfHeight,
            maxY: bottomRight.y - halfHeight
        };
    } catch (error) {
        console.error('Error calculando bounds del viewport:', error);
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
}

/**
 * Clampear coordenadas de imagen para que estén dentro de los límites
 * @param {number} x_px - Coordenada x en píxeles
 * @param {number} y_px - Coordenada y en píxeles
 * @param {Object} viewer - Instancia del viewer
 * @returns {Object} {x, y} clampeado en píxeles
 */
export function clampImageCoords(x_px, y_px, viewer) {
    const dims = getImageDimensions(viewer);
    return {
        x: Math.max(0, Math.min(dims.width, x_px)),
        y: Math.max(0, Math.min(dims.height, y_px))
    };
}

/**
 * Navegar a coordenadas específicas (píxeles o normalizadas)
 * @param {Object} viewer - Instancia del viewer
 * @param {number} x - Coordenada x
 * @param {number} y - Coordenada y
 * @param {string} type - 'pixels' o 'normalized'
 * @param {boolean} immediately - Si true, navegar inmediatamente sin animación
 */
export function panToCoordinate(viewer, x, y, type = 'normalized', immediately = false) {
    if (!viewer) {
        console.warn('⚠️ Viewer no inicializado');
        return false;
    }

    try {
        let x_px, y_px;

        // Convertir a píxeles según el tipo
        if (type === 'normalized') {
            const converted = normalizedToImagePx(x, y, viewer);
            x_px = converted.x;
            y_px = converted.y;
        } else {
            x_px = Math.round(x);
            y_px = Math.round(y);
        }

        // Clampear coordenadas
        const clamped = clampImageCoords(x_px, y_px, viewer);
        console.log('📍 Navegando a:', { 
            input: { x, y, type }, 
            pixels: { x: x_px, y: y_px }, 
            clamped 
        });

        // Convertir a punto del viewport
        const viewportPoint = imagePxToViewportPoint(viewer, clamped.x, clamped.y);
        
        if (!viewportPoint) {
            console.error('❌ No se pudo convertir a viewport point');
            return false;
        }

        // Navegar manteniendo el zoom actual
        viewer.viewport.panTo(viewportPoint, immediately);
        return true;
    } catch (error) {
        console.error('❌ Error navegando a coordenadas:', error);
        return false;
    }
}

