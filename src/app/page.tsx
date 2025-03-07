"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Turnstile } from "next-turnstile";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<string>();
  const isUrlError = useRef<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
    
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam);
      setError(decodedError);
      isUrlError.current = true; 
    }
  }, [router]);

  const clearErrorParam = () => {
    if (window.location.search.includes('error=')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      isUrlError.current = false; 
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrorParam();
    setError(null);
    setIsLoading(true);

    if (!formRef.current) {
      setIsLoading(false);
      return;
    }

    if (turnstileStatus !== "success") {
      setError("Please verify you are not a robot");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(formRef.current);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const token = turnstileRef.current;

    try {
      const validationResponse = await fetch("/api/auth/validate-turnstile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!validationResponse.ok) {
        window.location.href = `/?error=${encodeURIComponent("Security check failed. Please try again.")}`;
        return;
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        window.location.href = `/?error=${encodeURIComponent(result.error)}`;
        return; 
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      window.location.href = `/?error=${encodeURIComponent("An error occurred. Please try again.")}`;
      return; 
    }
    
    setIsLoading(false);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white text-black rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">Admin Login</h1>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-black">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              onChange={clearErrorParam}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              onChange={clearErrorParam}
            />
          </div>
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              retry="auto"
              refreshExpired="auto"
              onError={() => {
                if (!isUrlError.current) { 
                  setTurnstileStatus("error");
                  setError("Security check failed. Please try again.");
                }
              }}
              onExpire={() => {
                if (!isUrlError.current) { 
                  setTurnstileStatus("expired");
                  setError("Security check expired. Please verify again.");
                }
              }}
              onLoad={() => {
                setTurnstileStatus("required");
                if (!isUrlError.current) { 
                  setError(null);
                }
              }}
              onVerify={(token) => {
                setTurnstileStatus("success");
                turnstileRef.current = token;
                if (!isUrlError.current) {
                  setError(null);
                }
              }}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm" aria-live="polite">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}