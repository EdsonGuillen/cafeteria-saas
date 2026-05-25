# Cafeteria SaaS - Frontend

Frontend de la plataforma SaaS para gestión de cafeterías, construido con Next.js 16, React 19 y Tailwind CSS. Proporciona una interfaz moderna para que los propietarios de cafeterías gestionen su inventario, perfil y pagos, así como una página pública autogenerada para cada cafetería.

## 📋 Descripción

Aplicación web que permite:

- 🔐 **Autenticación**: Registro e inicio de sesión de propietarios
- 📊 **Dashboard**: Panel de control para gestionar inventario y perfil
- 📦 **Gestión de Inventario**: CRUD completo de productos (café, insumos, métodos)
- ☕ **Página Pública**: Landing page autogenerada para cada cafetería
- 💳 **Integración Stripe**: Pagos y suscripciones
- 🎨 **Interfaz Moderna**: Diseño responsivo con Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **UI Framework**: React 19.2.4
- **Styling**: Tailwind CSS 4 + PostCSS
- **Lenguaje**: TypeScript 5 + JavaScript
- **HTTP Client**: Axios 1.15.2
- **Pagos**: Stripe React (@stripe/react-stripe-js ^6.4.0)
- **Cookies**: js-cookie 3.0.5
- **Linting**: ESLint 9 + eslint-config-next
- **Desarrollo**: Node.js v18+

## 📋 Requisitos Previos

- Node.js v18+ y npm v9+
- Backend corriendo en `http://localhost:4000` (o URL configurada)
- Cuenta de Stripe (para funcionalidad de pagos)
- Navegador moderno

## ⚙️ Instalación

### 1. Navegar a la carpeta del frontend

```bash
cd frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env.local` en la raíz del frontend:

```env
# Backend API (URL base)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Stripe
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 5. Build para producción

```bash
npm run build
npm start
```

## 🗄️ Estructura del Proyecto

```
frontend/
├── app/                           # Aplicación Next.js (App Router)
│   ├── layout.tsx                # Layout raíz
│   ├── globals.css               # Estilos globales
│   ├── page.jsx                  # Home / Landing page
│   ├── (auth)/                   # Rutas de autenticación (grupo)
│   │   ├── login/
│   │   │   └── page.jsx         # Página de inicio de sesión
│   │   └── register/
│   │       └── page.jsx         # Página de registro
│   ├── cafe/
│   │   └── [slug]/
│   │       ├── page.jsx         # Página pública de cafetería
│   │       └── not-found.jsx    # Página 404
│   └── dashboard/
│       └── page.jsx             # Panel de control (requiere autenticación)
├── lib/
│   └── api.js                    # Cliente Axios (configurado)
├── proxy.js                       # Middleware de autenticación
├── package.json
├── next.config.ts                # Configuración de Next.js
├── tsconfig.json                 # Configuración TypeScript
├── postcss.config.mjs            # Configuración PostCSS
├── tailwind.config.ts            # Configuración Tailwind
├── eslint.config.mjs             # Configuración ESLint
└── public/                        # Archivos estáticos
```

## 🔌 Comunicación con el Backend

### Cliente Axios Centralizado (`lib/api.js`)

Todos los llamados al backend se hacen a través del cliente Axios configurado:

```javascript
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

// Interceptor: agrega automáticamente el token JWT a cada request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(r => r.startsWith('token='))
      ?.split('=')[1]
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

**Características:**
- ✅ Base URL centralizada
- ✅ Token JWT inyectado automáticamente en headers
- ✅ Manejo de cookies del navegador
- ✅ Reutilizable en todos los componentes

### Flujo de Autenticación

```
1. Usuario registra/ingresa credenciales
   ↓
2. Frontend envía POST /api/auth/register o /api/auth/login
   ↓
3. Backend valida y retorna { token, user }
   ↓
4. Frontend guarda token en cookie: document.cookie = `token=...`
   ↓
5. Interceptor de Axios agrega automáticamente "Authorization: Bearer {token}"
   ↓
6. Todas las requests posteriores van autenticadas
   ↓
7. Middleware proxy.js protege rutas /dashboard
```

### Ejemplo de uso en componentes

