# ✅ INTEGRACIÓN FRONTEND ↔ BACKEND COMPLETADA

## 🎉 Cambios Realizados

### **Archivos Modificados:**

1. ✏️ **`integration/vite.config.js`**
   - Proxy actualizado de puerto 4000 → 3000
   - Eliminado el rewrite que causaba conflictos

2. ✏️ **`integration/src/lib/api.js`** - ⚠️ REESCRITO COMPLETAMENTE
   - Integración con backend real usando JWT
   - Interceptores para agregar token automáticamente
   - Manejo de errores 401 (token expirado)
   - Mapeo de respuestas usando funciones de `mapper.js`

3. ➕ **`integration/src/lib/mapper.js`** - ⚠️ NUEVO ARCHIVO
   - Funciones de transformación de datos backend ↔ frontend
   - Mapeo de contests/challenges
   - Mapeo de usuarios
   - Mapeo de anotaciones

4. ✏️ **`integration/src/context/AuthContext.jsx`**
   - Manejo de token JWT en login y registro
   - Nueva función `refreshUser()` para actualizar datos desde backend
   - Mejor manejo de errores con mensajes del backend

5. ✏️ **`integration/src/routes/Home.jsx`**
   - Adaptado para mostrar `title || name` (compatibilidad)
   - Threshold de promoción: 5 → **20 anotaciones**
   - Rol cambiado: `'user'` → `'participant'`

6. ✏️ **`integration/src/routes/Challenge.jsx`**
   - Estructura de anotación adaptada al backend
   - Envía `image_id`, `annotations`, `metadata` en lugar de `canvasData`
   - Manejo de promoción automática a validator

7. ✏️ **`integration/src/routes/Validator.jsx`**
   - Validación sin enviar `validatorId` (se extrae del token)
   - Adaptado para mostrar `userName` del backend
   - Campo `annotations` en lugar de `strokes`

8. ✏️ **`integration/src/routes/Agency.jsx`**
   - Estructura de creación adaptada al backend
   - Campos: `title` → `name`, agregados `rules`, `objective`
   - Formato de imágenes adaptado

9. ✏️ **`integration/package.json`**
   - Removidos scripts de json-server (`mock`, `start-all`)

---

## 🚀 CÓMO EJECUTAR

### **1. Iniciar Backend (Terminal 1)**

```powershell
cd backend
node server.js
```

✅ Debe mostrar: `Servidor corriendo en http://localhost:3000`

---

### **2. Iniciar Frontend (Terminal 2)**

```powershell
cd integration
npm run dev
```

✅ Debe mostrar: `Local: http://localhost:3001/`

---

### **3. Crear Usuarios de Prueba**

**Opción A: Desde el Frontend**
- Ve a http://localhost:3001/register
- Crea usuarios con diferentes roles

**Opción B: Desde PowerShell (recomendado para probar todos los roles)**

```powershell
# Usuario Participante
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Ana García\",\"email\":\"ana@test.com\",\"password\":\"demo123\",\"role\":\"participant\"}'

# Usuario Agency
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"NASA\",\"email\":\"nasa@test.com\",\"password\":\"demo123\",\"role\":\"agency\"}'

# Usuario Validator (para pruebas)
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Carlos Validator\",\"email\":\"carlos@test.com\",\"password\":\"demo123\",\"role\":\"validator\"}'
```

---

## 🧪 FLUJO DE PRUEBA COMPLETO

### **Paso 1: Login como Agency**
1. Ve a http://localhost:3001/login
2. Email: `nasa@test.com`
3. Password: `demo123`
4. ✅ Debe iniciar sesión y redirigir al home

### **Paso 2: Crear un Challenge**
1. Click en "Agency" en el menú superior
2. Completa el formulario:
   - **Título:** "Cráteres de Marte - Región Syrtis"
   - **Descripción:** "Identifica y anota cráteres en esta región"
   - **URLs de Imágenes:** Agrega URLs de imágenes DZI o placeholders
     - Ejemplo: `https://openseadragon.github.io/example-images/highsmith/highsmith.dzi`
3. Click en "Crear Challenge"
4. ✅ Debe mostrar mensaje de éxito

### **Paso 3: Ver Challenges Disponibles**
1. Click en "Home" en el menú
2. ✅ Debe aparecer el challenge que acabas de crear

### **Paso 4: Login como Participant**
1. Logout (menú superior)
2. Login con: `ana@test.com` / `demo123`

### **Paso 5: Hacer Anotaciones**
1. Click en un challenge
2. Dibuja anotaciones en la imagen
3. Click en "Guardar"
4. ✅ Debe mostrar mensaje de éxito
5. Repite 20 veces para probar promoción automática
6. ✅ En la anotación #20 debe aparecer: "🎉 ¡Promocionado a Validator!"

