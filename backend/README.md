# Cafeteria SaaS - Backend

API REST para una plataforma SaaS que permite a propietarios de cafeterías gestionar su inventario, perfil y pagos. Backend completo con autenticación JWT, integración Stripe y base de datos PostgreSQL con Prisma ORM.

## 📋 Descripción General

Sistema de backend escalable construido con Express.js v5, que proporciona:

- 🔐 **Autenticación JWT**: Registro e inicio de sesión de propietarios con tokens de 7 días
- ☕ **Gestión de Cafeterías**: CRUD de perfiles de cafetería con slug único
- 📦 **Inventario**: Control completo de productos (café, insumos, métodos de extracción)
- 💳 **Integración Stripe**: Checkout de suscripciones y portal de facturación
- 🔒 **Middleware de Seguridad**: Validación JWT en rutas protegidas
- 📱 **CORS Configurado**: Para comunicación segura con frontend

**Base de datos**: PostgreSQL en Supabase con Prisma ORM v7 y adapter pg.
**Características**: Transacciones, relaciones, enums, timestamps automáticos.

---

## 🛠️ Tech Stack

| Componente | Paquete | Versión | Propósito |
|-----------|---------|---------|-----------|
| **Framework** | express | ^5.2.1 | Servidor HTTP |
| **ORM** | @prisma/client | ^7.8.0 | Acceso a BD |
| **Adapter BD** | @prisma/adapter-pg | ^7.8.0 | PostgreSQL pooling |
| **Driver BD** | pg | ^8.21.0 | Cliente PostgreSQL |
| **Autenticación** | jsonwebtoken | ^9.0.3 | JWT tokens |
| **Seguridad** | bcryptjs | ^3.0.3 | Hash de contraseñas |
| **Pagos** | stripe | ^22.1.1 | Suscripciones |
| **CORS** | cors | ^2.8.6 | Control de origen |
| **Env** | dotenv | ^17.4.2 | Variables de entorno |
| **Dev** | nodemon | ^3.1.14 | Hot-reload |
| **Dev** | prisma | ^7.8.0 | CLI de Prisma |

