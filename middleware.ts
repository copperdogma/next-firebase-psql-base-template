import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { loggers, getRequestId, createSampledLogger } from './lib/logger';

// Create a sampled logger for middleware with 10% sampling rate for high-volume paths
const logger = createSampledLogger(loggers.middleware, 0.1);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = getRequestId();
  const startTime = Date.now();

  // Create request-specific logger with request ID
  const reqLogger = logger.child({ requestId, path: pathname });

  // Use standard rate for important events, sampled rate for routine events
  const isHighTrafficPath = pathname.startsWith('/api/auth') || pathname.includes('.');

  // Only log detailed request info for non-static resources to reduce noise
  if (!isHighTrafficPath) {
    reqLogger.info({
      msg: 'Request started',
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });
  } else {
    // For high-traffic paths, use trace level with minimal info
    reqLogger.trace({
      msg: 'Static request',
      method: request.method,
      path: pathname,
    });
  }

  // Skip API auth routes to avoid the NextAuth error
  if (pathname.startsWith('/api/auth')) {
    // Moved from debug to trace level to reduce log volume
    reqLogger.trace('Skipping API auth route');
    return NextResponse.next();
  }

  // Skip file requests
  if (pathname.includes('.')) {
    // Moved from debug to trace level to reduce log volume
    reqLogger.trace('Skipping file request');
    return NextResponse.next();
  }

  // Check for Playwright test bypass cookie for E2E testing
  const isPlaywrightTest = request.cookies.get('__playwright_auth_bypass')?.value === 'true';
  const testSessionId = request.cookies.get('__playwright_test_session_id')?.value;
  const testSessionIdParam = request.nextUrl.searchParams.get('testSessionId');

  // Allow E2E test requests to bypass auth for specific session IDs
  if (isPlaywrightTest && testSessionId && testSessionId === testSessionIdParam) {
    reqLogger.info({
      msg: 'Allowing E2E test to bypass auth',
      testSessionId,
    });
    return NextResponse.next();
  }

  // Define public routes
  const publicRoutes = ['/', '/login', '/about', '/api/health', '/manifest.webmanifest'];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => {
    if (route === pathname) {
      return true;
    }
    return false;
  });

  // Get token
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Only log auth status for user-facing pages, not assets or API calls
  if (!isHighTrafficPath) {
    reqLogger.debug({
      msg: 'Auth status',
      isPublicRoute,
      isAuthenticated,
      userId: token?.sub,
    });
  }

  // Redirect authenticated users from login to dashboard
  if (isAuthenticated && pathname === '/login') {
    reqLogger.info({
      msg: 'Redirecting authenticated user from login to dashboard',
      userId: token.sub,
    });
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    reqLogger.info({
      msg: 'Redirecting unauthenticated user to login',
      redirectUrl: `/login?callbackUrl=${encodeURIComponent(pathname + search)}`,
    });
    const callbackUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // Allow access for public routes or authenticated users
  const response = NextResponse.next();

  // Log request completion only for non-static resources
  if (!isHighTrafficPath) {
    const duration = Date.now() - startTime;
    reqLogger.info({
      msg: 'Request completed',
      duration,
      isPublicRoute,
      isAuthenticated,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
