# ✅ FASE 2 COMPLETADA - Adaptación Backend ↔ Frontend

## 🎯 Objetivos Cumplidos

La Fase 2 ha implementado todos los endpoints y lógica necesaria para que el backend esté completamente funcional y listo para conectarse con el frontend.

---

## 📊 Cambios en Base de Datos (`database.js`)

### **Tabla `annotations` actualizada:**
```sql
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    image_id TEXT,                    -- NUEVO - Referencia directa a imagen
    annotations_data TEXT,            -- NUEVO (antes: coordinates)
    metadata TEXT,                    -- NUEVO
    status TEXT DEFAULT 'pending',    -- NUEVO
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (image_id) REFERENCES images(id)
)
```

**Nota:** `contest_id` fue eliminado porque se puede obtener mediante: 
`image_id` → `images` → `dataset_id` → `datasets` → `contest_id`

### **Nueva tabla `validations`:**
```sql
CREATE TABLE validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    annotation_id INTEGER,
    validator_id TEXT,
    decision TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (annotation_id) REFERENCES annotations(id),
    FOREIGN KEY (validator_id) REFERENCES users(id)
)
```

---

## 🔧 Cambios en Server (`server.js`)

### **Endpoints Modificados:**

#### **1. POST /api/annotations** 🔒 AHORA PROTEGIDO
**Antes:**
- Sin autenticación
- Recibía `user_id` en el body (inseguro)
- Solo guardaba coordenadas

**Ahora:**
- ✅ Requiere token JWT
- ✅ Extrae `user_id` del token (más seguro)
- ✅ Acepta estructura completa: `image_id`, `annotations`, `metadata`
- ✅ Da +10 puntos por anotación
- ✅ **Auto-promoción a validator:** Si el usuario alcanza 20 anotaciones:
  - Cambia rol: `participant` → `validator`
  - Bonus: +500 puntos
  - Devuelve: `promoted: true, new_role: 'validator'`

**Request esperado:**
```json
{
  "image_id": 1,
  "annotations": [...], // Array de Annotorious
  "metadata": {
    "tool": "annotorious",
    "timestamp": "2025-10-04T..."
  }
}
```

**Response (con promoción):**
```json
{
  "message": "Anotación guardada correctamente",
  "annotation_id": 20,
  "promoted": true,
  "new_role": "validator",
  "bonus_points": 500,
  "annotations_count": 20
}
```

---

#### **2. GET /api/users/me** 📈 MEJORADO
**Antes:**
- Solo datos básicos del usuario

**Ahora incluye estadísticas:**
```json
{
  "id": "uuid...",
  "name": "Usuario",
  "email": "email@ejemplo.com",
  "role": "participant",
  "score": 50,
  "annotations_count": 5,           // NUEVO
  "validated_annotations": 2,       // NUEVO
  "rank": 3                          // NUEVO - posición en ranking
}
```

---

### **Nuevos Endpoints:**

#### **3. GET /api/contests/:id** 📦
Obtiene un concurso específico con todas sus imágenes.

**Response:**
```json
{
  "id": 1,
  "name": "Cráteres de Marte",
  "description": "...",
  "images": [
    {
      "id": 1,
      "dzi_url": "https://...",
      "metadata": "...",
      "dataset_name": "Dataset 1"
    }
  ]
}
```

---

#### **4. GET /api/annotations** 🔍
Obtiene anotaciones con filtros opcionales (hace JOIN para obtener contest_id).

**Query params:**
- `contest_id` - Filtrar por concurso (hace JOIN con images→datasets)
- `status` - Filtrar por estado (pending, validated, rejected)
- `user_id` - Filtrar por usuario

**Ejemplos:**
```bash
# Cola de validación
GET /api/annotations?status=pending

# Anotaciones de un concurso (JOIN automático)
GET /api/annotations?contest_id=1

# Anotaciones de un usuario
GET /api/annotations?user_id=uuid...
```

