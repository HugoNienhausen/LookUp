# LookUp - Integración Prototype

Prototipo mínimo que integra el frontend de OpenSeadragon + AWS S3 tiles con los widgets exportados desde Figma Make, implementando los flujos de usuario: no registrado, usuario normal, validador y agencia.

## 📁 Estructura del Proyecto

```
integration/
├── db.json                 # Mock database (json-server)
├── package.json
├── vite.config.js
├── index.html
├── index.css              # Importa tokens de figmamake
└── src/
    ├── main.jsx           # Entry point
    ├── App.jsx            # Shell principal con routing
    ├── context/
    │   └── AuthContext.jsx    # Context para autenticación
    ├── lib/
    │   ├── api.js             # Cliente API mock
    │   └── seadragon-wrapper.js  # Wrapper de OpenSeadragon
    ├── components/
    │   ├── TopMenu.jsx        # Menú superior con glassmorphism
    │   ├── SeadragonWrapper.jsx  # Wrapper del viewer
    │   ├── CanvasOverlay.jsx  # Canvas para brush/máscaras
    │   └── Toolbox.jsx        # Widget de herramientas
    └── routes/
        ├── Home.jsx           # Landing + lista de challenges
        ├── Login.jsx          # Login
        ├── Register.jsx       # Registro
        ├── Challenge.jsx      # Viewer + anotación
        ├── Validator.jsx      # Cola de validación
        ├── Agency.jsx         # Crear challenges
        └── Profile.jsx        # Perfil de usuario
```

## 🚀 Instalación

### Prerequisitos

- Node.js 18+ y npm
- El proyecto `figmamake/` debe estar en el mismo nivel que `integration/`

### Pasos

1. **Instalar dependencias de integration:**

```bash
cd integration
npm install
```

2. **Instalar dependencias de frontend (si aún no lo has hecho):**

```bash
cd ../frontend
npm install
```

3. **Opcional: Instalar dependencias de figmamake (para estilos):**

```bash
cd ../figmamake
npm install
```

## 🎮 Uso

### Opción 1: Ejecutar todo con un comando

Desde la carpeta `integration/`:

```bash
npm run start-all
```

Esto ejecutará:
- Mock backend (json-server) en `http://localhost:4000`
- App de integración (Vite) en `http://localhost:3001`

### Opción 2: Ejecutar servicios por separado

**Terminal 1 - Mock Backend:**
```bash
cd integration
npm run mock
```

**Terminal 2 - App de Integración:**
```bash
cd integration
npm run dev
```

### Acceder a la aplicación

Abre tu navegador en: `http://localhost:3001`

## 👥 Credenciales de Demo

El mock backend incluye 3 usuarios de prueba:

| Email | Password | Rol | Descripción |
|-------|----------|-----|-------------|
| `ana@example.com` | `demo123` | `user` | Usuario normal (3 anotaciones) |
| `carlos@example.com` | `demo123` | `validator` | Validador (15 anotaciones) |
| `maria@example.com` | `demo123` | `agency` | Agencia (puede crear challenges) |

## 🎯 Funcionalidades Implementadas

### Usuario No Registrado
- ✅ Ver landing page
- ✅ Ver lista de challenges disponibles
- ✅ Ver ranking global
- ✅ Acceso a modal de login/registro

### Usuario Normal (`user`)
- ✅ Ver challenges disponibles
- ✅ Entrar en un challenge y ver el viewer
- ✅ Pintar anotaciones con brush (coordenadas normalizadas)
- ✅ Undo/Redo de strokes
- ✅ Zoom in/out
- ✅ Guardar anotación
- ✅ **Promoción automática a validator** al alcanzar 5 anotaciones
- ✅ Ver perfil con estadísticas
- ✅ Cerrar sesión

### Usuario Validador (`validator`)
- ✅ Todo lo del usuario normal
- ✅ Acceso a cola de validación
- ✅ Ver anotaciones pendientes
- ✅ Validar (aprobar/rechazar) anotaciones
- ✅ Añadir comentarios a validaciones

### Usuario Agencia (`agency`)
- ✅ Crear nuevos challenges
- ✅ Añadir múltiples imágenes (por URL)
- ✅ Ver challenges creados

## 🎨 Características Técnicas

### Canvas Overlay
- Coordenadas normalizadas [0,1] relativas al tamaño de imagen
- Sincronización con viewport de OpenSeadragon
- Stack de undo/redo
- Brush configurable (tamaño, opacidad)
- Export de anotaciones con bbox y strokes

### Seadragon Wrapper
- API mínima para conversión de coordenadas
- `viewportToImage()` - convierte píxeles a coordenadas de imagen
- `imageToViewport()` - convierte coordenadas de imagen a píxeles
- `normalizeCoords()` - normaliza a [0,1]
- `denormalizeCoords()` - desnormaliza
- Event listeners para cambios de viewport

### Mock Backend
- json-server con datos mock en `db.json`
- Endpoints RESTful simulados
- Lógica de promoción a validator automática
- Sistema de validaciones con consenso

### Estilos
- Importa tokens CSS desde `figmamake/src/index.css`
- Glassmorphism con estados hover/idle
- Variables CSS reutilizables
- Responsive design

## 🔧 Configuración Avanzada

### Variables de Entorno

Opcionalmente puedes crear un `.env` en `integration/`:

