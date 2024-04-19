// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  let response = NextResponse.next();

  // Cache behaviors
  // * Static files are already cached on Azion edge!
  switch (path) {
    // static page cache
    case '/':
      response.headers.set('Cache-Control', 'max-age=31536000, immutable');
      break;
    // server side render without cache
    case '/ssr':
      response.headers.set('Cache-Control', 'no-cache');
      break;
    // server side render with cache
    case '/ssr-cache':
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=10, stale-while-revalidate=59',
      );
      break;
    default:
      break;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      // Also ignore prefetches (from next/link)
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
