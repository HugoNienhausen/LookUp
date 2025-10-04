# 🚀 Hackathon Monorepo

Un monorepo completo con frontend React 18 + Vite + TypeScript y backend Django 5 + Django REST Framework.

## 📁 Estructura del Proyecto

```
hackathon/
├── frontend/          # React 18 + Vite + TypeScript
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Django 5 + DRF
│   ├── backend/
│   ├── api/
│   ├── manage.py
│   └── requirements.txt
├── package.json       # Workspace root
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm/yarn
- Python 3.11+ y pip
- Git

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <tu-repo>
   cd hackathon
   ```

2. **Instalar todas las dependencias:**
   ```bash
   npm run install:all
   ```

   O instalar por separado:
   ```bash
   # Instalar dependencias del workspace
   npm install
   
   # Instalar dependencias del frontend
   cd frontend && npm install
   
   # Instalar dependencias del backend
   cd ../backend && pip install -r requirements.txt
   ```

3. **Configurar variables de entorno:**
   
   El proyecto incluye archivos `.env` de ejemplo. Puedes modificarlos según tus necesidades:
   
   - `frontend/.env` - Variables del frontend
   - `backend/.env` - Variables del backend

4. **Ejecutar migraciones de Django:**
   ```bash
   npm run migrate
   ```

### 🏃‍♂️ Ejecutar el Proyecto

#### Opción 1: Ejecutar ambos servicios simultáneamente
```bash
npm run dev
```

#### Opción 2: Ejecutar servicios por separado

**Frontend (puerto 5173):**
```bash
npm run dev:frontend
# o
cd frontend && npm run dev
```

**Backend (puerto 8000):**
```bash
npm run start:backend
# o
cd backend && python manage.py runserver
```

## 📋 Scripts Disponibles

### Scripts del Workspace (raíz)
- `npm run dev` - Ejecuta frontend y backend simultáneamente
- `npm run dev:frontend` - Solo frontend
- `npm run dev:backend` - Solo backend
- `npm run install:all` - Instala todas las dependencias
- `npm run build:frontend` - Construye el frontend para producción
- `npm run migrate` - Ejecuta migraciones de Django
- `npm run makemigrations` - Crea nuevas migraciones

### Scripts del Frontend
- `npm run dev` - Servidor de desarrollo Vite
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de la construcción
- `npm run lint` - Linter de ESLint

## 🌐 URLs del Proyecto

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/
- **Admin Django:** http://localhost:8000/admin/

## 🔧 Configuración

### CORS
El backend está configurado para permitir requests desde `localhost:5173`. La configuración se encuentra en `backend/backend/settings.py`.

### Variables de Entorno

#### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

#### Backend (.env)
```
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Axios** - Cliente HTTP
- **OpenSeadragon** - Visor de imágenes de alta resolución
- **ESLint** - Linter

### Backend
- **Django 5** - Framework web
- **Django REST Framework** - API REST
- **django-cors-headers** - Manejo de CORS
- **python-decouple** - Manejo de variables de entorno

## 📝 Desarrollo

### Agregar Nuevas Dependencias

**Frontend:**
```bash
cd frontend
npm install <paquete>
```

**Backend:**
```bash
cd backend
pip install <paquete>
# Agregar a requirements.txt
pip freeze > requirements.txt
```

### Crear Nuevas Migraciones

```bash
npm run makemigrations
npm run migrate
```

## 🔍 DeepZoomViewer Component

El proyecto incluye un componente `DeepZoomViewer` para visualizar imágenes de alta resolución:

### Características
- ✅ Visualización de imágenes DZI (Deep Zoom Images)
- ✅ Controles de zoom, rotación y navegación
- ✅ Responsive design (100% width, 70vh height)
- ✅ ResizeObserver para manejo automático de redimensionamiento
- ✅ TypeScript con tipado completo

### Configuración de OpenSeadragon
```bash
# Instalar imágenes de control
cd frontend
./scripts/setup-openseadragon-images.sh
```

### Uso
```tsx
import DeepZoomViewer from './components/DeepZoomViewer';

<DeepZoomViewer
  dziUrl="https://example.com/image.dzi"
  maxZoomPixelRatio={2}
  showNavigator={true}
  onReady={() => console.log('Visor listo!')}
/>
```

## 🚀 Despliegue

### Frontend
```bash
npm run build:frontend
# Los archivos estáticos se generan en frontend/dist/
```

### Backend
```bash
cd backend
python manage.py collectstatic
python manage.py migrate
# Configurar servidor web (nginx, gunicorn, etc.)
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

¡Happy coding! 🎉
```

## 5. Scripts de configuración adicionales

```json:/Users/hugonienhausen/Desktop/hackathon/frontend/.eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

¡Listo! He creado un monorepo completo con:

## ✅ **Características implementadas:**

### **Frontend (React 18 + Vite + TypeScript)**
- Configuración completa de Vite con TypeScript
- React 18 con hooks modernos
- Interfaz atractiva con gradientes y efectos glassmorphism
- Integración con Axios para llamadas a la API
- Variables de entorno configuradas
- ESLint configurado

### **Backend (Django 5 + DRF)**
- Django 5 con Django REST Framework
- Configuración de CORS para localhost:5173
- Endpoints de ejemplo (`/api/` y `/api/info/`)
- Manejo de variables de entorno con python-decouple
- Configuración de idioma en español

### **Scripts de npm/yarn**
- `npm run dev` - Ejecuta ambos servicios simultáneamente
- `npm run dev:frontend` - Solo frontend (puerto 5173)
- `npm run dev:backend` - Solo backend (puerto 8000)
- `npm run install:all` - Instala todas las dependencias
- Scripts adicionales para migraciones y build

### **Configuración adicional**
- Archivos `.env` para ambas aplicaciones
- `.gitignore` completo
- README detallado con instrucciones
- Estructura de monorepo con workspaces

## 🚀 **Para empezar:**

```bash
# Ins
```


