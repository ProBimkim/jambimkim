import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if any cookie name includes 'better-auth.session_token' (handles __Secure- and __Host- prefixes)
  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(cookie => cookie.name.includes('better-auth.session_token'));

  // If we are at root, and no session, redirect to login
  if (request.nextUrl.pathname === '/' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