**Runtime**: Node.js v18+ | **Package manager**: npm v9+

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── db.js                      # Conexión Prisma con adapter pg
│   ├── index.js                   # Servidor Express + rutas
│   ├── controllers/               # Lógica de negocio
│   │   ├── auth.controller.js    # register, login, me
│   │   ├── cafeteria.controller.js # getMe, updateMe
│   │   ├── inventory.controller.js # CRUD inventario
│   │   └── payment.controller.js  # checkout, portal, webhook
│   ├── middleware/
│   │   └── auth.middleware.js    # Validación JWT
│   ├── routes/                    # Definición de rutas (Express Router)
│   │   ├── auth.routes.js
│   │   ├── cafeteria.routes.js
│   │   ├── inventory.routes.js
│   │   └── payment.routes.js
│   └── routers/                   # (Vacío - no se usa actualmente)
├── prisma/
│   ├── schema.prisma              # Modelos de BD (User, Cafeteria, Inventory)
│   └── migrations/                # (Se crea con npx prisma migrate)
├── .env                           # Variables de entorno
├── .gitignore                     # Git exclusions
├── prisma.config.ts               # Configuración Prisma
├── package.json                   # Dependencias y scripts
└── README.md                      # Este archivo
```

---

## 🗃️ Base de Datos (Prisma v7)

### Arquitectura

- **Datasource**: PostgreSQL en Supabase
- **Adapter**: @prisma/adapter-pg (pooling con pg)
- **Configuración**: `DATABASE_URL` para transacciones, `DIRECT_URL` para migraciones
- **Timestamps**: `createdAt` (inmutable), `updatedAt` (automático)

### Modelos Detallados

#### **User**

Usuario propietario de una cafetería.

```prisma
model User {
  id        String     @id @default(uuid())      # UUIDv4 único
  email     String     @unique                   # Único, índice automático
  password  String                              # Hashed con bcryptjs
  role      Role       @default(OWNER)          # OWNER o ADMIN
  createdAt DateTime   @default(now())          # Timestamp creación
  cafeteria Cafeteria?                          # Relación 1:1 (opcional)
}
```

**Características**:
- Email único asegura un usuario por dirección
- Contraseña nunca se retorna en respuestas
- role por defecto es OWNER
- Cada usuario puede tener una sola cafetería

---

#### **Cafeteria**

Perfil de la cafetería del usuario.

```prisma
model Cafeteria {
  id               String      @id @default(uuid())      # UUIDv4 único
  name             String                               # Nombre de la cafetería
  slug             String      @unique                  # Identificador URL (ej: "mi-cafeteria")
  logo             String?                              # URL de logo (nullable)
  description      String?                              # Descripción (nullable)
  address          String?                              # Dirección (nullable)
  phone            String?                              # Teléfono (nullable)
  userId           String      @unique                  # FK a User (1:1)
  user             User        @relation(fields: [userId], references: [id])
  status           Status      @default(TRIAL)          # TRIAL, ACTIVE, SUSPENDED
  stripeCustomerId String?                              # ID cliente en Stripe
  stripeSubId      String?                              # ID suscripción en Stripe
  createdAt        DateTime    @default(now())
  inventory        Inventory[]                          # Relación 1:N
}
```

**Características**:
- `slug`: Identificador único en URL pública (ej: `/cafe/mi-cafeteria`)
- `status`: Determina si es visible públicamente (solo ACTIVE)
- `stripeCustomerId` + `stripeSubId`: Se completan cuando pago exitoso
- Relación 1:N con Inventory (una cafetería puede tener muchos productos)

**Estados**:
- 🟡 `TRIAL`: Nuevo registro (gratuito temporalmente)
- 🟢 `ACTIVE`: Suscripción pagada
- 🔴 `SUSPENDED`: Suscripción cancelada o pago fallido

---

#### **Inventory**

Productos/insumos de la cafetería (café, leche, jarabes, métodos, equipo).

```prisma
model Inventory {
  id          String    @id @default(uuid())      # UUIDv4 único
  name        String                              # Nombre del producto
  quantity    Float                               # Cantidad numérica
  unit        String                              # Unidad (g, kg, ml, l, piezas, bolsas)
  category    String                              # Categoría (café, leche, jarabe, etc.)
  method      String?                             # Método de extracción (nullable)
  cafeteriaId String                              # FK a Cafeteria
  cafeteria   Cafeteria @relation(fields: [cafeteriaId], references: [id])
  updatedAt   DateTime  @updatedAt                # Actualizado automáticamente
  createdAt   DateTime  @default(now())
}
```

**Características**:
- `quantity`: Float permite decimales (ej: 2.5 kg de café)
- `unit`: String flexible (el frontend valida contra lista fija)
- `method`: Nullable porque no todos los insumos tienen método
- Relación N:1 con Cafeteria
- `updatedAt` se actualiza automáticamente en cada cambio

---

### Enums

#### **Role**
```prisma
enum Role {
  OWNER  # Propietario de cafetería
  ADMIN  # Administrador (futuro)
}
```

#### **Status**
```prisma
enum Status {
  TRIAL      # Prueba gratuita
  ACTIVE     # Suscripción activa
  SUSPENDED  # Suspendida (pago fallido o cancelada)
}
```

---

## 🔌 API Endpoints Detallados

### Base URL: `http://localhost:4000/api`

---

### 🔐 **Autenticación** (`POST /auth/...`)

#### 1. **Registro**

```http
POST /auth/register
Content-Type: application/json

{
  "email": "owner@cafeteria.com",
  "password": "SecurePass123!",
  "cafeteriaName": "Café con C",
  "slug": "cafe-con-c"
}
```

**Validaciones**:
- `email`: Requerido, único
- `password`: Requerido
- `cafeteriaName`: Requerido
- `slug`: Requerido, único

**Respuesta exitosa** (201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "owner@cafeteria.com",
    "cafeteria": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Café con C",
      "slug": "cafe-con-c",
      "status": "TRIAL"
    }
  }
}
```

**Errores posibles**:
- `400`: Faltan campos requeridos
- `409`: Email o slug ya en uso (código `P2002` de Prisma)
- `500`: Error interno del servidor

---

#### 2. **Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "owner@cafeteria.com",
  "password": "SecurePass123!"
}
```

