import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { MusicPlayerProvider } from "@/context/MusicPlayerContext";
import { CurrentUserProvider } from "@/context/CurrentUserContext";
import MusicPlayer from "@/components/player/MusicPlayer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shpotify",
  description: "A Spotify-like music streaming experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black">
        {/* AuthProvider is the outermost source of truth for the logged-in
            user + JWT. CurrentUserProvider derives the role from it so every
            page — home, artist dashboard, and the whole /support portal —
            reads the exact same role from the real session. */}
        <AuthProvider>
          <CurrentUserProvider>
            <MusicPlayerProvider>
              {children}
              <MusicPlayer />
            </MusicPlayerProvider>
          </CurrentUserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}