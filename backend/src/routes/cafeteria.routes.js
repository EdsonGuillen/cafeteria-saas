const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const auth   = require('../middleware/auth.middleware')
const ctrl   = require('../controllers/cafeteria.controller')
const prisma = new PrismaClient()

// Rutas privadas
router.get('/me',  auth, ctrl.getMe)
router.put('/me',  auth, ctrl.updateMe)

// Ruta pública — va al final para no interceptar /me
router.get('/:slug', async (req, res) => {
  try {
    const cafeteria = await prisma.cafeteria.findUnique({
      where:   { slug: req.params.slug },
      include: { inventory: { orderBy: { category: 'asc' } } }
    })

    if (!cafeteria || cafeteria.status !== 'ACTIVE')
      return res.status(404).json({ error: 'Cafetería no encontrada' })

    const { stripeCustomerId, stripeSubId, userId, ...safe } = cafeteria
    res.json(safe)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
