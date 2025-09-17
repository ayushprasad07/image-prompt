import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const url = request.nextUrl.clone();

 
  if (token && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    // Redirect based on role
    if (token.role === 'superadmin') {
      url.pathname = '/superadmin';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }


  if (!token && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/superadmin'))) {
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (token && token.role !== 'superadmin' && url.pathname.startsWith('/superadmin')) {
    // Non-superadmin trying to access superadmin route
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/',
    '/dashboard/:path*',
    '/superadmin/:path*', // superadmin-only routes
    '/verify/:path*',
  ],
};
