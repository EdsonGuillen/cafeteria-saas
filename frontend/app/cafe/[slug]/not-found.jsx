export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">☕</div>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Cafetería no encontrada</h1>
        <p className="text-gray-400 text-sm">Esta página no existe o la suscripción está inactiva.</p>
        <a href="/" className="mt-6 inline-block text-amber-600 hover:underline text-sm">
          Volver al inicio
        </a>
      </div>
    </main>
  )
}
