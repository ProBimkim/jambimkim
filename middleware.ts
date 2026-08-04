import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // Check if better-auth session cookie exists (better-auth uses better-auth.session_token)
  // Or simply rely on the fact that if they are going to the root, they should be logged in
  // Since we are mocking/simulating the DB requirement, we just redirect if there's absolutely no cookie
  
  // NOTE: In a real better-auth setup, we use auth.api.getSession
  // Since we might not have the DB fully populated, we'll implement a soft check 
  // or a hard check if better-auth session cookie is present.
  
  const hasSession = request.cookies.has("better-auth.session_token");
  
  // If we are at root, and no session, redirect to login
  if (request.nextUrl.pathname === '/' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
