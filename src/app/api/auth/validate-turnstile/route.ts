import { NextRequest, NextResponse } from "next/server";
import { validateTurnstileToken } from "next-turnstile";
import { v4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    console.log('Received token:', token);

    if (!token) {
      console.log('No token provided');
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

    console.log('Validation response:', validationResponse); // Add this log

    if (!validationResponse.success) {
      return NextResponse.json(
        { error: "Security check failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Validation error:", error); // Improved error logging
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}