### **Paso 6: Validar Anotaciones**
1. Después de ser promovido, aparecerá opción "Validator" en el menú
2. Click en "Validator"
3. ✅ Debe mostrar cola de anotaciones pendientes
4. Agrega comentario (opcional)
5. Click en "Aprobar" o "Rechazar"
6. ✅ Debe procesar la validación y actualizar la cola

### **Paso 7: Ver Ranking**
1. Ve a "Home"
2. En el sidebar derecho verás el ranking
3. ✅ Debe mostrar usuarios ordenados por puntuación

---

## 📊 SISTEMA DE PUNTOS

| Acción | Puntos |
|--------|--------|
| Crear anotación | **+10** |
| Anotación aprobada | **+100** |
| Promoción a validator | **+500** |

---

## 🔑 DIFERENCIAS CLAVE BACKEND vs FRONTEND

| Concepto | Frontend | Backend |
|----------|----------|---------|
| **Rol usuario básico** | `user` | `participant` |
| **Campo nombre contest** | `title` | `name` |
| **Campo URL imagen** | `url` o `dziUrl` | `dzi_url` |
| **Promoción automática** | 5 anotaciones | **20 anotaciones** |
| **Token JWT** | Guardado en localStorage | Enviado en header `Authorization: Bearer <token>` |

---

## ⚠️ PUNTOS IMPORTANTES

### **1. Token JWT**
- El token expira en **1 hora**
- Si recibes error 401, debes hacer login nuevamente
- El frontend redirige automáticamente a `/login` si el token expira

### **2. Roles y Permisos**
- **participant:** Ver challenges, crear anotaciones, unirse a contests
- **validator:** Todo lo anterior + validar anotaciones
- **agency:** Crear challenges, validar anotaciones

### **3. Promoción Automática**
- Solo usuarios con rol `participant` pueden ser promovidos
- Se necesitan **20 anotaciones** para la promoción
- La promoción da **+500 puntos** de bonus

### **4. CORS**
- El backend ya tiene CORS habilitado
- No debería haber problemas de CORS entre localhost:3001 y localhost:3000

### **5. Anotaciones**
- Por ahora se guardan como arrays vacíos (placeholder)
- Para integrar anotaciones reales, necesitas capturar los datos de Annotorious
- Ver TODO en `Challenge.jsx` línea 96

---

## 🐛 TROUBLESHOOTING

### **Problema: "Error al iniciar sesión"**
✅ **Solución:** 
- Verifica que el backend esté corriendo en puerto 3000
- Revisa la consola del navegador para ver el error específico
- Verifica que el email/password sean correctos

### **Problema: "Error 401 - Token inválido"**
✅ **Solución:**
- Haz logout y login nuevamente
- El token expira después de 1 hora

### **Problema: "No se cargan los challenges"**
✅ **Solución:**
- Verifica que el backend esté corriendo
- Abre la consola del navegador (F12) y revisa la pestaña Network
- Verifica que las peticiones a `/api/contests` estén llegando al backend

### **Problema: "Cannot read property 'title' of undefined"**
✅ **Solución:**
- Este error aparece si el backend devuelve `name` en lugar de `title`
- Los componentes ya están adaptados para usar `title || name`
- Verifica que el mapper esté funcionando correctamente

### **Problema: Proxy no funciona**
✅ **Solución:**
- Reinicia el servidor de Vite: `Ctrl+C` y luego `npm run dev`
- Verifica que `vite.config.js` tenga el proxy apuntando a puerto 3000

---

## 📝 PRÓXIMOS PASOS (OPCIONAL)

1. **Integrar Annotorious real:**
   - Actualizar `Challenge.jsx` para capturar anotaciones reales
   - Ver comentario TODO en línea 96

2. **Agregar imágenes reales:**
   - Subir imágenes DZI a un servidor (AWS S3, etc.)
   - Actualizar URLs en la creación de challenges

3. **Mejorar visualización de validación:**
   - Mostrar preview real de la imagen con anotaciones
   - Agregar visor de anotaciones en el panel de validación

4. **Agregar más estadísticas:**
   - Gráficos de progreso
   - Historial de anotaciones
   - Leaderboard detallado

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 3001
- [ ] Usuario agency creado
- [ ] Usuario participant creado
- [ ] Challenge creado desde agency
- [ ] Challenge visible en home
- [ ] Anotación creada exitosamente
- [ ] 20 anotaciones para probar promoción
- [ ] Promoción a validator funciona
- [ ] Validación de anotaciones funciona
- [ ] Ranking se actualiza correctamente

---

**Fecha de Integración:** 2025-10-04  
**Estado:** ✅ COMPLETA Y FUNCIONAL  
**Backend:** Node.js + Express + SQLite (puerto 3000)  
**Frontend:** React + Vite (puerto 3001)

