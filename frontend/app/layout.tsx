import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MusicPlayerProvider } from "@/context/MusicPlayerContext";
import MusicPlayer from "@/components/player/MusicPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shpotify",
  description: "A Spotify-like music streaming experience.",
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
      <body className="min-h-full flex flex-col bg-black">
        {/* MusicPlayerProvider wraps the whole app so playback state (and
            the <audio> element itself) survives route changes. MusicPlayer
            is mounted once here, above the page content, so it renders on
            every route without each page needing to include it. */}
        <MusicPlayerProvider>
          {children}
          <MusicPlayer />
        </MusicPlayerProvider>
      </body>
    </html>
  );
}