```javascript
import api from '@/lib/api'

export default function Component() {
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Token se envía automáticamente en headers
      const { data } = await api.post('/inventory', {
        name: 'Café',
        quantity: 100,
        unit: 'kg',
        category: 'café'
      })
      console.log('Producto creado:', data)
    } catch (error) {
      console.error('Error:', error.response?.data?.error)
    }
  }
}
```

---

## 📄 Rutas y Páginas

### 🏠 Home (`/`)

- **Tipo**: Pública
- **Descripción**: Landing page con descripción del producto
- **Funcionalidad**: 
  - Información general de CaféSaaS
  - Características principales
  - CTA para registro/login
  - Link a demo (café de ejemplo)

**Componentes:**
- Navbar con links a login/register
- Hero section
- Features showcase
- CTA buttons

---

### 🔐 Registro (`/register`)

- **Tipo**: Pública
- **Descripción**: Página de registro de nuevos propietarios
- **Archivo**: `app/(auth)/register/page.jsx`

**Flujo:**
```
1. Usuario completa formulario:
   - Email
   - Contraseña
   - Nombre de cafetería
   - Slug (identificador en URL)

2. Submit:
   POST /api/auth/register
   {
     "email": "owner@example.com",
     "password": "securepass123",
     "cafeteriaName": "Mi Cafetería",
     "slug": "mi-cafeteria"
   }

3. Backend:
   - Valida campos
   - Hashea contraseña con bcrypt
   - Crea user + cafeteria
   - Retorna { token, user }

4. Frontend:
   - Almacena token en cookie
   - Redirige a /dashboard
```

**Validaciones:**
- Email válido
- Contraseña mínimo 8 caracteres
- Slug único
- Café único

---

### 🔑 Login (`/login`)

- **Tipo**: Pública
- **Descripción**: Página de inicio de sesión
- **Archivo**: `app/(auth)/login/page.jsx`

**Flujo:**
```
1. Usuario ingresa:
   - Email
   - Contraseña

2. Submit:
   POST /api/auth/login
   {
     "email": "owner@example.com",
     "password": "securepass123"
   }

3. Backend:
   - Busca usuario por email
   - Compara contraseña con bcrypt
   - Si es correcta, retorna { token, user }

4. Frontend:
   - Almacena token: document.cookie = `token=...`
   - Redirige a /dashboard
```

**Manejo de errores:**
- Email no existe
- Contraseña incorrecta
- Servidor no disponible

---

### 📊 Dashboard (`/dashboard`)

- **Tipo**: Protegida ✅ (requiere autenticación)
- **Descripción**: Panel de control principal
- **Archivo**: `app/dashboard/page.jsx`
- **Middleware**: `proxy.js` verifica token en cookie

**Funcionalidades principales:**

#### 1️⃣ **Tabs de Navegación**
- **Inventario**: CRUD de productos
- **Perfil**: Editar datos de la cafetería
- **Pagos**: Integración Stripe

#### 2️⃣ **Tab Inventario**

**GET /api/inventory**
```bash
Obtiene lista de todos los productos
Authorization: Bearer {token}
```

**Campos mostrados:**
- Nombre del producto
- Cantidad disponible
- Unidad de medida (g, kg, ml, l, piezas, bolsas)
- Categoría (café, leche, jarabe, insumo, equipo, otro)
- Método de extracción (espresso, v60, chemex, aeropress, prensa francesa, cold brew)
- Alerta si stock < 200

**Crear producto:**
```bash
POST /api/inventory
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Café Espresso",
  "quantity": 100,
  "unit": "kg",
  "category": "café",
  "method": "espresso"
}
```

**Actualizar producto:**
```bash
PUT /api/inventory/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Café Espresso Premium",
  "quantity": 150,
  "unit": "kg"
}
```

**Eliminar producto:**
```bash
DELETE /api/inventory/:id
Authorization: Bearer {token}
```

#### 3️⃣ **Tab Perfil**

**GET /api/cafeteria/me**
```bash
Obtiene datos de la cafetería del usuario
Authorization: Bearer {token}

Response:
{
  "id": "uuid",
  "name": "Mi Cafetería",
  "slug": "mi-cafeteria",
  "description": "...",
  "phone": "+34 666 777 888",
  "address": "Calle Principal 123",
  "status": "TRIAL" | "ACTIVE" | "SUSPENDED",
  "createdAt": "2026-05-25T..."
}
```

