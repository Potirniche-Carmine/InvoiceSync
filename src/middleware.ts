import { getToken} from "next-auth/jwt";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest){
  const token = await getToken({req, secret});

  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  const currentTime = Date.now();
  const loginTime = token.loginTimeStamp as number;

  const diffInMilliseconds = currentTime - loginTime;
  const diffinHours = diffInMilliseconds / (1000 * 60 * 60);

  if (diffinHours > 24) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }
  return NextResponse.next();

};

export const config = {
  matcher: [
    "/admin/dashboard",
    "/admin/dashboard/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};