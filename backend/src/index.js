const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const authRoutes      = require('./routes/auth.routes')
const cafeteriaRoutes = require('./routes/cafeteria.routes')
const paymentRoutes   = require('./routes/payment.routes')
const inventoryRoutes = require('./routes/inventory.routes')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

app.use('/api/auth',      authRoutes)
app.use('/api/cafeteria', cafeteriaRoutes)
app.use('/api/payment',   paymentRoutes)
app.use('/api/inventory', inventoryRoutes)

app.get('/health', (_, res) => res.json({ ok: true }))

app.listen(process.env.PORT, () =>
  console.log(`🚀 Backend en http://localhost:${process.env.PORT}`)
)
