import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "SeoulMate",
    template: "%s · SeoulMate",
  },
  description: "Your AI-powered group travel companion for South Korea",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SeoulMate",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "SeoulMate",
    title: "SeoulMate — Korea Travel Companion",
    description: "Expense splitting, smart schedules, and AI tools for your Korea trip",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