**Response incluye:**
```json
[
  {
    "id": 1,
    "user_id": "...",
    "image_id": 1,
    "user_name": "Usuario",
    "dzi_url": "https://...",
    "contest_id": 1,  // Obtenido via JOIN
    "annotations_data": [...],
    "metadata": {...},
    "status": "pending"
  }
]
```

---

#### **5. POST /api/annotations/:id/validate** ✅❌
Validar una anotación (solo validators y agencies).

**Request:**
```json
{
  "decision": "approved",  // o "rejected"
  "comment": "Excelente trabajo"
}
```

**Response:**
```json
{
  "message": "Validación guardada correctamente",
  "validation_id": 1,
  "decision": "approved",
  "points_awarded": 100
}
```

**Efectos:**
- Cambia el estado de la anotación
- Si `approved`: da +100 puntos al usuario
- Guarda registro en tabla `validations`

---

#### **6. GET /api/ranking** 🏆
Obtiene el ranking global de usuarios.

**Query params:**
- `limit` - Número de usuarios (default: 10)

**Response:**
```json
[
  {
    "id": "uuid...",
    "name": "Usuario 1",
    "score": 1000,
    "role": "validator",
    "annotations_count": 10,
    "rank": 1
  },
  {
    "id": "uuid...",
    "name": "Usuario 2",
    "score": 500,
    "role": "participant",
    "annotations_count": 5,
    "rank": 2
  }
]
```

---

#### **7. POST /api/contests/:id/datasets** 🗂️
Crear dataset en un concurso (solo agencies).

**Request:**
```json
{
  "name": "Mars Craters - Set 1",
  "description": "Primera colección de imágenes"
}
```

---

#### **8. POST /api/datasets/:id/images** 🖼️
Agregar imágenes a un dataset (solo agencies).

**Request:**
```json
{
  "images": [
    {
      "dzi_url": "https://ejemplo.com/imagen1.dzi",
      "metadata": {
        "width": 4000,
        "height": 3000
      }
    },
    {
      "dzi_url": "https://ejemplo.com/imagen2.dzi",
      "metadata": {}
    }
  ]
}
```

---

#### **9-11. Alias de Endpoints** 🔄
Para compatibilidad con frontend:

- `GET /api/challenges` → `/api/contests`
- `POST /api/challenges` → `/api/contests`
- `GET /api/challenges/:id` → `/api/contests/:id`

---

## 📋 Resumen de Todos los Endpoints

### **Autenticación (2)**
1. `POST /api/auth/register` - Registro
2. `POST /api/auth/login` - Login (devuelve token + user data)

### **Usuarios (1)**
3. `GET /api/users/me` 🔒 - Perfil con estadísticas

### **Concursos (5)**
4. `GET /api/contests` - Listar todos
5. `GET /api/contests/:id` - Obtener uno específico con imágenes
6. `POST /api/contests` 🔒 - Crear (solo agency)
7. `POST /api/contests/:id/join` 🔒 - Unirse (solo participant)
8. `GET /api/contests/:id/images` 🔒 - Obtener imágenes

### **Anotaciones (3)**
9. `POST /api/annotations` 🔒 - Guardar (con auto-promoción)
10. `GET /api/annotations` 🔒 - Listar con filtros
11. `POST /api/annotations/:id/validate` 🔒 - Validar (solo validator/agency)

### **Estadísticas (1)**
12. `GET /api/ranking` - Ranking global

### **Datasets e Imágenes (2)**
13. `POST /api/contests/:id/datasets` 🔒 - Crear dataset (solo agency)
14. `POST /api/datasets/:id/images` 🔒 - Agregar imágenes (solo agency)

### **Alias (3)**
15-17. `/api/challenges/*` - Alias de `/api/contests/*`

**Total: 17 endpoints** (antes solo 8)

🔒 = Requiere autenticación

---

## 🎮 Sistema de Puntos

