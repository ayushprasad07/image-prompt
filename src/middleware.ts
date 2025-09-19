import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const url = request.nextUrl.clone();

  // Redirect anyone visiting '/' to '/sign-in'
  if (url.pathname === '/') {
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // If already signed in, prevent access to auth pages
  if (token && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    if (token.role === 'superadmin') {
      url.pathname = '/superadmin';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // Protect dashboard and superadmin routes
  if (!token && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/superadmin'))) {
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // Restrict superadmin routes
  if (token && token.role !== 'superadmin' && url.pathname.startsWith('/superadmin')) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/dashboard/:path*',
    '/superadmin/:path*',
    '/verify/:path*',
    '/', // ensure '/' is matched and redirected
  ],
};
