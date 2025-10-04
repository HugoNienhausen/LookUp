# DeepZoomViewer Component

Un componente React TypeScript para visualizar imágenes de alta resolución usando OpenSeadragon.

## Características

- ✅ Visualización de imágenes DZI (Deep Zoom Images)
- ✅ Controles de zoom, rotación y navegación
- ✅ Responsive design (100% width, 70vh height)
- ✅ ResizeObserver para manejo automático de redimensionamiento
- ✅ Configuración personalizable
- ✅ TypeScript con tipado completo
- ✅ Callback de estado listo

## Props

```typescript
interface DeepZoomViewerProps {
  dziUrl: string;                    // URL del archivo DZI
  maxZoomPixelRatio?: number;        // Máximo ratio de zoom (default: 2)
  showNavigator?: boolean;           // Mostrar navegador (default: true)
  onReady?: () => void;              // Callback cuando el visor está listo
}
```

## Uso

```tsx
import DeepZoomViewer from './components/DeepZoomViewer';

function MyComponent() {
  const handleReady = () => {
    console.log('Visor listo!');
  };

  return (
    <DeepZoomViewer
      dziUrl="https://example.com/image.dzi"
      maxZoomPixelRatio={3}
      showNavigator={true}
      onReady={handleReady}
    />
  );
}
```

## Configuración de OpenSeadragon

El componente utiliza la siguiente configuración:

- `tileSources`: URL del archivo DZI
- `prefixUrl`: "/openseadragon-images/" (imágenes de control)
- `visibilityRatio`: 1
- `minZoomImageRatio`: 0.8
- `zoomPerScroll`: 1.2
- `gestureSettingsTouch`: { pinchRotate: true }
- `crossOriginPolicy`: "Anonymous"

## Requisitos

1. **Imágenes de OpenSeadragon**: Copia las imágenes de control a `public/openseadragon-images/`
2. **Dependencias**: 
   - `openseadragon`
   - `@types/openseadragon`

## Instalación de imágenes de control

```bash
# Desde el directorio frontend/
mkdir -p public/openseadragon-images
cd public/openseadragon-images

# Descargar imágenes desde el repositorio oficial
curl -L https://github.com/openseadragon/openseadragon/archive/master.zip -o osd.zip
unzip osd.zip
cp -r openseadragon-master/images/* ./
rm -rf openseadragon-master osd.zip
```

## Eventos

- **OPEN**: Se dispara cuando la imagen se carga completamente
- **ResizeObserver**: Maneja automáticamente el redimensionamiento del contenedor

## Limpieza

El componente maneja automáticamente la limpieza:
- Desconecta el ResizeObserver
- Destruye la instancia de OpenSeadragon
- Limpia las referencias

## Ejemplo completo

Ver `App.tsx` para un ejemplo de implementación completa.
