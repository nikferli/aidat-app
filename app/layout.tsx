import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aidat Yönetim Sistemi",
  description: "Site aidat takip ve ödeme sistemi",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta name="theme-color" content="#1a3c5e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Aidat" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
