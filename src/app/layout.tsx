import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { tournament } from "../../tournament.config";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: tournament.name,
  description: `Fantasy bracket contest for ${tournament.name}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy text-white">
        <AuthProvider>
          <nav className="border-b border-white/10 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <a href="/" className="font-bold text-lg">{tournament.name}</a>
              <div className="flex gap-4 text-sm text-gray-400">
                <a href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
                <a href="/rules" className="hover:text-white transition-colors">Rules</a>
                <a href="/my-picks" className="hover:text-white transition-colors">My Picks</a>
                <a href="/admin/results" className="hover:text-white transition-colors">Admin</a>
              </div>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-gray-600">
            <p>{tournament.name} &middot; {tournament.subtitle}</p>
            {tournament.disclaimer && <p className="mt-1">{tournament.disclaimer}</p>}
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
