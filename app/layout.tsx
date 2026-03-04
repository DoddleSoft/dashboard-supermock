import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import localFont from "next/font/local";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const maian = localFont({
  src: "./fonts/maian.ttf",
  variable: "--font-maian", // This defines the CSS variable name
  display: "swap", // Prevents invisible text while loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard | SuperMock - IELTS Mock Test Platform",
  description: "Manage your IELTS mock test and your center with SuperMock.net",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${maian.variable} antialiased`}
          suppressHydrationWarning
        >
          <Toaster position="top-right" richColors />
          {children}
        </body>
      </AuthProvider>
    </html>
  );
}