```env
VITE_API_URL=http://localhost:4000
VITE_TILE_URL=https://tu-bucket-s3.amazonaws.com/tiles
```

### Usar imágenes DZI reales

Para usar Deep Zoom Images (DZI) en lugar de imágenes simples, modifica el challenge en `db.json`:

```json
{
  "id": "image_001",
  "url": "placeholder",
  "width": 4000,
  "height": 3000,
  "dziUrl": "https://tu-bucket.s3.amazonaws.com/imagen.dzi"
}
```

Y actualiza `SeadragonWrapper.jsx` para usar `dziUrl` cuando esté disponible.

### Integrar con el viewer existente de `frontend/`

Si quieres usar el viewer existente en `frontend/`:

1. Expón el viewer como global en `frontend/src/main.tsx`:

```typescript
// En frontend después de inicializar viewer
window.viewer = viewer;
```

2. En `integration/src/lib/seadragon-wrapper.js`, usa:

```javascript
export const getViewer = () => {
  return window.viewer || viewerInstance;
};
```

## 🧪 Testing de Flows

### Flow 1: Anotación básica
1. Login como `ana@example.com`
2. Ir a un challenge
3. Seleccionar tool "Pincel"
4. Dibujar algunas anotaciones
5. Click en "Guardar Anotación"
6. Verificar que se incrementó el contador

### Flow 2: Promoción a validator
1. Login como usuario nuevo (o `ana@example.com` con 3 anotaciones)
2. Hacer 2 anotaciones más (total 5)
3. Al guardar la 5ta, ver banner "¡Felicidades! Eres Validador"
4. Verificar que aparece botón "Validar" en el menú

### Flow 3: Validación
1. Login como `carlos@example.com` (validator)
2. Click en "Validar" en el menú
3. Ver cola de anotaciones pendientes
4. Aprobar o rechazar con comentario opcional

### Flow 4: Crear challenge (Agency)
1. Login como `maria@example.com`
2. Click en "Agencia"
3. Llenar formulario con título, descripción y URLs de imágenes
4. Click en "Crear Challenge"
5. Verificar en Home que aparece el nuevo challenge

## 📊 Endpoints Mock

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/users` | Registrar usuario |
| `GET` | `/users` | Listar usuarios (para login) |
| `GET` | `/challenges` | Listar challenges |
| `GET` | `/challenges/:id` | Obtener challenge |
| `POST` | `/challenges` | Crear challenge (agency) |
| `GET` | `/annotations` | Listar anotaciones |
| `POST` | `/annotations` | Crear anotación |
| `PATCH` | `/annotations/:id` | Actualizar anotación |
| `POST` | `/validations` | Crear validación |
| `GET` | `/ranking` | Obtener ranking (computed) |

## 🎮 Atajos de Teclado

Próximamente (en Toolbox):
- `B` - Seleccionar Brush
- `E` - Seleccionar Eraser
- `M` - Seleccionar Move
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `+` - Zoom In
- `-` - Zoom Out

## 🐛 Troubleshooting

### El mock backend no arranca
```bash
# Verificar que json-server está instalado
npm install -g json-server

# O usar el local
npx json-server --watch db.json --port 4000
```

### Los estilos de figmamake no se aplican
Verifica que la ruta en `integration/index.css` sea correcta:
```css
@import url('../figmamake/src/index.css');
```

### El viewer no se ve
1. Verifica que OpenSeadragon está instalado
2. Copia la carpeta `public/openseadragon-images/` de frontend a integration
3. Asegúrate de que las URLs de imágenes sean válidas

### Error CORS con imágenes
Para desarrollo local, las imágenes placeholder deberían funcionar. Si usas imágenes externas, asegúrate de que permitan CORS.

## 📝 Notas de Implementación

### Coordenadas Normalizadas
Todas las anotaciones se guardan con coordenadas normalizadas [0,1] para ser independientes del tamaño/resolución de la imagen:

```javascript
const normalized = {
  x: imageX / imageWidth,
  y: imageY / imageHeight
};
```

### Promoción Automática
El sistema promociona automáticamente a `validator` cuando un usuario alcanza 5 anotaciones (demo threshold). En producción, este valor debería ser mayor (ej: 100-1000).

### Validaciones
Las validaciones se guardan separadas de las anotaciones para permitir múltiples validadores. La anotación cambia de estado cuando hay suficiente consenso (mock: 1 validación).

## 🚀 Próximos Pasos

Para convertir este prototipo en producción:

1. **Backend Real:** Reemplazar json-server con API REST (Django, FastAPI, Express)
2. **Base de Datos:** PostgreSQL o MongoDB
3. **Autenticación:** JWT tokens en lugar de mock
4. **Storage:** S3 o equivalente para imágenes y máscaras
5. **DZI Generation:** Pipeline para generar tiles desde imágenes full-res
6. **WebSockets:** Para updates en tiempo real (validaciones, rankings)
7. **Tests:** Unit tests (Vitest) e E2E (Playwright)

## 📄 Licencia

Este es un prototipo de demostración. Consulta con el equipo para licencia final.

## 🤝 Contribuir

Este prototipo es mantenido por el equipo de LookUp. Para dudas o mejoras, contacta al equipo.

---

**¡Disfruta anotando! 🚀🔭**