| Acción | Puntos |
|--------|--------|
| Crear anotación | +10 |
| Anotación validada (aprobada) | +100 |
| Promoción a validator | +500 |

**Total por anotación aprobada:** +110 puntos

---

## 🎖️ Sistema de Promoción Automática

```
Usuario registrado
    ↓
Rol: participant (0 anotaciones)
    ↓
Crea anotaciones... (1, 2, 3... 19)
    ↓
20va anotación ✨
    ↓
AUTO-PROMOCIÓN
    ↓
Rol: validator
    + 500 puntos bonus
    + Puede validar anotaciones de otros
```

---

## 🔐 Seguridad Mejorada

### **Antes (Fase 1):**
- ❌ Endpoint de anotaciones sin protección
- ❌ `user_id` enviado en el body (manipulable)
- ❌ Sin verificación de roles

### **Ahora (Fase 2):**
- ✅ Todos los endpoints críticos protegidos
- ✅ `user_id` extraído del token JWT
- ✅ Verificación de roles en cada endpoint
- ✅ Validación de inputs

---

## 🧪 Cómo Probar

### **1. Elimina la base de datos antigua:**
```powershell
cd app\LookUp\backend
Remove-Item database.db -ErrorAction SilentlyContinue
```

### **2. Inicia el servidor:**
```powershell
node server.js
```

### **3. Registra usuarios de prueba:**
```powershell
# Participant
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{\"name\":\"Ana\",\"email\":\"ana@test.com\",\"password\":\"123456\",\"role\":\"participant\"}'

# Agency
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{\"name\":\"NASA\",\"email\":\"nasa@test.com\",\"password\":\"123456\",\"role\":\"agency\"}'
```

### **4. Login y guarda el token:**
```powershell
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"ana@test.com\",\"password\":\"123456\"}'
```

### **5. Prueba el ranking:**
```powershell
curl http://localhost:3000/api/ranking
```

### **6. Prueba crear anotación (con token):**
```powershell
curl -X POST http://localhost:3000/api/annotations `
  -H "Authorization: Bearer TU_TOKEN_AQUI" `
  -H "Content-Type: application/json" `
  -d '{\"image_id\":1,\"annotations\":[{\"type\":\"rectangle\"}],\"metadata\":{}}'
```

### **7. Ver perfil con estadísticas:**
```powershell
curl http://localhost:3000/api/users/me `
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## ✅ Checklist de Funcionalidades

- ✅ Autenticación JWT completa
- ✅ Sistema de roles funcional (participant/validator/agency)
- ✅ Auto-promoción a validator
- ✅ Sistema de puntuación
- ✅ Validación de anotaciones
- ✅ Ranking global
- ✅ Gestión de datasets e imágenes
- ✅ Filtros y búsquedas
- ✅ Estadísticas de usuarios
- ✅ Seguridad (todos los endpoints protegidos)
- ✅ Alias para compatibilidad con frontend
- ✅ Sin errores de linting

---

## 🎯 Estado Actual

**Backend:** ✅ COMPLETO Y FUNCIONAL

El backend ahora tiene:
- API REST completa
- Autenticación y autorización
- Lógica de negocio implementada
- Sistema de gamificación
- Validación de datos
- Estadísticas y rankings

**Próximo paso:** Fase 3 - Conectar el frontend al backend real

---

## 📝 Notas Importantes

1. **Base de datos:** Debes regenerar `database.db` para aplicar los cambios
2. **Tokens:** Expiran en 1 hora, después hay que hacer login de nuevo
3. **Auto-promoción:** Solo funciona para usuarios con rol `participant`
4. **Validación:** Solo validators y agencies pueden validar anotaciones
5. **Puntos:** Se otorgan automáticamente al aprobar anotaciones

---

**Fecha:** 2025-10-04
**Estado:** ✅ FASE 2 COMPLETADA
**Siguiente:** Fase 3 - Integración Frontend

