import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Fetch session directly from the auth API to ensure we check cookies correctly
  const { data: session } = await fetch(new URL("/api/auth/get-session", request.url).toString(), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  }).then((res) => res.json()).catch(() => ({ data: null }));

  const hasSession = !!session;

  // If we are at root, and no session, redirect to login
  if (request.nextUrl.pathname === '/' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