**Validaciones**:
- `email`: Requerido
- `password`: Requerido

**Respuesta exitosa** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "owner@cafeteria.com",
    "cafeteria": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Café con C",
      "slug": "cafe-con-c",
      "status": "TRIAL"
    }
  }
}
```

**Errores posibles**:
- `401`: Credenciales incorrectas (usuario no existe o contraseña inválida)
- `500`: Error interno del servidor

**Token JWT**:
- Algoritmo: HS256
- Expira en: 7 días (604800 segundos)
- Payload: `{ id, email, role }`

---

#### 3. **Obtener usuario actual**

```http
GET /auth/me
Authorization: Bearer {token}
```

**Respuesta exitosa** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "owner@cafeteria.com",
  "role": "OWNER",
  "createdAt": "2026-05-25T10:30:00Z",
  "cafeteria": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Café con C",
    "slug": "cafe-con-c",
    "status": "TRIAL"
  }
}
```

**Errores posibles**:
- `401`: Token faltante o inválido
- `404`: Usuario no encontrado
- `500`: Error interno

**Nota**: La contraseña nunca se retorna en la respuesta.

---

### ☕ **Cafeterías** (`GET/PUT /cafeteria/...`)

#### 1. **Obtener mi cafetería**

```http
GET /cafeteria/me
Authorization: Bearer {token}
```

**Respuesta exitosa** (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Café con C",
  "slug": "cafe-con-c",
  "logo": "https://example.com/logo.png",
  "description": "La mejor cafetería del barrio",
  "address": "Calle Principal 123, Madrid",
  "phone": "+34 666 777 888",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "TRIAL",
  "stripeCustomerId": null,
  "stripeSubId": null,
  "createdAt": "2026-05-25T10:30:00Z"
}
```

**Errores posibles**:
- `401`: Token inválido/faltante
- `404`: Cafetería no encontrada (usuario sin cafetería)
- `500`: Error interno

---

#### 2. **Actualizar mi cafetería**

```http
PUT /cafeteria/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Café con C - Nueva Ubicación",
  "description": "Mejor ubicación, mejor café",
  "phone": "+34 666 777 999",
  "address": "Calle Nueva 456, Madrid"
}
```

**Campos actualizables**:
- `name`: String (opcional en request, pero existente en BD)
- `description`: String (opcional)
- `phone`: String (opcional)
- `address`: String (opcional)

**Respuesta exitosa** (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Café con C - Nueva Ubicación",
  "slug": "cafe-con-c",
  "description": "Mejor ubicación, mejor café",
  "address": "Calle Nueva 456, Madrid",
  "phone": "+34 666 777 999",
  "status": "TRIAL",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "stripeCustomerId": null,
  "stripeSubId": null,
  "createdAt": "2026-05-25T10:30:00Z"
}
```

**Errores posibles**:
- `401`: Token inválido/faltante
- `500`: Error interno

---

#### 3. **Obtener cafetería pública**

```http
GET /cafeteria/:slug
```

**Parámetros**:
- `:slug`: Slug único de la cafetería (ej: `cafe-con-c`)

**Respuesta exitosa** (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Café con C",
  "slug": "cafe-con-c",
  "logo": "https://example.com/logo.png",
  "description": "La mejor cafetería del barrio",
  "address": "Calle Principal 123, Madrid",
  "phone": "+34 666 777 888",
  "status": "ACTIVE",
  "createdAt": "2026-05-25T10:30:00Z",
  "inventory": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Café Espresso",
      "quantity": 50,
      "unit": "kg",
      "category": "café",
      "method": "espresso",
      "createdAt": "2026-05-25T11:00:00Z",
      "updatedAt": "2026-05-25T11:00:00Z"
    }
  ]
}
```

**Notas**:
- Solo retorna cafeterías con `status === 'ACTIVE'`
- Inventario ordenado por `category` ascendente
- **NO retorna** `userId`, `stripeCustomerId`, `stripeSubId` (privados)
- Sin autenticación requerida

**Errores posibles**:
- `404`: Cafetería no existe o no está ACTIVE
- `500`: Error interno

---

### 📦 **Inventario** (`GET/POST/PUT/DELETE /inventory/...`)

⚠️ **Todas requieren autenticación JWT**

#### 1. **Listar inventario de mi cafetería**

```http
GET /inventory
Authorization: Bearer {token}
```

**Respuesta exitosa** (200):
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Café Espresso",
    "quantity": 50,
    "unit": "kg",
    "category": "café",
    "method": "espresso",
    "cafeteriaId": "660e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-05-25T11:00:00Z",
    "updatedAt": "2026-05-25T11:00:00Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "Leche de almendras",
    "quantity": 10,
    "unit": "l",
    "category": "leche",
    "method": null,
    "cafeteriaId": "660e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-05-25T11:30:00Z",
    "updatedAt": "2026-05-25T11:30:00Z"
  }
]
```

