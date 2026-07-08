// frontend/components/playlists/PlaylistCard.tsx
"use client";

import { Playlist } from "@/types/home";
import Link from "next/link";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
}

export default function PlaylistCard({ playlist, onDelete, onRename }: PlaylistCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:bg-zinc-800/50 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{playlist.title}</h3>
          <p className="text-sm text-zinc-400">{playlist.trackCount} Tracks</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onRename(playlist.id)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Rename
          </button>
          <button 
            onClick={() => onDelete(playlist.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {playlist.songs && playlist.songs.length > 0 ? (
          playlist.songs.map(song => (
            <div key={song.id} className="text-xs bg-zinc-800 p-2 rounded text-zinc-300">
              {song.title} - {song.artistName}
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-500 italic">No songs added yet.</p>
        )}
      </div>

      <Link 
        href="/albums" 
        className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition"
      >
        + Add Songs
      </Link>
    </div>
  );
}
