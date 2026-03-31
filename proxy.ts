import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

const protectedRoutes = ['/chats', '/profile'];
const authRoutes = '/auth';

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  const user = req.auth?.user;
  console.log(user)

  if (user && !user?.isVerified) {
    if (!pathname.startsWith(`/auth/verify`)) {
      return NextResponse.redirect(
        new URL(`/auth/verify/${user?.id}`, req.url),
      );
    }
  } else if (user && user.isVerified) {
    if (req.nextUrl.pathname.startsWith(authRoutes)) {
      return NextResponse.redirect(new URL('/chats', req.url));
    }
  } else {
    const isProtectedRoute = protectedRoutes.some((route) => {
      if (req.nextUrl.pathname.startsWith(route)) {
        return true;
      }
    });

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }
    console.log(isProtectedRoute)
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/chats/:path*', '/profile/:path*', '/auth/:path*'],
};
