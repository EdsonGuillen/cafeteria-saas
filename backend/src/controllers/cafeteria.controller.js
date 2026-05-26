const prisma = require('../db')
// GET /api/cafeteria/me
exports.getMe = async (req, res) => {
  try {
    const cafeteria = await prisma.cafeteria.findUnique({
      where: { userId: req.user.id }
    })
    if (!cafeteria) return res.status(404).json({ error: 'Cafetería no encontrada' })
    res.json(cafeteria)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// PUT /api/cafeteria/me
exports.updateMe = async (req, res) => {
  const { name, description, phone, address } = req.body
  try {
    const cafeteria = await prisma.cafeteria.update({
      where: { userId: req.user.id },
      data:  { name, description, phone, address }
    })
    res.json(cafeteria)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