**Actualizar perfil:**
```bash
PUT /api/cafeteria/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nueva Cafetería",
  "description": "La mejor cafetería",
  "phone": "+34 666 777 888",
  "address": "Calle Nueva 456"
}
```

**Estados de cafetería:**
- 🟡 `TRIAL`: Prueba gratuita (inicial)
- 🟢 `ACTIVE`: Suscripción activa
- 🔴 `SUSPENDED`: Suscripción cancelada

#### 4️⃣ **Tab Pagos**

**Crear sesión de checkout Stripe:**
```bash
POST /api/payment/create-checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "pro" // basic, pro, enterprise
}

Response:
{
  "sessionId": "cs_test_..."
}
```

**Acceder al portal de billing:**
```bash
POST /api/payment/portal
Authorization: Bearer {token}

Response redirige a portal.stripe.com
```

**Webhook de Stripe (Backend):**
- Actualiza estado a `ACTIVE` cuando pago es exitoso
- Actualiza estado a `SUSPENDED` cuando suscripción se cancela
- Crea/actualiza `stripeCustomerId` y `stripeSubId`

---

### ☕ Página Pública de Cafetería (`/cafe/:slug`)

- **Tipo**: Pública (sin autenticación)
- **Descripción**: Landing page autogenerada para cada cafetería
- **Archivo**: `app/cafe/[slug]/page.jsx`
- **SSR**: Server-side rendering

**Flujo:**
```
1. Usuario accede a /cafe/mi-cafeteria

2. Next.js ejecuta getCafeteria(slug):
   GET http://localhost:4000/api/cafeteria/mi-cafeteria

3. Backend retorna cafetería si:
   - Existe
   - status === 'ACTIVE'

4. Frontend muestra:
   - Nombre y descripción
   - Teléfono y dirección
   - Inventario agrupado por categoría
   - Métodos de extracción

5. Si no existe o no está ACTIVE → notFound() (404)
```

**Datos mostrados:**
```json
{
  "name": "Mi Cafetería",
  "description": "La mejor cafetería del barrio",
  "logo": "https://...",
  "address": "Calle Principal 123",
  "phone": "+34 666 777 888",
  "inventory": [
    {
      "id": "uuid",
      "name": "Café Molido",
      "quantity": 50,
      "unit": "kg",
      "category": "café",
      "method": "espresso"
    }
  ]
}
```

**Características:**
- Categorías con iconos (☕🥛🍯📦⚙️📋)
- Responsive en móvil
- Hero section con branding
- Footer con crédito
- Caché: `no-store` (siempre fresco)

---

### ❌ 404 - Cafetería No Encontrada (`/cafe/[slug]/not-found.jsx`)

- Muestra cuando: slug no existe o cafetería no está ACTIVE
- UX amigable con sugerencias

---

## 🔒 Autenticación y Seguridad

### Middleware (`proxy.js`)

```javascript
export function proxy(request) {
  const token    = request.cookies.get('token')?.value
  const isAuth   = request.nextUrl.pathname.startsWith('/dashboard')
  const isPublic = ['/login', '/register'].includes(request.nextUrl.pathname)

  // ❌ Ruta protegida sin token → redirige a login
  if (isAuth && !token)
    return NextResponse.redirect(new URL('/login', request.url))

  // ✅ Rutas públicas con token → redirige a dashboard
  if (isPublic && token)
    return NextResponse.redirect(new URL('/dashboard', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
}
```

**Protecciones:**
- Dashboard requiere token válido
- Login/Register solo accesibles sin token
- Token se valida en cada request al backend
- JWT con expiración 7 días

### Almacenamiento de Token

```javascript
// Guardar
document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`

