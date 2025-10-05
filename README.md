# 🚀 LookUp - Scientific Image Annotation Platform

A fullstack web application for collaborative annotation of high-resolution scientific images. Users can participate in challenges by annotating Deep Zoom Images (DZI), validate others' work, and compete in a gamified point system.

## 🎯 Project Description

LookUp enables scientific agencies to create image annotation challenges where explorers annotate high-resolution images using an interactive viewer. The platform includes:

- **Role-based system**: Explorer, Validator, Agency
- **Gamification**: Points and auto-promotion system
- **OpenSeadragon integration**: For viewing and annotating gigapixel images
- **JWT authentication**: Secure, token-based authentication

## 🚀 Local Deployment

### Prerequisites
- Node.js 18+
- npm

### Installation & Run

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd LookUp
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../integration && npm install
   ```

2. **Start backend (port 3000):**
   ```bash
   cd backend
   node server.js
   ```

3. **Start frontend (port 3001):**
   ```bash
   cd integration
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/api/

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM 6** - Client-side routing
- **Axios** - HTTP client with JWT interceptors
- **OpenSeadragon 4.1** - Deep Zoom Image viewer
- **React Icons** - Icon library

### Backend
- **Node.js + Express 5.1** - REST API server
- **SQLite3 5.1.7** - Embedded relational database
- **jsonwebtoken 9.0.2** - JWT authentication
- **bcryptjs 3.0.2** - Password hashing
- **CORS** - Cross-origin resource sharing

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Frontend (React + Vite)          │
│   Port 3001                         │
│   - OpenSeadragon viewer            │
│   - Canvas overlay for annotations  │
│   - AuthContext + ToolboxContext    │
└─────────────────┬───────────────────┘
                  │ HTTP/REST + JWT
                  │ Vite Proxy: /api → :3000
┌─────────────────▼───────────────────┐
│   Backend (Node.js + Express)      │
│   Port 3000                         │
│   - JWT middleware                  │
│   - Role-based access control       │
│   - Business logic & scoring        │
└─────────────────┬───────────────────┘
                  │ SQL
┌─────────────────▼───────────────────┐
│   Database (SQLite)                 │
│   database.db                       │
└─────────────────────────────────────┘
```

### Key Components
- **Frontend**: Single Page Application with protected routes
- **Backend**: RESTful API with JWT authentication
- **Proxy**: Vite proxies `/api/*` to backend
- **Auth**: JWT tokens stored in localStorage, auto-injected via Axios interceptors

## 💾 Database Schema

```sql
users
├── id (UUID, PK)
├── name
├── email (UNIQUE)
├── password (bcrypt hashed)
└── total_score

roles
├── id (PK)
└── role_name (explorer, validator, agency)

users_roles (many-to-many)
├── user_id (FK → users)
└── role_id (FK → roles)

contests
├── id (PK)
├── agency_id (FK → users)
├── name
├── description
├── rules
└── end_date

images
├── id (PK)
├── contest_id (FK → contests)
├── dzi_url (URL to .dzi file)
└── metadata (JSON)

annotations
├── id (PK)
├── user_id (FK → users)
├── image_id (FK → images)
├── annotations_data (JSON array of shapes)
├── metadata (JSON)
├── status (pending, validated, rejected)
└── created_at

validations
├── id (PK)
├── annotation_id (FK → annotations)
├── validator_id (FK → users)
├── decision (approved, rejected)
└── comment

participant_contest (many-to-many)
├── user_id (FK → users)
├── contest_id (FK → contests)
└── score
```

### Key Relationships
- Users have one role (through users_roles)
- Contests belong to agencies, contain multiple images
- Annotations link users to images
- Validations link validators to annotations

---

**License:** MIT
