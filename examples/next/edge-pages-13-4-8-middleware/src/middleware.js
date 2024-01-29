import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.nextUrl.searchParams.has('rewrite')) {
    console.log("rewrite true!")
    return NextResponse.rewrite(new URL('/rewrite-page', request.url));
  }

  if (request.nextUrl.searchParams.has('redirect')) {
    return NextResponse.redirect(new URL('/redirect_page', request.url));
  }

  if (request.nextUrl.searchParams.has('next')) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  if (request.nextUrl.searchParams.has('setHeader')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-hello-from-middleware1', 'hello');
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (request.nextUrl.searchParams.has('throw')) {
    throw new Error('Error from middleware');
  }

  if (request.nextUrl.searchParams.has('returns')) {
    const content = `
      <head>
          <meta charset="UTF-8" />
      </head>
      <body>
          <h1>Response from middleware</h1>
      </body>
    `;

    return new NextResponse(content, {
      status: 401,
      headers: {
        'content-type': 'text/html',
      },
    });
  }

  response.cookies.set('x-cookie-from-middleware', 'hello-cookie');
  response.headers.set('x-header-from-middleware', 'hello-header');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};