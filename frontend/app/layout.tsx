import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
        {/* CurrentUserProvider wraps everything so every page — home, artist
            dashboard, and the whole /support portal — reads the exact same
            role. This is the fix for the sidebar delay/leakage bugs. */}
        <CurrentUserProvider>
          <MusicPlayerProvider>
            {children}
            <MusicPlayer />
          </MusicPlayerProvider>
        </CurrentUserProvider>
      </body>
    </html>
  );
}