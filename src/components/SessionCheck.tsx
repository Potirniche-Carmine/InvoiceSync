"use client";

import { SessionProvider } from "next-auth/react";

export function SessionCheck({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}