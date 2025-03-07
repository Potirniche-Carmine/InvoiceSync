import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest) {
  console.log("Middleware running for:", req.nextUrl.pathname);
  
  const token = await getToken({ req, secret });
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');
  const isLoginRoute = req.nextUrl.pathname === '/';
  if (isLoginRoute && token) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("No token found, redirecting to login");
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const currentTime = Date.now();
  const loginTime = token.loginTimeStamp as number;

  const diffInMilliseconds = currentTime - loginTime;
  const diffinHours = diffInMilliseconds / (1000 * 60 * 60);

  if (diffinHours > 24) {
    console.log("Token expired, redirecting to login");
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/data/:path*",
  ],
};