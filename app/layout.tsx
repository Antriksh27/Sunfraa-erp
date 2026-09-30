import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAProvider from "@/components/PWAProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sunfraa ERP - Enterprise Solar Operations",
  description: "Turnkey Commercial & Industrial Solar Operations, Engineering Studio & Statutory Liaisoning ERP",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sunfraa ERP",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-[#f8fafc] text-[#181d26] font-sans antialiased selection:bg-[#f5e9d4] selection:text-[#882400]`}>
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
