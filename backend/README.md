# Cafeteria SaaS - Backend

Backend de una plataforma SaaS para gestión de cafeterías, con autenticación, administración de inventario y pagos integrados con Stripe.

## 📋 Descripción

Sistema completo de API REST construido con Express.js que permite:

- 🔐 **Autenticación**: Registro y login de propietarios de cafeterías con JWT
- ☕ **Gestión de Cafeterías**: Crear, actualizar y consultar información de cafeterías
- 📦 **Inventario**: Control de productos, categorías y cantidades
- 💳 **Pagos**: Integración con Stripe para suscripciones y checkout
- 👥 **Control de Acceso**: Middleware de autenticación para rutas protegidas

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js ^5.2.1
- **Base de Datos**: PostgreSQL + Prisma ORM ^6.19.3
- **Autenticación**: JWT (jsonwebtoken ^9.0.3)
- **Seguridad**: bcryptjs ^3.0.3 (hashing de contraseñas)
- **Pagos**: Stripe ^22.1.1
- **CORS**: cors ^2.8.6
- **Env Variables**: dotenv ^17.4.2
- **Dev**: nodemon ^3.1.14

## 📋 Requisitos Previos

- Node.js v18+ y npm v9+
- PostgreSQL 13+
- Cuenta de Stripe (para funcionalidad de pagos)

## ⚙️ Instalación

### 1. Clonar el repositorio y navegar al backend

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del backend:

```env
# Base de Datos
DATABASE_URL="postgresql://user:password@localhost:5432/cafeteria_db"

# JWT
JWT_SECRET="tu_super_secreto_jwt_aqui_cambiar_en_produccion"

# Puerto
PORT=3001

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Configurar la base de datos

```bash
# Crear y ejecutar migraciones
npx prisma migrate dev --name init

# Generar Prisma Client
npx prisma generate
```

### 5. Iniciar el servidor

**Desarrollo** (con hot-reload):
```bash
npm run dev
```

**Producción**:
```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 🗄️ Estructura del Proyecto

```
src/
├── index.js                    # Punto de entrada y configuración de Express
├── controllers/                # Lógica de negocio
│   ├── auth.controller.js     # Autenticación (register, login, me)
│   ├── cafeteria.controller.js # Gestión de cafeterías
│   ├── inventory.controller.js # Gestión de inventario
│   └── payment.controller.js   # Pagos y Stripe
├── middleware/                 # Middlewares
│   └── auth.middleware.js      # Validación de JWT
└── routes/                     # Definición de rutas
    ├── auth.routes.js
    ├── cafeteria.routes.js
    ├── inventory.routes.js
    └── payment.routes.js

prisma/
└── schema.prisma               # Definición del modelo de datos
```

## 🗃️ Base de Datos (Prisma)

### Modelos

#### **User**
```prisma
- id: String (UUID, PK)
- email: String (unique)
- password: String (hashed)
- role: Role (OWNER, ADMIN)
- createdAt: DateTime
- cafeteria: Cafeteria (relación 1:1)
```

#### **Cafeteria**
```prisma
- id: String (UUID, PK)
- name: String
- slug: String (unique) - identificador en URL
- logo: String? (URL)
- description: String?
- address: String?
- phone: String?
- userId: String (FK) - propietario
- status: Status (TRIAL, ACTIVE, SUSPENDED)
- stripeCustomerId: String? - para billing
- stripeSubId: String? - para suscripción
- createdAt: DateTime
- inventory: Inventory[] (relación 1:N)
```

#### **Inventory**
```prisma
- id: String (UUID, PK)
- name: String
- quantity: Float
- unit: String (kg, L, units, etc.)
- category: String
- method: String? (FIFO, LIFO, etc.)
- cafeteriaId: String (FK)
- createdAt: DateTime
- updatedAt: DateTime
```

### Enums

- **Role**: OWNER, ADMIN
- **Status**: TRIAL, ACTIVE, SUSPENDED

## 🔌 API Endpoints

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| POST | `/register` | ❌ | Registro de nuevo propietario |
| POST | `/login` | ❌ | Login con email/password |
| GET | `/me` | ✅ JWT | Obtener datos del usuario actual |

**Registro:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "securepass123",
  "cafeteriaName": "Mi Cafetería",
  "slug": "mi-cafeteria"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "cafeteria": {
      "id": "uuid",
      "name": "Mi Cafetería",
      "slug": "mi-cafeteria",
      "status": "TRIAL"
    }
  }
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "securepass123"
}
```

---

### ☕ Cafeterías (`/api/cafeteria`)

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/me` | ✅ JWT | Obtener datos de mi cafetería |
| PUT | `/me` | ✅ JWT | Actualizar datos de mi cafetería |
| GET | `/:slug` | ❌ | Obtener cafetería pública (solo ACTIVE) |

**Obtener mi cafetería:**
```bash
GET /api/cafeteria/me
Authorization: Bearer {token}
```

**Actualizar mi cafetería:**
```bash
PUT /api/cafeteria/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nueva Cafetería",
  "description": "La mejor cafetería del barrio",
  "phone": "+34 666 777 888",
  "address": "Calle Principal 123, Madrid"
}
```

**Obtener cafetería pública:**
```bash
GET /api/cafeteria/mi-cafeteria

# Respuesta incluye inventario ordenado por categoría
{
  "id": "uuid",
  "name": "Mi Cafetería",
  "slug": "mi-cafeteria",
  "description": "...",
  "status": "ACTIVE",
  "inventory": [
    {
      "id": "uuid",
      "name": "Café Molido",
      "quantity": 50,
      "unit": "kg",
      "category": "Bebidas"
    }
  ]
}
```

