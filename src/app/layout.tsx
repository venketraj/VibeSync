import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeSync",
  description: "AI mood sync for your music library.",
  manifest: "/manifest.json",
  applicationName: "VibeSync",
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#090b10] text-slate-100">{children}</body>
    </html>
  );
}
