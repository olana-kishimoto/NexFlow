import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const authRoutes = ['/auth', '/auth/callback'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const sessionCookie = request.cookies.get('sb-auth-token')?.value;

  if (!sessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (sessionCookie && pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