// El interceptor de Axios lo lee automáticamente
// y lo agrega en headers: Authorization: Bearer {token}
```

---

## 🎨 Componentes y Estilos

### Tailwind CSS

- **Configuración**: `tailwind.config.ts`
- **Versión**: 4 (última)
- **Temas**: Colores amber/stone para cafetería

**Colores principales:**
- `amber-*`: Primario (café)
- `stone-*`: Secundario (neutro)
- `red-*`: Errores
- `green-*`: Éxito

### PostCSS

- **Configuración**: `postcss.config.mjs`
- **Plugins**: Tailwind CSS PostCSS

---

## 🚀 Desarrollo

### Scripts disponibles

```bash
npm run dev      # Inicia servidor de desarrollo con hot-reload
npm run build    # Build de producción
npm start        # Inicia servidor de producción
npm run lint     # Ejecuta ESLint
```

### Hot-reload

Los cambios en archivos se reflejan instantáneamente durante desarrollo (sin recargar página).

### Debugging

```javascript
// En navegador:
// 1. Abre DevTools (F12)
// 2. Tab "Application" → Cookies → token
// 3. Tab "Network" → inspecciona requests a /api/*
// 4. Tab "Console" → errores y logs
```

---

## 📦 Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|----------|
| `next` | 16.2.4 | Framework React con SSR |
| `react` | 19.2.4 | Librería UI |
| `axios` | 1.15.2 | Cliente HTTP |
| `@stripe/react-stripe-js` | 6.4.0 | Componentes Stripe |
| `tailwindcss` | 4 | Utilidades CSS |
| `js-cookie` | 3.0.5 | Manejo de cookies (alternativa a cookies manual) |

---

## 🔐 Variables de Entorno

### `.env.local` (obligatorio)

```env
# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Stripe (public, seguro)
NEXT_PUBLIC_STRIPE_KEY=pk_test_51234567890abcdefg
```

**Nota:** Variables con prefijo `NEXT_PUBLIC_` se exponen al cliente. **NO incluir secretos en frontend.**

### Por entorno

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | URL real backend |
| `NEXT_PUBLIC_STRIPE_KEY` | `pk_test_*` | `pk_live_*` |

---

## 🌐 CORS

**El backend está configurado para aceptar requests desde el frontend en `FRONTEND_URL`.**

En desarrollo:
- Backend CORS: `http://localhost:3000`
- Frontend: `http://localhost:3000`

En producción:
- Backend CORS: URL real del frontend (ej: `https://app.cafesaas.com`)

---

## 📱 Responsividad

Todas las páginas son **mobile-first**:

- Navbar colapsable en móvil
- Grid layout fluido
- Formularios adaptables
- Touch-friendly buttons

Breakpoints Tailwind:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

---

## 🚨 Manejo de Errores

### Errores comunes en Frontend

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot GET /dashboard` | No autenticado | Login primero |
| `api is not defined` | Import falta | Importar `api` de `@/lib/api` |
| `Token not found` | Cookie perdida | Login nuevamente |
| `NEXT_PUBLIC_BACKEND_URL` sin definir | Falta `.env.local` | Crear con valores correctos |
| `Stripe key invalid` | `pk_` incorrecto | Verificar clave pública Stripe |

### Debugging Tips

```javascript
// Ver token en console
console.log(document.cookie)

// Ver requests al backend
// DevTools → Network → filtrar por XHR/Fetch

