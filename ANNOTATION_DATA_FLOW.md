# 📊 FLUJO DE DATOS AL GUARDAR UNA ANOTACIÓN

## 🔍 **RESUMEN DEL FLUJO**

```
Challenge.jsx → api.createAnnotation() → mapper.mapAnnotationForBackend() → Backend (POST /api/annotations)
```

---

## 📝 **1. DATOS EN EL FRONTEND (Challenge.jsx)**

**Archivo:** `integration/src/routes/Challenge.jsx` (líneas 91-106)

```javascript
const handleSave = async () => {
    const currentImage = challenge.images[currentImageIndex];
    
    const annotationData = {
        imageId: currentImage.id,
        annotations: [],  // ⚠️ ACTUALMENTE VACÍO (ver nota abajo)
        metadata: {
            timestamp: new Date().toISOString(),
            imageIndex: currentImageIndex,
            challengeId: id
        }
    };
    
    await api.createAnnotation(annotationData);
};
```

### **Estructura de datos enviada:**
```javascript
{
    imageId: 1,                    // ID de la imagen
    annotations: [],               // Array de anotaciones (actualmente vacío)
    metadata: {
        timestamp: "2025-10-04T12:30:45.123Z",
        imageIndex: 0,             // Índice de la imagen actual
        challengeId: "1"           // ID del challenge
    }
}
```

---

## 🔄 **2. TRANSFORMACIÓN EN api.js**

**Archivo:** `integration/src/lib/api.js` (líneas 173-192)

```javascript
export const createAnnotation = async (annotationData) => {
    // 1. Transforma los datos al formato del backend
    const backendData = mapAnnotationForBackend(annotationData);
    
    // 2. Envía al backend
    const { data } = await client.post('/annotations', backendData);
    
    // 3. Maneja la respuesta (por si hay promoción)
    const result = {
        annotation: data,
        userUpdates: null
    };
    
    if (data.promoted) {
        result.userUpdates = {
            role: data.new_role,
            score: data.bonus_points
        };
    }
    
    return result;
};
```

---

## 🗺️ **3. MAPEO EN mapper.js**

**Archivo:** `integration/src/lib/mapper.js` (líneas 79-88)

```javascript
export const mapAnnotationForBackend = (frontendAnnotation) => {
    return {
        image_id: frontendAnnotation.imageId,        // imageId → image_id
        annotations: frontendAnnotation.annotations || [],
        metadata: {
            timestamp: new Date().toISOString(),
            ...frontendAnnotation.metadata
        }
    };
};
```

### **Transformación de campos:**
| Frontend | Backend |
|----------|---------|
| `imageId` | `image_id` |
| `annotations` | `annotations` |
| `metadata` | `metadata` |

---

## 📤 **4. DATOS ENVIADOS AL BACKEND**

**Endpoint:** `POST http://localhost:3000/api/annotations`

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT>
```

**Body (JSON):**
```json
{
    "image_id": 1,
    "annotations": [],
    "metadata": {
        "timestamp": "2025-10-04T12:30:45.123Z",
        "imageIndex": 0,
        "challengeId": "1"
    }
}
```

**⚠️ IMPORTANTE:** 
- El `user_id` NO se envía en el body
- El backend lo extrae automáticamente del token JWT
- Por seguridad, no se puede falsificar el usuario

---

## 🎯 **5. PROCESAMIENTO EN EL BACKEND**

**Archivo:** `backend/server.js` (líneas 142-235)

El backend recibe:
```javascript
{
    image_id: 1,
    annotations: [],
    metadata: { ... }
}
```

Y hace lo siguiente:

1. **Extrae user_id del token JWT:**
   ```javascript
   const user_id = req.user.userId;  // Del middleware verifyTokenAndRole
   ```

2. **Guarda en la base de datos:**
   ```sql
   INSERT INTO annotations (user_id, image_id, annotations_data, metadata, status) 
   VALUES (?, ?, ?, ?, 'pending')
   ```

3. **Datos guardados:**
   - `user_id`: Extraído del token
   - `image_id`: 1
   - `annotations_data`: `"[]"` (JSON stringificado)
   - `metadata`: `"{\"timestamp\":\"...\",\"imageIndex\":0,\"challengeId\":\"1\"}"` (JSON stringificado)
   - `status`: `"pending"`

4. **Da puntos al usuario:**
   ```sql
   UPDATE users SET total_score = total_score + 10 WHERE id = ?
   ```

5. **Verifica promoción automática:**
   - Si el usuario tiene ≥ 20 anotaciones y es `participant`:
     - Cambia rol a `validator`
     - Da bonus de +500 puntos
     - Devuelve `promoted: true`

---

## 📥 **6. RESPUESTA DEL BACKEND**

### **Sin promoción:**
```json
{
    "message": "Anotación guardada correctamente",
    "annotation_id": 42,
    "annotations_count": 5
}
```

### **Con promoción (20+ anotaciones):**
```json
{
    "message": "Anotación guardada correctamente",
    "annotation_id": 42,
    "promoted": true,
    "new_role": "validator",
    "bonus_points": 500,
    "annotations_count": 20
}
```

---

## ⚠️ **PROBLEMA ACTUAL: ANOTACIONES VACÍAS**

### **Estado Actual:**
```javascript
annotations: []  // Siempre vacío
```

En `Challenge.jsx` línea 100, hay un comentario:
```javascript
// TODO: Aquí deberías obtener las anotaciones reales de Annotorious
// Por ahora, guardamos un ejemplo básico
```

### **Lo que debería enviarse:**

Si estuvieras usando Annotorious (librería de anotaciones), deberías capturar algo como:

```javascript
const annotations = anno.getAnnotations();  // Obtener anotaciones de Annotorious

