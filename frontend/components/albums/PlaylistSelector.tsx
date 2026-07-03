// frontend/components/albums/PlaylistSelector.tsx
"use client";

import { useState } from "react";
import { Playlist, Song } from "@/types/music";

interface PlaylistSelectorProps {
  song: Song;
  playlists: Playlist[];
  onTogglePlaylist: (playlistId: string, song: Song) => void;
}

export default function PlaylistSelector({ song, playlists, onTogglePlaylist }: PlaylistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
        title="Manage in Playlists"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v15m7-7H5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 p-2">
            <h4 className="text-xs font-semibold text-zinc-400 px-3 py-1 mb-1 border-b border-zinc-800">
              Add/Remove Playlists
            </h4>
            {playlists.length === 0 ? (
              <p className="text-xs text-zinc-500 p-3 italic">No playlists created.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {playlists.map((playlist) => {
                  const isChecked = playlist.songs?.some((s) => s.id === song.id) || false;
                  return (
                    <label
                      key={playlist.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-md cursor-pointer transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onTogglePlaylist(playlist.id, song)}
                        className="rounded border-zinc-700 bg-zinc-950 text-green-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">{playlist.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