**Orden**: Descendente por `createdAt` (más recientes primero)

**Errores posibles**:
- `401`: Token inválido/faltante
- `404`: Cafetería no encontrada
- `500`: Error interno

---

#### 2. **Crear producto**

```http
POST /inventory
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Café Arabica Premium",
  "quantity": 75,
  "unit": "kg",
  "category": "café",
  "method": "v60"
}
```

**Validaciones**:
- `name`: Requerido (String)
- `quantity`: Requerido (se convierte a Float)
- `unit`: Requerido (String)
- `category`: Requerido (String)
- `method`: Opcional (String, puede ser null)

**Respuesta exitosa** (201):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "name": "Café Arabica Premium",
  "quantity": 75,
  "unit": "kg",
  "category": "café",
  "method": "v60",
  "cafeteriaId": "660e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-05-25T12:00:00Z",
  "updatedAt": "2026-05-25T12:00:00Z"
}
```

**Errores posibles**:
- `400`: Faltan campos requeridos
- `401`: Token inválido/faltante
- `404`: Cafetería no encontrada
- `500`: Error interno

---

#### 3. **Actualizar producto**

```http
PUT /inventory/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Café Arabica Premium - Edit",
  "quantity": 100,
  "unit": "kg",
  "category": "café",
  "method": "chemex"
}
```

**Parámetros**:
- `:id`: ID del producto (UUID)

**Campos actualizables**:
- `name`: String
- `quantity`: Numeric (se convierte a Float)
- `unit`: String
- `category`: String
- `method`: String o null

**Respuesta exitosa** (200):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "name": "Café Arabica Premium - Edit",
  "quantity": 100,
  "unit": "kg",
  "category": "café",
  "method": "chemex",
  "cafeteriaId": "660e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-05-25T12:00:00Z",
  "updatedAt": "2026-05-25T12:30:00Z"
}
```

**Errores posibles**:
- `401`: Token inválido/faltante
- `404`: Producto no encontrado o no pertenece a tu cafetería
- `500`: Error interno

**Nota de seguridad**: Solo puedes actualizar productos de tu propia cafetería.

---

#### 4. **Eliminar producto**

```http
DELETE /inventory/:id
Authorization: Bearer {token}
```

**Parámetros**:
- `:id`: ID del producto (UUID)

**Respuesta exitosa** (200):
```json
{ "ok": true }
```

**Errores posibles**:
- `401`: Token inválido/faltante
- `404`: Producto no encontrado o no pertenece a tu cafetería
- `500`: Error interno

**Nota de seguridad**: Solo puedes eliminar productos de tu propia cafetería.

---

### 💳 **Pagos** (`POST /payment/...`)

#### 1. **Crear sesión de checkout Stripe**

```http
POST /payment/create-checkout
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**: (vacío, se usa el STRIPE_PRICE_ID del backend)

**Respuesta exitosa** (200):
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_a1234567890abcdefghijklmnopqrst"
}
```

**Flujo**:
1. Frontend redirige al usuario a esta URL
2. Usuario completa el pago en Stripe
3. Stripe redirige a `FRONTEND_URL/dashboard?pago=exitoso`
4. Webhook se dispara automáticamente

**Errores posibles**:
- `401`: Token inválido/faltante
- `500`: Error al crear sesión Stripe

---

#### 2. **Abrir portal de facturación Stripe**

```http
POST /payment/portal
Authorization: Bearer {token}
```

