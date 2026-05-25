import { notFound } from 'next/navigation'

async function getCafeteria(slug) {
  try {
    const res = await fetch(`http://localhost:4000/api/cafeteria/${slug}`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const CATEGORY_ICON = {
  'café':    '☕',
  'leche':   '🥛',
  'jarabe':  '🍯',
  'insumo':  '📦',
  'equipo':  '⚙️',
  'otro':    '📋',
}

export default async function CafeteriaPage({ params }) {
  const { slug } = await params
  const cafeteria = await getCafeteria(slug)
  if (!cafeteria) notFound()

  const categories = [...new Set(cafeteria.inventory.map(i => i.category))]

  return (
    <main className="min-h-screen bg-stone-50">

      {/* Hero */}
      <section className="bg-amber-900 text-white py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">☕</div>
          <h1 className="text-4xl font-bold mb-2">{cafeteria.name}</h1>
          {cafeteria.description && (
            <p className="text-amber-200 text-lg mt-3">{cafeteria.description}</p>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-amber-300">
            {cafeteria.phone   && <span>📞 {cafeteria.phone}</span>}
            {cafeteria.address && <span>📍 {cafeteria.address}</span>}
          </div>
        </div>
      </section>

      {/* Menú / inventario disponible */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
          Nuestro café
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          Insumos y métodos disponibles en {cafeteria.name}
        </p>

        {cafeteria.inventory.length === 0 ? (
          <p className="text-center text-gray-400">Próximamente...</p>
        ) : (
          <div className="space-y-8">
            {categories.map(cat => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{CATEGORY_ICON[cat] || '📋'}</span>
                  <h3 className="text-lg font-medium text-gray-700 capitalize">{cat}</h3>
                  <div className="flex-1 h-px bg-gray-200 ml-2"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {cafeteria.inventory
                    .filter(i => i.category === cat)
                    .map(item => (
                      <div key={item.id}
                        className="bg-white rounded-xl p-4 border border-stone-100 hover:border-amber-200 transition">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-400">
                            {item.quantity} {item.unit}
                          </span>
                          {item.method && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              {item.method}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-300 border-t border-stone-100">
        Página generada por CaféSaaS · {cafeteria.name}
      </footer>

    </main>
  )
}
