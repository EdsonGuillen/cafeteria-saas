const Stripe = require('stripe')
const prisma = require('../db') // Importamos tu conexión central

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// POST /api/payment/create-checkout
// Crea una sesión de pago y redirige al checkout de Stripe
exports.createCheckout = async (req, res) => {
  try {
    const cafeteria = await prisma.cafeteria.findUnique({
      where: { userId: req.user.id }
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price:    process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      metadata: {
        cafeteriaId: cafeteria.id,
        userId:      req.user.id,
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?pago=exitoso`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard?pago=cancelado`,
    })

    res.json({ url: session.url })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear sesión de pago' })
  }
}

// POST /api/payment/portal
// Abre el portal de Stripe para que el usuario gestione su suscripción
exports.billingPortal = async (req, res) => {
  try {
    const cafeteria = await prisma.cafeteria.findUnique({
      where: { userId: req.user.id }
    })

    if (!cafeteria.stripeCustomerId)
      return res.status(400).json({ error: 'No tienes suscripción activa' })

    const session = await stripe.billingPortal.sessions.create({
      customer:   cafeteria.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    })

    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: 'Error al abrir portal de facturación' })
  }
}

// POST /api/payment/webhook
// Stripe llama este endpoint cuando hay un evento de pago
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`)
  }

  const session = event.data.object

  switch (event.type) {

    case 'checkout.session.completed': {
      const { cafeteriaId } = session.metadata
      await prisma.cafeteria.update({
        where: { id: cafeteriaId },
        data: {
          status:           'ACTIVE',
          stripeCustomerId: session.customer,
          stripeSubId:      session.subscription,
        }
      })
      break
    }

    case 'invoice.payment_failed':
    case 'customer.subscription.deleted': {
      const customerId = session.customer
      await prisma.cafeteria.updateMany({
        where: { stripeCustomerId: customerId },
        data:  { status: 'SUSPENDED' }
      })
      break
    }

    case 'customer.subscription.updated': {
      const customerId = session.customer
      const status     = session.status === 'active' ? 'ACTIVE' : 'SUSPENDED'
      await prisma.cafeteria.updateMany({
        where: { stripeCustomerId: customerId },
        data:  { status }
      })
      break
    }
  }

  res.json({ received: true })
}
