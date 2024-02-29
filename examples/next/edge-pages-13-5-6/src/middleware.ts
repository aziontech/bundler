// middleware.ts
import { NextResponse } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: any) {
  return NextResponse.redirect(new URL('/api/hello', request.url))
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/about/:path*',
}