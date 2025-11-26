import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR, ruRU } from "@clerk/localizations";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "FastAuction - Аукционы в реальном времени",
  description: "Лучшая платформа для онлайн-аукционов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ruRU}>
      <html lang="ru">
        <body className={`${inter.className} antialiased bg-slate-50`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