**Respuesta exitosa** (200):
```json
{
  "url": "https://billing.stripe.com/p/session/a1234567890abcdefghijklmnopqrst"
}
```

**Propósito**:
- Usuario gestiona su suscripción
- Actualiza datos de pago
- Cancela suscripción
- Ve historial de facturas

**Errores posibles**:
- `400`: No tienes suscripción activa (sin `stripeCustomerId`)
- `401`: Token inválido/faltante
- `500`: Error al crear sesión portal

---

#### 3. **Webhook de Stripe**

```http
POST /payment/webhook
Content-Type: application/json

(raw body de Stripe, no JSON estándar)
```

**⚠️ Importante**:
- **No requiere autenticación**
- **Debe recibir raw body** (no JSON parseado)
- **Firma verificada** con `STRIPE_WEBHOOK_SECRET`

**Eventos manejados**:

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Suscripción activa → status = `ACTIVE`, guarda `stripeCustomerId` y `stripeSubId` |
| `invoice.payment_failed` | Pago fallido → status = `SUSPENDED` |
| `customer.subscription.deleted` | Suscripción cancelada → status = `SUSPENDED` |
| `customer.subscription.updated` | Actualiza status según `session.status` (active/inactive) |

**Respuesta exitosa** (200):
```json
{ "received": true }
```

**Errores posibles**:
- `400`: Firma webhook inválida o no se puede construir evento
- `500`: Error al procesar evento

**Configuración requerida**:
- Backend debe estar en URL pública (no localhost)
- `STRIPE_WEBHOOK_SECRET` debe ser exacto
- Configurar webhook en Stripe Dashboard hacia `/api/payment/webhook`

---

### 🏥 **Health Check**

```http
GET /health
```

**Respuesta** (200):
```json
{ "ok": true }
```

**Propósito**: Verificar que el servidor está corriendo.

---

## 🔐 Autenticación JWT

### Implementación

**Middleware** (`src/middleware/auth.middleware.js`):
```javascript
module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' })

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
```

### Token

- **Algoritmo**: HS256
- **Secret**: Variabilidad en `process.env.JWT_SECRET`
- **Expiración**: 7 días (`7d`)
- **Payload**:
  ```json
  {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "OWNER",
    "iat": 1234567890,
    "exp": 1234567890
  }
  ```

### Uso en Requests

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ciclo de Vida

1. **Emisión**: En `/auth/register` y `/auth/login`
2. **Almacenamiento**: Frontend en cookie o localStorage
3. **Envío**: En header `Authorization: Bearer {token}`
4. **Validación**: Middleware verifica en rutas protegidas
5. **Expiración**: 7 días desde emisión
6. **Renovación**: Usuario debe hacer login nuevamente

---

## 🔒 Variables de Entorno

### Archivo: `.env` (NO commitear)

```env
# ===== BASE DE DATOS =====
# URL para transacciones (pgbouncer, pooling)
DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true"

# URL directa para migraciones (sin pooling)
DIRECT_URL="postgresql://user:password@host:5432/db"

# ===== AUTENTICACIÓN =====
# Secret para firmar JWT tokens (mín 32 caracteres)
JWT_SECRET="tu_secreto_super_seguro_min_32_caracteres"

# ===== SERVIDOR =====
# Puerto (por defecto 4000, en development a veces 3001)
PORT=4000

# URL del frontend (para CORS)
FRONTEND_URL="http://localhost:3000"

# ===== STRIPE =====
# Clave privada (sk_test_* o sk_live_*)
STRIPE_SECRET_KEY="sk_test_..."

# Secret para validar webhooks
STRIPE_WEBHOOK_SECRET="whsec_..."

# ID del precio (producto x plan en Stripe)
STRIPE_PRICE_ID="price_..."
```

### Por Entorno

