const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getCafeteriaId = async (userId) => {
  const cafeteria = await prisma.cafeteria.findUnique({ where: { userId } })
  if (!cafeteria) throw new Error('Cafetería no encontrada')
  return cafeteria.id
}

// GET /api/inventory
exports.getAll = async (req, res) => {
  try {
    const cafeteriaId = await getCafeteriaId(req.user.id)
    const items = await prisma.inventory.findMany({
      where:   { cafeteriaId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// POST /api/inventory
exports.create = async (req, res) => {
  const { name, quantity, unit, category, method } = req.body
  if (!name || quantity === undefined || !unit || !category)
    return res.status(400).json({ error: 'Faltan campos requeridos' })

  try {
    const cafeteriaId = await getCafeteriaId(req.user.id)
    const item = await prisma.inventory.create({
      data: { name, quantity: parseFloat(quantity), unit, category, method: method || null, cafeteriaId }
    })
    res.status(201).json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// PUT /api/inventory/:id
exports.update = async (req, res) => {
  const { id } = req.params
  const { name, quantity, unit, category, method } = req.body

  try {
    const cafeteriaId = await getCafeteriaId(req.user.id)
    const existing = await prisma.inventory.findFirst({ where: { id, cafeteriaId } })
    if (!existing) return res.status(404).json({ error: 'Insumo no encontrado' })

    const item = await prisma.inventory.update({
      where: { id },
      data:  { name, quantity: parseFloat(quantity), unit, category, method: method || null }
    })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// DELETE /api/inventory/:id
exports.remove = async (req, res) => {
  const { id } = req.params
  try {
    const cafeteriaId = await getCafeteriaId(req.user.id)
    const existing = await prisma.inventory.findFirst({ where: { id, cafeteriaId } })
    if (!existing) return res.status(404).json({ error: 'Insumo no encontrado' })

    await prisma.inventory.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
