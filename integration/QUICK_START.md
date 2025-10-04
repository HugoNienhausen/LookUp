# 🚀 Inicio Rápido - LookUp Integration

## 📦 Instalación en 3 Pasos

```bash
# 1. Instalar dependencias
cd integration
npm install

# 2. Iniciar mock backend + app
npm run start-all

# 3. Abrir navegador
# http://localhost:3001
```

## 🎮 Demo Rápido

### Login y Anotación (2 minutos)

1. **Login** con `ana@example.com` / `demo123`
2. Click en el challenge "Cráteres de Marte - Jezero"
3. Seleccionar tool **Pincel** 🖌️
4. Dibujar sobre la imagen
5. Click **Guardar Anotación** 💾
6. ¡Listo! Has contribuido al proyecto

### Ver Promoción a Validator (5 minutos)

1. Repetir el proceso de anotación **2 veces más** (Ana tiene 3, necesita 5)
2. En la 5ta anotación verás: **"🎉 ¡Felicidades! Ahora eres Validador"**
3. Aparecerá botón **"Validar"** en el menú superior
4. Click en **"Validar"** para ver la cola de validación

### Validar Anotaciones

1. **Login** con `carlos@example.com` / `demo123` (ya es validator)
2. Click en **"Validar"**
3. Revisar anotación pendiente
4. Click **✓ Aprobar** o **✗ Rechazar**

### Crear Challenge (Agency)

1. **Login** con `maria@example.com` / `demo123`
2. Click en **"Agencia"**
3. Llenar formulario:
   - Título: "Mi Challenge"
   - Descripción: "Descripción del challenge"
   - URLs: Usar placeholders como `https://via.placeholder.com/4000x3000/8B4513/FFFFFF?text=Mars`
4. Click **🚀 Crear Challenge**

## 🎯 Credenciales de Demo

| Email | Pass | Rol | Anotaciones |
|-------|------|-----|-------------|
| `ana@example.com` | `demo123` | Usuario | 3/5 |
| `carlos@example.com` | `demo123` | Validador | 15 |
| `maria@example.com` | `demo123` | Agencia | 0 |

## 🔧 Comandos Útiles

```bash
# Solo mock backend
npm run mock

# Solo app (requiere mock corriendo)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🐛 Problemas Comunes

### Puerto 4000 ocupado
```bash
# Cambiar puerto en vite.config.js y db.json
# O matar proceso en puerto 4000
```

### Estilos no se ven
```bash
# Verificar que figmamake/ existe en ../
ls ../figmamake/
```

### Viewer no carga
```bash
# Verificar que OpenSeadragon está instalado
npm list openseadragon
```

## 📚 Más Info

Ver **README.md** completo para detalles de arquitectura, endpoints, y deployment.

---

**¿Listo para anotar Marte? 🚀🔭**

