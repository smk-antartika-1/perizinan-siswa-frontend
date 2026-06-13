import { NextRequest, NextResponse } from 'next/server';

// Route publik yang tidak perlu autentikasi
const PUBLIC_PATHS = ['/login'];

// Cookie yang di-set oleh backend saat login (sesuai perizinan-siswa-api/src/modules/auth/cookies.js)
const SESSION_COOKIE_NAMES = ['access_token', 'refresh_token'];

function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.has('logged_in') || SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lewati asset statis, API routes internal Next.js, manifest, dll.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest') ||
    pathname.endsWith('.webmanifest') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.json')
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  const authenticated = hasSessionCookie(req);

  // User tidak login, coba akses halaman protected → redirect ke /login
  if (!isPublicPath && !authenticated) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // User sudah login, coba akses /login → redirect ke /dashboard
  if (isPublicPath && authenticated) {
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua request kecuali:
     * - _next/static (file statis)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