// Ver respuesta de API
try {
  const { data } = await api.get('/inventory')
  console.log('Inventario:', data)
} catch (err) {
  console.error('Error:', err.response?.data)
}
```

---

## 📦 Deployment

### Preparar para producción

1. **Build local:**
   ```bash
   npm run build
   npm start
   ```

2. **Configurar variables:**
   - `NEXT_PUBLIC_BACKEND_URL`: URL real backend
   - `NEXT_PUBLIC_STRIPE_KEY`: Clave pública Stripe (live)

3. **Verificar CORS en backend:**
   - `FRONTEND_URL` debe coincidir con URL real

### Plataformas recomendadas

- **Vercel** (creador de Next.js, muy fácil)
  ```bash
  npm i -g vercel
  vercel deploy
  ```

- **Netlify** (soporte Next.js)
- **AWS Amplify**
- **Render.com**
- **Railway.app**

### Con Vercel (recomendado)

1. Conectar repositorio GitHub
2. Vercel detecta `next.config.ts` automáticamente
3. Agregar variables de entorno en dashboard
4. Deploy automático en cada push a main

---

## 🔗 Integración Backend-Frontend

### Flujo completo: Registro → Dashboard → Venta

```
┌─ FRONTEND ──────────────────────────────────────────────────────┐
│                                                                   │
│  1. HOME (/home)                                                 │
│     └─ Click "Registrarse" → /register                          │
│                                                                   │
│  2. REGISTER (/register)                                         │
│     ├─ User completa form                                       │
│     ├─ POST /api/auth/register                                  │
│     └─ Backend: crea User + Cafeteria                           │
│        └─ Retorna: { token, user, cafeteria }                   │
│     ├─ Save token en cookie                                     │
│     └─ Redirect a /dashboard                                    │
│                                                                   │
│  3. DASHBOARD (/dashboard)                                       │
│     ├─ Middleware valida token ✓                                │
│     ├─ GET /api/auth/me → datos del usuario                    │
│     ├─ GET /api/cafeteria/me → datos cafetería                 │
│     └─ GET /api/inventory → productos                           │
│                                                                   │
│  4. AGREGAR PRODUCTO                                            │
│     ├─ POST /api/inventory                                      │
│     ├─ { name, quantity, category, method }                     │
│     └─ Backend: crea Inventory                                  │
│                                                                   │
│  5. EDITAR PERFIL                                               │
│     ├─ PUT /api/cafeteria/me                                    │
│     ├─ { name, description, phone, address }                    │
│     └─ Backend: actualiza Cafeteria                             │
│                                                                   │
│  6. PAGO (Stripe)                                               │
│     ├─ POST /api/payment/create-checkout                        │
│     ├─ Redirige a checkout.stripe.com                           │
│     └─ Usuario completa pago                                    │
│        └─ Webhook backend: status → ACTIVE                      │
│                                                                   │
│  7. PÁGINA PÚBLICA (/cafe/mi-cafeteria)                         │
│     ├─ GET /api/cafeteria/mi-cafeteria (solo ACTIVE)            │
│     ├─ Muestra inventario públicamente                          │
│     └─ Sin autenticación requerida                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Cannot GET /dashboard"

```
Causa: No estás autenticado
Solución: Ve a /login y haz login con credenciales válidas
```

### "api is not defined"

```javascript
// ❌ Incorrecto
import { api } from '@/lib'

// ✅ Correcto
import api from '@/lib/api'
```

### "Token not found" en backend

```
Causa: Cookie no se envía o token expirado (7 días)
Solución: 
1. Verifica DevTools → Application → Cookies → token existe
2. Si no, haz login nuevamente
3. Si la cookie expira, backend rechaza request
```

### Página de cafetería muestra 404

```
Causas posibles:
1. Slug no existe
2. Cafetería no está ACTIVE (status TRIAL o SUSPENDED)
3. Backend no responde

Soluciones:
1. Verifica slug en URL (/cafe/nombre-correcto)
2. Ve a dashboard y edita status (solo visible si ACTIVE)
3. Verifica que backend esté corriendo en http://localhost:4000
```

### Build error: "Cannot find module 'express'"

```
Causa: Confusión backend vs frontend
Solución: Asegúrate estés en carpeta /frontend, no /backend
```

### "Stripe key invalid"

```
Causa: NEXT_PUBLIC_STRIPE_KEY incorrecto
Solución:
1. Abre .env.local
2. Verifica que empiece con pk_test_ (desarrollo) o pk_live_ (producción)
3. Copia bien de Stripe dashboard
4. Reinicia servidor: npm run dev
```

---

## 📞 Soporte

Para reportar bugs o solicitar features:
1. Abre issue en repositorio
2. Describe el problema con pasos para reproducir
3. Incluye: navegador, SO, versión Node.js

---

## 🔄 Actualización de Dependencias

```bash
# Verificar outdated
npm outdated

# Actualizar todo
npm update

# Actualizar específico
npm install --save next@latest
```

---

## 📚 Recursos Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Axios Docs](https://axios-http.com)
- [Stripe React](https://stripe.com/docs/stripe-js/react)

---

**Última actualización**: Mayo 2026
**Versión**: 0.1.0
**Licencia**: ISC

---

## 🎯 Próximas Mejoras

- [ ] Testing con Jest y React Testing Library
- [ ] Error boundary component
- [ ] Loading skeletons
- [ ] Optimización de imágenes (Next/Image)
- [ ] PWA (Progressive Web App)
- [ ] Dark mode
- [ ] Internacionalización (i18n)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
