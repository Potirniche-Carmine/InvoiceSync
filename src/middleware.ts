import { getToken} from "next-auth/jwt";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest){
  const token = await getToken({req, secret});
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  if (!token) {
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
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();

};

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/data/:path*",
  ],
};