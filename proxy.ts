import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if better-auth session cookie exists (dev or prod)
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;
  const secureSessionToken = request.cookies.get("__Secure-better-auth.session_token")?.value;
  const hasSession = !!sessionToken || !!secureSessionToken;

  // If we are at root, and no session, redirect to login
  if (request.nextUrl.pathname === '/' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
