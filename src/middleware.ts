import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('inbox-session')?.value
  const secret = process.env.AUTH_SECRET

  if (!secret || session !== secret) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Protect everything except Next.js internals, the login page, and the auth API
  matcher: ['/((?!_next|favicon\\.ico|login|api/auth).*)'],
}
