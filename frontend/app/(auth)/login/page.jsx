'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-semibold text-gray-800">Bienvenido de vuelta ☕</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión para gestionar tu cafetería</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

        {[
          { name: 'email',    label: 'Correo electrónico', type: 'email',    placeholder: 'cafe@ejemplo.com' },
          { name: 'password', label: 'Contraseña',         type: 'password', placeholder: '••••••••' },
        ].map(({ name, label, type, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <input
              name={name} type={type} value={form[name]} placeholder={placeholder}
              onChange={handleChange} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        ))}

        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition">
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>

        <p className="text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-amber-600 hover:underline">Regístrate gratis</a>
        </p>
      </form>
    </main>
  )
}
