import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/auth/session',
  '/api/user',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`));
    
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`));

  // Get the session token from the request - check for Firebase session cookie
  const sessionToken = request.cookies.get('session');

  // If it's a protected route and there's no session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const url = new URL('/login', request.url);
    // Add the original URL as a query parameter to redirect after login
    url.searchParams.set('callbackUrl', encodeURIComponent(request.url));
    return NextResponse.redirect(url);
  }

  // If it's a public route and there is a session token, redirect to dashboard
  if (isPublicRoute && sessionToken) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes except those we explicitly protect
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/api/auth/session',
    '/api/user/:path*',
  ],
}; 