const annotationData = {
    imageId: currentImage.id,
    annotations: annotations,  // Array con las anotaciones reales
    metadata: {
        timestamp: new Date().toISOString(),
        imageIndex: currentImageIndex,
        challengeId: id
    }
};
```

**Ejemplo de anotación de Annotorious:**
```json
{
    "@context": "http://www.w3.org/ns/anno.jsonld",
    "id": "#annotation-1",
    "type": "Annotation",
    "body": [{
        "type": "TextualBody",
        "value": "Cráter de impacto",
        "purpose": "commenting"
    }],
    "target": {
        "selector": {
            "type": "FragmentSelector",
            "conformsTo": "http://www.w3.org/TR/media-frags/",
            "value": "xywh=pixel:100,200,300,400"
        }
    }
}
```

---

## 🔧 **CÓMO ARREGLARLO**

### **Opción 1: Usar CanvasOverlay**

Si estás dibujando en el `CanvasOverlay.jsx`, necesitas:

1. **Crear una función para obtener los datos del canvas:**
   ```javascript
   // En CanvasOverlay.jsx
   export const getCanvasData = () => {
       const canvas = document.querySelector('canvas');
       return canvas.toDataURL();  // O los datos de las formas dibujadas
   };
   ```

2. **Llamarla en handleSave:**
   ```javascript
   import { getCanvasData } from '../components/CanvasOverlay';
   
   const handleSave = async () => {
       const canvasData = getCanvasData();
       
       const annotationData = {
           imageId: currentImage.id,
           annotations: [canvasData],  // Datos reales del canvas
           metadata: { ... }
       };
   };
   ```

### **Opción 2: Usar Annotorious (Recomendado)**

Si integras la librería Annotorious:

```javascript
import { Annotorious } from '@recogito/annotorious';

// Al inicializar el viewer
const anno = new Annotorious({ image: 'openseadragon' });

// Al guardar
const handleSave = async () => {
    const annotations = anno.getAnnotations();
    
    const annotationData = {
        imageId: currentImage.id,
        annotations: annotations,
        metadata: { ... }
    };
};
```

---

## 📊 **RESUMEN DE LA BASE DE DATOS**

### **Tabla `annotations`:**
```sql
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                  -- Extraído del token JWT
    image_id TEXT,                 -- Del frontend
    annotations_data TEXT,         -- JSON stringificado del array annotations
    metadata TEXT,                 -- JSON stringificado del objeto metadata
    status TEXT DEFAULT 'pending', -- pending, validated, rejected
    created_at TIMESTAMP
)
```

### **Ejemplo de registro en la BD:**
```
id: 1
user_id: "550e8400-e29b-41d4-a716-446655440000"
image_id: "1"
annotations_data: "[]"
metadata: "{\"timestamp\":\"2025-10-04T12:30:45.123Z\",\"imageIndex\":0,\"challengeId\":\"1\"}"
status: "pending"
created_at: 2025-10-04 12:30:45
```

---

## 🎯 **CONCLUSIÓN**

**Actualmente se envía:**
- ✅ `image_id`: ID de la imagen
- ⚠️ `annotations`: Array vacío `[]`
- ✅ `metadata`: Timestamp, índice de imagen, ID del challenge
- ✅ `user_id`: Se extrae del token JWT (no se envía en el body)

**Falta implementar:**
- 📝 Capturar las anotaciones reales del canvas o de Annotorious
- 🎨 Guardar las coordenadas, formas, o datos de las anotaciones dibujadas

---

**Fecha:** 2025-10-04  
**Estado:** Flujo funcional pero con anotaciones vacías  
**Próximo paso:** Integrar captura de anotaciones reales del canvas

