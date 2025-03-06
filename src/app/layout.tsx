import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from '@/components/header'
import { Footer } from "@/components/footer";
import { NetworkStatus } from '@/components/network-status';
import { InstallPrompt } from '@/components/install-prompt';
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "InvoiceSync",
  description: "An invoicing software that is specifically designed for locksmiths.",
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json'
};

export const viewport:Viewport = {
  themeColor: '#004aff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="InvoiceSync" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="InvoiceSync" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#004aff" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#004aff" />

        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#004aff" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialised flex flex-col min-h-screen bg-white text-black`}>
        <Header />
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <NetworkStatus />
        <InstallPrompt />
        <Script src="/register-sw.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}