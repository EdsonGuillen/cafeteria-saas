'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

const UNITS      = ['g', 'kg', 'ml', 'l', 'piezas', 'bolsas']
const CATEGORIES = ['café', 'leche', 'jarabe', 'insumo', 'equipo', 'otro']
const METHODS    = ['espresso', 'v60', 'chemex', 'aeropress', 'prensa francesa', 'cold brew']
const STOCK_MIN  = 200

const STATUS_COLOR = { TRIAL: 'text-amber-500', ACTIVE: 'text-green-600', SUSPENDED: 'text-red-500' }
const STATUS_LABEL = { TRIAL: 'Prueba gratuita', ACTIVE: 'Activa ✓', SUSPENDED: 'Suspendida' }
const emptyForm    = { name: '', quantity: '', unit: 'g', category: 'café', method: '' }

export default function DashboardPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const pagoStatus   = searchParams.get('pago')

  const [user, setUser]               = useState(null)
  const [cafeteria, setCafeteria]     = useState(null)
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState('inventario')

  // Inventario
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [invError, setInvError]       = useState('')

  // Perfil
  const [perfil, setPerfil]           = useState({ name: '', description: '', phone: '', address: '' })
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [perfilMsg, setPerfilMsg]     = useState('')

  // Pago
  const [payLoading, setPayLoading]   = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/inventory'),
      api.get('/cafeteria/me'),
    ])
      .then(([{ data: u }, { data: inv }, { data: caf }]) => {
        setUser(u)
        setItems(inv)
        setCafeteria(caf)
        setPerfil({
          name:        caf.name        || '',
          description: caf.description || '',
          phone:       caf.phone       || '',
          address:     caf.address     || '',
        })
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [])

  const fetchInventory = async () => {
    const { data } = await api.get('/inventory')
    setItems(data)
  }

  // --- Inventario ---
  const handleChange    = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const openCreate      = () => { setEditing(null); setForm(emptyForm); setShowForm(true); setInvError('') }
  const openEdit        = (item) => {
    setEditing(item.id)
    setForm({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, method: item.method || '' })
    setShowForm(true)
    setInvError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setInvError('')
    try {
      editing ? await api.put(`/inventory/${editing}`, form) : await api.post('/inventory', form)
      await fetchInventory()
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
    } catch (err) {
      setInvError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este insumo?')) return
    await api.delete(`/inventory/${id}`)
    await fetchInventory()
  }

  // --- Perfil ---
  const handlePerfilChange = (e) => setPerfil({ ...perfil, [e.target.name]: e.target.value })

  const handlePerfilSubmit = async (e) => {
    e.preventDefault()
    setSavingPerfil(true)
    setPerfilMsg('')
    try {
      await api.put('/cafeteria/me', perfil)
      setPerfilMsg('✅ Perfil actualizado correctamente')
    } catch {
      setPerfilMsg('❌ Error al guardar el perfil')
    } finally {
      setSavingPerfil(false)
    }
  }

  // --- Pago ---
  const handleSuscribir = async () => {
    setPayLoading(true)
    try {
      const { data } = await api.post('/payment/create-checkout')
      window.location.href = data.url
    } catch { setPayLoading(false) }
  }

  const handlePortal = async () => {
    setPayLoading(true)
    try {
      const { data } = await api.post('/payment/portal')
      window.location.href = data.url
    } catch { setPayLoading(false) }
  }

  const logout = () => { document.cookie = 'token=; path=/; max-age=0'; router.push('/login') }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  const status   = cafeteria?.status || 'TRIAL'
  const lowStock = items.filter(i => i.unit === 'g' && i.quantity < STOCK_MIN)
  const isSuspended = status === 'SUSPENDED'

  return (
    <main className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">☕ {cafeteria?.name}</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition">
            Cerrar sesión
          </button>
        </div>

        {/* Alertas */}
        {pagoStatus === 'exitoso' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            ✅ ¡Pago exitoso! Tu suscripción está activa.
          </div>
        )}
        {isSuspended && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            ⚠️ Tu suscripción está suspendida. Renuévala para acceder al inventario y tu landing page.
          </div>
        )}
        {lowStock.length > 0 && !isSuspended && (
          <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-600 px-4 py-3 rounded-xl text-sm">
            ⚠️ Stock bajo: {lowStock.map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ')}
          </div>
        )}

        {/* Cards de estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Suscripción</p>
            <p className={`text-lg font-medium mt-1 ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Tu URL pública</p>
            <a href={`/cafe/${cafeteria?.slug}`} target="_blank"
              className="text-sm font-medium text-amber-600 hover:underline mt-1 block">
              /cafe/{cafeteria?.slug} ↗
            </a>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Insumos</p>
            <p className="text-lg font-medium text-gray-700 mt-1">{items.length} registrados</p>
          </div>
        </div>

        {/* Suscripción */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <h2 className="text-base font-medium text-gray-700 mb-1">Plan mensual</h2>
          <p className="text-sm text-gray-400 mb-3">$299 MXN/mes — inventario y landing page pública.</p>
          {status !== 'ACTIVE' ? (
            <button onClick={handleSuscribir} disabled={payLoading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              {payLoading ? 'Redirigiendo...' : '💳 Suscribirse ahora'}
            </button>
          ) : (
            <button onClick={handlePortal} disabled={payLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition">
              {payLoading ? 'Abriendo...' : 'Gestionar suscripción'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {['inventario', 'perfil'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'text-amber-600 border-b-2 border-amber-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                {tab === 'inventario' ? '📦 Inventario' : '✏️ Mi perfil'}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* Tab Inventario */}
            {activeTab === 'inventario' && (
              <div>
                {isSuspended ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">Reactiva tu suscripción para gestionar el inventario.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <button onClick={openCreate}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        + Agregar insumo
                      </button>
                    </div>

                    {showForm && (
                      <form onSubmit={handleSubmit} className="bg-amber-50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Nombre del insumo</label>
                          <input name="name" value={form.name} onChange={handleChange} required
                            placeholder="Ej: Café Etiopía Yirgacheffe"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                          <input name="quantity" type="number" step="0.1" min="0" value={form.quantity}
                            onChange={handleChange} required
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Unidad</label>
                          <select name="unit" value={form.unit} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                          <select name="category" value={form.category} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Método (opcional)</label>
                          <select name="method" value={form.method} onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                            <option value="">— ninguno —</option>
                            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        {invError && <p className="col-span-2 text-red-500 text-xs">{invError}</p>}
                        <div className="col-span-2 flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
                            Cancelar
                          </button>
                          <button type="submit" disabled={saving}
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar'}
                          </button>
                        </div>
                      </form>
                    )}

                    {items.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No hay insumos registrados.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                              <th className="pb-2 font-medium">Nombre</th>
                              <th className="pb-2 font-medium">Cantidad</th>
                              <th className="pb-2 font-medium">Categoría</th>
                              <th className="pb-2 font-medium">Método</th>
                              <th className="pb-2 font-medium">Estado</th>
                              <th className="pb-2 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map(item => {
                              const isLow = item.unit === 'g' && item.quantity < STOCK_MIN
                              return (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-amber-50 transition">
                                  <td className="py-3 font-medium text-gray-700">{item.name}</td>
                                  <td className="py-3 text-gray-600">{item.quantity} {item.unit}</td>
                                  <td className="py-3">
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="py-3 text-gray-500">{item.method || '—'}</td>
                                  <td className="py-3">
                                    {isLow
                                      ? <span className="text-red-500 text-xs font-medium">⚠ Stock bajo</span>
                                      : <span className="text-green-600 text-xs font-medium">✓ Disponible</span>
                                    }
                                  </td>
                                  <td className="py-3 flex gap-2 justify-end">
                                    <button onClick={() => openEdit(item)}
                                      className="text-xs text-blue-500 hover:text-blue-700 transition">Editar</button>
                                    <button onClick={() => handleDelete(item.id)}
                                      className="text-xs text-red-400 hover:text-red-600 transition">Eliminar</button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab Perfil */}
            {activeTab === 'perfil' && (
              <form onSubmit={handlePerfilSubmit} className="max-w-lg space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nombre de la cafetería</label>
                  <input name="name" value={perfil.name} onChange={handlePerfilChange} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                  <textarea name="description" value={perfil.description} onChange={handlePerfilChange} rows={3}
                    placeholder="Cuéntales a tus clientes sobre tu cafetería..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                  <input name="phone" value={perfil.phone} onChange={handlePerfilChange}
                    placeholder="461 123 4567"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Dirección</label>
                  <input name="address" value={perfil.address} onChange={handlePerfilChange}
                    placeholder="Av. Tecnológico 123, Celaya, Gto."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                {perfilMsg && (
                  <p className={`text-sm ${perfilMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                    {perfilMsg}
                  </p>
                )}
                <button type="submit" disabled={savingPerfil}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
                  {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </main>
  )
}