---

### 📦 Inventario (`/api/inventory`)

⚠️ **Todas las rutas requieren autenticación JWT**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar todo el inventario |
| POST | `/` | Crear nuevo producto |
| PUT | `/:id` | Actualizar producto |
| DELETE | `/:id` | Eliminar producto |

**Listar inventario:**
```bash
GET /api/inventory
Authorization: Bearer {token}
```

**Crear producto:**
```bash
POST /api/inventory
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Café Espresso",
  "quantity": 100,
  "unit": "kg",
  "category": "Café"
}
```

**Actualizar producto:**
```bash
PUT /api/inventory/product-id
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 75,
  "unit": "kg"
}
```

**Eliminar producto:**
```bash
DELETE /api/inventory/product-id
Authorization: Bearer {token}
```

---

### 💳 Pagos (`/api/payment`)

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| POST | `/create-checkout` | ✅ JWT | Crear sesión de pago Stripe |
| POST | `/portal` | ✅ JWT | Acceso a portal de billing |
| POST | `/webhook` | ❌ | Webhook para eventos de Stripe |

**Crear checkout:**
```bash
POST /api/payment/create-checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "pro" // o "basic", "enterprise"
}
```

**Portal de billing:**
```bash
POST /api/payment/portal
Authorization: Bearer {token}
```

---

### 🏥 Health Check

```bash
GET /health

Respuesta:
{ "ok": true }
```

## 🔐 Autenticación

El sistema usa **JWT (JSON Web Tokens)** con los siguientes detalles:

- **Algoritmo**: HS256
- **Tiempo de expiración**: 7 días
- **Headers requeridos**: `Authorization: Bearer {token}`
- **Payload incluye**: `id`, `email`, `role`

El middleware `auth.middleware.js` valida automáticamente todos los endpoints marcados con `auth`.

**Ejemplo de uso:**
```javascript
// Cliente
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3001/api/inventory', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🚀 Desarrollo

### Scripts disponibles

```bash
npm run dev      # Inicia con nodemon (desarrollo)
npm start        # Inicia en modo producción
```

### Hot-reload

El servidor con `npm run dev` se reinicia automáticamente al detectar cambios en los archivos.

### Migraciones de Prisma

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Ver estado de migraciones
npx prisma migrate status

# Revertir última migración
npx prisma migrate resolve --rolled-back nombre_migracion

# Abrir Prisma Studio (GUI)
npx prisma studio
```

## 🌐 CORS

El CORS está configurado para aceptar solicitudes desde la URL definida en `FRONTEND_URL`. En desarrollo, típicamente:

```
http://localhost:3000
```

Para producción, cambiar a la URL real del frontend.

## 🔒 Variables de Entorno (Seguridad)

⚠️ **NUNCA commitear el archivo `.env` al repositorio**

Archivo `.gitignore` debe incluir:
```
.env
.env.local
node_modules/
```

**Valores sensibles por entorno:**

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| JWT_SECRET | `dev_secret_123` | Generar aleatoriamente |
| PORT | 3001 | Desde process.env o 3001 |
| DATABASE_URL | Local PostgreSQL | Managed DB (AWS RDS, etc.) |
| STRIPE_SECRET_KEY | `sk_test_*` | `sk_live_*` |

## 🚨 Manejo de Errores

El servidor retorna códigos HTTP estándar:

| Código | Significado | Ejemplo |
|--------|-----------|---------|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Parámetros faltantes |
| 401 | Unauthorized | Token inválido/faltante |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Email/slug ya en uso |
| 500 | Server Error | Error interno del servidor |

**Ejemplo de respuesta de error:**
```json
{ "error": "Email o slug ya en uso" }
```

## 📦 Deployment

### Preparar para producción

1. **Variables de entorno**: Configurar todas las variables en el servidor
2. **Base de datos**: Usar PostgreSQL manageable (AWS RDS, Heroku Postgres, etc.)
3. **Stripe**: Cambiar a claves de producción (`sk_live_*`)
4. **CORS**: Establecer `FRONTEND_URL` real

### Plataformas recomendadas

- **Render.com** (simple, gratuito para pequeños proyectos)
- **Railway.app** (buena alternativa a Heroku)
- **AWS EC2 + RDS** (más control)
- **DigitalOcean** (buena relación precio-rendimiento)

### Ejemplo con Render

1. Conectar repositorio GitHub
2. Crear servicio Web Service
3. Build: `npm install`
4. Start: `npm start`
5. Agregar variables de entorno en dashboard
6. Deploy automático en cada push

## 🐛 Troubleshooting

### Error: `DATABASE_URL not found`
```bash
# Solución: crear archivo .env
echo 'DATABASE_URL="postgresql://..."' > .env
```

### Error: `Cannot find module 'express'`
```bash
# Solución: instalar dependencias
npm install
```

### Error: `Prisma Client not found`
```bash
# Solución: regenerar cliente
npx prisma generate
```

### El webhook de Stripe no funciona
- Verificar que `STRIPE_WEBHOOK_SECRET` es correcto
- El endpoint debe estar público (no `localhost`)
- Usar `stripe listen` en desarrollo para testing

### Token JWT expirado
- El cliente debe solicitar uno nuevo haciendo login
- En frontend, guardar token en `localStorage` o `sessionStorage`

## 📞 Soporte

Para reportar bugs o solicitar features, abrir issue en el repositorio.

---

**Última actualización**: Mayo 2026
**Versión**: 1.0.0
**Licencia**: ISC
