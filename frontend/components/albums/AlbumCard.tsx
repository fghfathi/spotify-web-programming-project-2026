// frontend/components/albums/AlbumCard.tsx
"use client";

import { Album } from "@/types/music";

interface AlbumCardProps {
  album: Album;
  onAlbumClick: (albumId: string) => void;
  onArtistClick: (artistId: string) => void;
}

export default function AlbumCard({ album, onAlbumClick, onArtistClick }: AlbumCardProps) {
  return (
    <div
      onClick={() => onAlbumClick(album.id)}
      className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800/40 transition cursor-pointer group"
    >
      <div className="relative aspect-square w-full bg-zinc-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={album.title} className="object-cover w-full h-full" />
        ) : (
          <svg className="w-16 h-16 text-zinc-600 group-hover:scale-105 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2ZM21 16c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z" />
          </svg>
        )}
      </div>
      <h3 className="text-white font-bold text-sm truncate mb-1">{album.title}</h3>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering card navigation
          onArtistClick(album.artistId);
        }}
        className="text-xs text-zinc-400 hover:text-white hover:underline transition"
      >
        {album.artistName}
      </button>
      <p className="text-[10px] text-zinc-500 mt-2">Album • {album.releaseDate}</p>
    </div>
  );
}
