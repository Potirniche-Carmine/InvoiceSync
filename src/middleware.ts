import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const token = await getToken({ req, secret });
  

  if (pathname.startsWith('/api/data/') && !token) {
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
  
  if (pathname.startsWith('/dashboard') && !token) {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }
  
  if (pathname === '/' && token) {

    const currentTime = Date.now();
    const loginTime = token.loginTimeStamp as number;
    
    if (!loginTime || (currentTime - loginTime) / (1000 * 60 * 60) <= 24) {
      const url = new URL('/dashboard', req.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/data/:path*'],
};