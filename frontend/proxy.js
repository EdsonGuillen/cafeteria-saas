import { NextResponse } from 'next/server'

export function proxy(request) {
  const token    = request.cookies.get('token')?.value
  const isAuth   = request.nextUrl.pathname.startsWith('/dashboard')
  const isPublic = ['/login', '/register'].includes(request.nextUrl.pathname)

  if (isAuth && !token)
    return NextResponse.redirect(new URL('/login', request.url))

  if (isPublic && token)
    return NextResponse.redirect(new URL('/dashboard', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
}