| Variable | Desarrollo | Producción | Notas |
|----------|-----------|-----------|-------|
| `DATABASE_URL` | Local PostgreSQL | AWS RDS / Supabase | Con pgbouncer en prod |
| `DIRECT_URL` | Igual a DATABASE_URL | URL directa sin pooling | Solo para migraciones |
| `JWT_SECRET` | `dev_secret_123...` | Generar aleatorio (32+ chars) | Nunca exponer |
| `PORT` | 4000 | Desde env o 4000 | Railway, Render, etc. |
| `FRONTEND_URL` | `http://localhost:3000` | URL real frontend | Ej: `https://app.example.com` |
| `STRIPE_SECRET_KEY` | `sk_test_*` | `sk_live_*` | Test vs producción |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_*` | `whsec_live_*` | Test vs producción |
| `STRIPE_PRICE_ID` | `price_test_*` | `price_live_*` | Plan a cobrar |

### Seguridad

⚠️ **NUNCA**:
- Commitear `.env` (está en `.gitignore`)
- Compartir `JWT_SECRET` o `STRIPE_SECRET_KEY`
- Usar secrets de desarrollo en producción

✅ **SIEMPRE**:
- Generar secretos aleatorios en producción
- Usar min. 32 caracteres para `JWT_SECRET`
- Rotar secrets si se comprometen
- Usar variables de entorno en servidor (no hard-coded)

---

## ⚙️ Instalación y Setup

### 1. Requisitos

```bash
node --version  # v18 o mayor
npm --version   # v9 o mayor
```

### 2. Clonar y navegar

```bash
cd backend
```

### 3. Instalar dependencias

```bash
npm install
```

**Instala**:
- @prisma/client, @prisma/adapter-pg, pg
- express, jsonwebtoken, bcryptjs, cors, stripe
- dotenv, nodemon (dev), prisma (dev)

### 4. Configurar `.env`

```bash
cp .env.example .env  # Si existe
# O crear manualmente con valores reales
```

### 5. Configurar base de datos

**Opción A: Base de datos existente (Supabase, AWS RDS)**

```bash
# Solo aplicar migraciones existentes
npx prisma migrate deploy
```

**Opción B: Nueva base de datos local**

```bash
# Inicializar schema e historial
npx prisma migrate dev --name init
```

**Verificar conexión**:
```bash
npx prisma db push        # (alternativa rápida, no recomendada para prod)
npx prisma studio        # GUI para explorar BD
```

### 6. Iniciar servidor

**Desarrollo** (con hot-reload):
```bash
npm run dev
```

**Producción**:
```bash
npm start
```

Output esperado:
```
🚀 Backend en http://localhost:4000
```

### 7. Probar API

```bash
# Health check
curl http://localhost:4000/health
# Respuesta: { "ok": true }

# Registrar usuario
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","cafeteriaName":"Test Cafe","slug":"test-cafe"}'
```

---

## 📝 Scripts Disponibles

```bash
npm run dev       # Inicia con nodemon (desarrollo, hot-reload)
npm start         # Inicia servidor en modo producción
npm run prisma    # Acceso a CLI de Prisma
```

### Scripts Prisma útiles

```bash
# Migraciones
npx prisma migrate dev --name nombre_descriptivo
npx prisma migrate deploy          # Aplicar migraciones en prod
npx prisma migrate status          # Ver estado
npx prisma migrate reset           # ⚠️ Destruye BD, solo desarrollo

# Exploración
npx prisma studio                  # GUI en http://localhost:5555
npx prisma db push --skip-generate # Sincronizar schema rápidamente

# Generación
npx prisma generate                # Regenerar Prisma Client
```

---

## 🚨 Manejo de Errores

### Códigos HTTP

| Código | Situación | Ejemplo |
|--------|-----------|---------|
| **200** | ✅ Solicitud exitosa | GET, POST (login), PUT |
| **201** | ✅ Recurso creado | POST /inventory |
| **400** | ❌ Solicitud inválida | Parámetros faltantes, tipo incorrecto |
| **401** | ❌ No autenticado | Token faltante, expirado o inválido |
| **404** | ❌ Recurso no existe | Usuario, cafetería, producto no encontrado |
| **409** | ❌ Conflicto | Email o slug duplicado |
| **500** | ❌ Error servidor | Bug en código o BD |

### Formato de Error

```json
{
  "error": "Descripción del error en español"
}
```

**Ejemplos reales**:

```json
// Parámetros faltantes
{ "error": "Faltan campos requeridos" }

