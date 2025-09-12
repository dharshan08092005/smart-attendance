import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/'];
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if token exists and is valid
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if user is accessing the correct dashboard
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/dashboard/admin-dashboard') && user.userType !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (pathname.startsWith('/dashboard/faculty-dashboard') && user.userType !== 'faculty') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (pathname.startsWith('/dashboard/student_dashboard') && user.userType !== 'student') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/auth/:path*'
  ]
};
