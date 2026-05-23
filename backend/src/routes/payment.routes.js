const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/payment.controller')
const auth    = require('../middleware/auth.middleware')

// Webhook va ANTES del express.json() — necesita el raw body
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.webhook)

router.post('/create-checkout', auth, ctrl.createCheckout)
router.post('/portal',          auth, ctrl.billingPortal)

module.exports = router
