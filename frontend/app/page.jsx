import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-amber-50">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-amber-100">
        <span className="text-xl font-semibold text-amber-800">☕ CaféSaaS</span>
        <div className="flex gap-4">
          <Link href="/login"
            className="text-sm text-gray-500 hover:text-gray-700 transition">
            Iniciar sesión
          </Link>
          <Link href="/register"
            className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition">
            Registrarse gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6">
        <div className="text-6xl mb-6">☕</div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Gestiona tu cafetería<br/>desde cualquier lugar
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Controla tu inventario, publica tu menú en línea y acepta suscripciones.
          Todo en una sola plataforma diseñada para cafeterías.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register"
            className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-medium transition text-lg">
            Empieza gratis
          </Link>
          <Link href="/cafe/cafe-con-c"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-3 rounded-xl font-medium transition text-lg">
            Ver demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📦', title: 'Inventario inteligente', desc: 'Registra café por gramos, métodos de extracción e insumos. Alertas automáticas de stock bajo.' },
            { icon: '🌐', title: 'Landing page pública', desc: 'Cada cafetería obtiene su propia página en línea autogenerada con su menú e información.' },
            { icon: '💳', title: 'Pagos automáticos', desc: 'Suscripciones mensuales con Stripe. Tu cuenta se activa al instante después del pago.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precio */}
      <section className="bg-amber-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-2">Un solo plan, sin sorpresas</h2>
        <p className="text-amber-200 mb-8">Todo incluido por un precio fijo mensual</p>
        <div className="bg-white text-gray-800 rounded-2xl p-8 max-w-sm mx-auto">
          <p className="text-5xl font-bold mb-1">$299 <span className="text-2xl font-normal text-gray-400">MXN</span></p>
          <p className="text-gray-400 text-sm mb-6">por mes</p>
          <ul className="text-left space-y-2 text-sm text-gray-600 mb-6">
            {['Inventario ilimitado', 'Landing page pública', 'Alertas de stock', 'Soporte incluido'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link href="/register"
            className="block bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium transition text-center">
            Comenzar ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        CaféSaaS © 2025 · Hecho con ☕ en Celaya, Gto.
      </footer>

    </main>
  )
}
