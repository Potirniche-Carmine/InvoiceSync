import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Check for the auth token in cookies
  const token = req.cookies.get('authToken');

  if (!token) {
    // Redirect to the sign-in page if no token
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Protect the dashboard and its subroutes
export const config = {
  matcher: ['/dashboard/:path*'], // Protects /dashboard and all subroutes
};
