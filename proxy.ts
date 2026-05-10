import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const protectedRoutes = ["/chats", "/profile"];
const authRoutes = "/auth";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  const isLoggedIn = !!refreshToken;

  if (isLoggedIn) {
    if (pathname.startsWith(authRoutes)) {
      return NextResponse.redirect(new URL("/chats", req.url));
    }
  } else {
    const isProtectedRoute = protectedRoutes.some((route) => {
      if (pathname.startsWith(route)) {
        return true;
      }
    });

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chats/:path*", "/profile/:path*", "/auth/:path*"],
};