// Email duplicado
{ "error": "Email o slug ya en uso" }

// Credenciales incorrectas
{ "error": "Credenciales incorrectas" }

// Token inválido
{ "error": "Token inválido o expirado" }

// Recurso no encontrado
{ "error": "Insumo no encontrado" }

// Stripe error
{ "error": "Error al crear sesión de pago" }
```

### Troubleshooting Común

**Error**: `Cannot find module '@prisma/client'`
```bash
# Solución: regenerar Prisma
npx prisma generate
```

**Error**: `DATABASE_URL not set`
```bash
# Solución: crear .env con DATABASE_URL correcto
echo 'DATABASE_URL="postgresql://..."' > .env
```

**Error**: `P2002: Unique constraint failed`
```
Causa: Email o slug ya existe
Solución: Usar valores únicos o verificar BD
```

**Error**: `EADDRINUSE: address already in use :::4000`
```bash
# Solución 1: Cambiar PORT en .env
PORT=4001

# Solución 2: Matar proceso actual
lsof -ti:4000 | xargs kill -9
```

**Error**: `Stripe webhook signature verification failed`
```
Causa: STRIPE_WEBHOOK_SECRET incorrecto o cuerpo alterado
Solución:
1. Verificar STRIPE_WEBHOOK_SECRET exacto en Stripe Dashboard
2. Asegurarse que endpoint recibe raw body (no JSON parseado)
3. En Express, middleware de webhook debe ir ANTES de express.json()
```

---

## 🔒 Notas de Seguridad

### Basadas en el Código Real

1. **Contraseñas**:
   - ✅ Hasheadas con bcryptjs (rounds: 12)
   - ❌ Nunca retornadas en respuestas API
   - ⚠️ Sin validación de complejidad (implementar en prod)

2. **JWT**:
   - ✅ Secret de 32+ caracteres en .env
   - ✅ Expiración 7 días
   - ⚠️ Frontend debe guardar en HTTPOnly cookies (no localStorage)

3. **CORS**:
   - ✅ Configurado para FRONTEND_URL específica
   - ⚠️ En producción, cambiar a URL real
   - ⚠️ Evitar `*` en CORS

4. **Stripe**:
   - ✅ Secret key protegido en .env
   - ✅ Webhook verificado con firma
   - ⚠️ Webhook debe estar en URL pública (no localhost)

5. **Base de datos**:
   - ✅ Contraseña en conexión string
   - ✅ Usar managed service (Supabase, RDS) en prod
   - ⚠️ Backups automáticos configurados
   - ⚠️ SSL/TLS en conexión

6. **Validaciones**:
   - ✅ Email/slug únicos (constraints BD)
   - ⚠️ Sin validación de email format (regex)
   - ⚠️ Sin rate-limiting en endpoints públicos
   - ⚠️ Sin sanitización de entrada (inyección SQL menor riesgo por Prisma)

### Recomendaciones para Producción

- [ ] Implementar rate-limiting (express-rate-limit)
- [ ] Validar formato email con regex
- [ ] Validar complejidad contraseña
- [ ] HTTPS obligatorio
- [ ] Helmet.js para headers de seguridad
- [ ] Logging de requests (morgan)
- [ ] Monitoreo de errores (Sentry)
- [ ] Encriptación de datos sensibles en BD
- [ ] 2FA (autenticación de dos factores)
- [ ] Revocar tokens al logout

---

## 📦 Deployment

### Preparación

1. **Build**:
   ```bash
   npm install --production  # Solo dependencias runtime
   npm run prisma:build      # Si hay scripts custom
   ```

2. **Variables de entorno** en plataforma:
   - DATABASE_URL (URL real)
   - DIRECT_URL (URL directa para migraciones)
   - JWT_SECRET (generar nuevo, 32+ chars)
   - PORT (dejar vacío, plataforma asigna)
   - FRONTEND_URL (URL real frontend)
   - STRIPE_* (claves live)

3. **Migraciones**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Verificar**:
   ```bash
   curl https://api.example.com/health
   ```

### Plataformas Recomendadas

| Plataforma | Setup | Costo | Notas |
|-----------|-------|-------|-------|
| **Render.com** | Muy fácil (GitHub) | Free + pago | Recomendado |
| **Railway.app** | Muy fácil (GitHub) | Free + pago | Buena alternativa |
| **AWS EC2 + RDS** | Moderado | Pago | Máximo control |
| **DigitalOcean** | Moderado | Pago | Buena relación precio |
| **Heroku** | Fácil (deprecado) | Pago | Ya no free tier |

### Ejemplo: Render.com

1. Conectar repositorio GitHub
2. Crear "Web Service"
3. Build command: `npm install`
4. Start command: `npm start`
5. Agregar variables de entorno
6. Deploy automático en cada push

---

## 📊 Monitoreo en Producción

### Logs

```bash
# Ver logs en tiempo real
docker logs -f container-name

