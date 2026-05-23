const { PrismaClient } = require('@prisma/client')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')

const prisma  = new PrismaClient()

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

exports.register = async (req, res) => {
  const { email, password, cafeteriaName, slug } = req.body
  if (!email || !password || !cafeteriaName || !slug)
    return res.status(400).json({ error: 'Todos los campos son requeridos' })

  try {
    const hashed = await bcrypt.hash(password, 12)
    const user   = await prisma.user.create({
      data: {
        email,
        password: hashed,
        cafeteria: { create: { name: cafeteriaName, slug: slug.toLowerCase() } }
      },
      include: { cafeteria: true }
    })
    res.status(201).json({
      token: signToken(user),
      user:  { id: user.id, email: user.email, cafeteria: user.cafeteria }
    })
  } catch (e) {
    if (e.code === 'P2002')
      return res.status(409).json({ error: 'Email o slug ya en uso' })
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { cafeteria: true }
    })
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    res.json({
      token: signToken(user),
      user:  { id: user.id, email: user.email, cafeteria: user.cafeteria }
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    include: { cafeteria: true }
  })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  const { password: _, ...safe } = user
  res.json(safe)
}
