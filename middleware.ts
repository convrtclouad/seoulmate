import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /login and /signup to /intro (no auth needed)
  if (pathname === "/login" || pathname === "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/intro";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api).*)"],
};