# O en plataforma (Render, Railway, etc.)
# Dashboard → Logs
```

### Métricas a vigilar

- ✅ Uptime del servicio
- ✅ Tiempo de respuesta API
- ✅ Errores 5xx (500, 502, 503)
- ✅ Uso de BD (conexiones, queries)
- ✅ Webhooks de Stripe fallidos

### Alertas recomendadas

- Downtime > 5 minutos
- Error rate > 1%
- Stripe webhook failures
- DB conexión pool lleno

---

## ✅ Pendientes / TODO

Mejoras a considerar según análisis del código:

### Seguridad
- [ ] Implementar rate-limiting en endpoints públicos (especialmente `/auth/register`)
- [ ] Agregar validación de formato email con regex
- [ ] Validar complejidad mínima de contraseñas (8+ chars, mayúscula, número)
- [ ] Implementar helmet.js para headers de seguridad HTTP
- [ ] Agregar CORS whitelist más específico en producción
- [ ] Implementar refresh tokens en lugar de solo acceso tokens

### Funcionalidad
- [ ] Endpoint DELETE /auth/logout (revoke token)
- [ ] Endpoint para cambiar contraseña
- [ ] Endpoint para confirmar email (verificación)
- [ ] Implementar paginación en GET /inventory
- [ ] Agregar filtros en GET /inventory (por categoría, método)
- [ ] Soft delete en lugar de hard delete para inventario
- [ ] Historial de cambios en inventario (auditoría)
- [ ] Múltiples usuarios por cafetería (roles ADMIN)

### Base de Datos
- [ ] Índices en `cafeteria.slug` para búsquedas rápidas
- [ ] Índice en `inventory.cafeteriaId` para queries
- [ ] Cascada DELETE en relaciones (Usuario → Cafetería → Inventario)
- [ ] Triggers para auditoría automática
- [ ] Backup automático configurado en Supabase

### API
- [ ] Documentación OpenAPI/Swagger
- [ ] Versionamiento de API (/v1, /v2)
- [ ] Endpoint de estadísticas (productos por categoría, etc.)
- [ ] Bulk operations (crear/eliminar múltiples productos)
- [ ] Búsqueda de productos por nombre
- [ ] Exportar inventario (CSV, PDF)

### Infraestructura
- [ ] Logging centralizado (Winston, Pino)
- [ ] Monitoreo de errores (Sentry, Bugsnag)
- [ ] Métricas (Prometheus, DataDog)
- [ ] Health checks avanzados (BD, Stripe)
- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Tests unitarios (Jest)
- [ ] Tests de integración (API)
- [ ] Load testing (Artillery, K6)

### Observabilidad
- [ ] Request logging con morgan
- [ ] Trace IDs para debugging distribuido
- [ ] Alertas en plataforma de hosting
- [ ] Dashboard de métricas

### Documentación
- [ ] Swagger/OpenAPI specs
- [ ] Diagrama de arquitectura
- [ ] Diagrama ER de BD
- [ ] Runbooks para operaciones
- [ ] Guía de troubleshooting completa

---

## 📞 Contacto y Soporte

Para reportar bugs, solicitar features o consultas:

1. Abrir issue en repositorio con descripción clara
2. Incluir: versión Node.js, SO, pasos para reproducir
3. Adjuntar logs de error si aplica

---

**Última actualización**: Mayo 26, 2026
**Versión**: 1.0.0
**Licencia**: ISC
**Autor**: Equipo CaféSaaS
