// frontend/components/albums/SingleCard.tsx
"use client";

import { Song, Playlist } from "@/types/music";
import PlaylistSelector from "./PlaylistSelector";

interface SingleCardProps {
  song: Song;
  playlists: Playlist[];
  onPlay: (song: Song) => void;
  onArtistClick: (artistId: string) => void;
  onAlbumClick: (albumId: string) => void;
  onTogglePlaylist: (playlistId: string, song: Song) => void;
}

export default function SingleCard({
  song,
  playlists,
  onPlay,
  onArtistClick,
  onAlbumClick,
  onTogglePlaylist,
}: SingleCardProps) {
  return (
    <div
      onClick={() => onPlay(song)}
      className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-800/40 transition cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-square w-full bg-zinc-800 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="object-cover w-full h-full" />
          ) : (
            <svg className="w-16 h-16 text-zinc-600 group-hover:scale-105 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.536 8.464a5 5 0 0 1 0 7.072m2.828-9.9a9 9 0 0 1 0 12.728M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15Z" />
            </svg>
          )}
        </div>
        <h3 className="text-white font-bold text-sm truncate mb-1">{song.title}</h3>
        
        <div className="flex flex-col gap-1 items-start">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArtistClick(song.artistId);
            }}
            className="text-xs text-zinc-400 hover:text-white hover:underline transition"
          >
            {song.artistName}
          </button>

          {song.albumId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAlbumClick(song.albumId!);
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 hover:underline transition"
            >
              Album: {song.albumName}
            </button>
          )}

          {song.genre && (
            <span className="mt-1 inline-block rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {song.genre}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-800/50">
        <span className="text-[10px] text-zinc-500 font-mono">
          {song.playsCount.toLocaleString()} plays
        </span>
        <PlaylistSelector
          song={song}
          playlists={playlists}
          onTogglePlaylist={onTogglePlaylist}
        />
      </div>
    </div>
  );
}
