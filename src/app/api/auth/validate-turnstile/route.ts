import { NextRequest, NextResponse } from "next/server";
import { validateTurnstileToken } from "next-turnstile";
import { v4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Turnstile token is required" },
        { status: 400 }
      );
    }

    const validationResponse = await validateTurnstileToken({
      token,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      idempotencyKey: v4(),
      sandbox: process.env.NODE_ENV === "development",
    });

    if (!validationResponse.success) {
      return NextResponse.json(
        { error: "Invalid Turnstile token" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}