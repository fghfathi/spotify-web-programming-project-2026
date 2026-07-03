// frontend/app/playlists/page.tsx
"use client";

import { useState } from "react";
import { mockUser, SUBSCRIPTION_LIMITS, initialPlaylists } from "@/data/mockHomeData";
import { Playlist } from "@/types/home";
import PlaylistCard from "@/components/playlists/PlaylistCard";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const limit = SUBSCRIPTION_LIMITS[mockUser.subscription];
  const canCreate = playlists.length < limit;

  const handleCreate = () => {
    if (!canCreate) {
      alert(`Limit reached! Your ${mockUser.subscription} plan allows max ${limit} playlists.`);
      return;
    }
    const name = prompt("Enter playlist name:");
    if (name) {
      const newPl: Playlist = {
        id: Math.random().toString(36).substr(2, 9),
        title: name,
        trackCount: 0,
        songs: []
      };
      setPlaylists([...playlists, newPl]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      setPlaylists(playlists.filter(p => p.id !== id));
    }
  };

  const handleRename = (id: string) => {
    const pl = playlists.find(p => p.id === id);
    const newName = prompt("Enter new name:", pl?.title);
    if (newName) {
      setPlaylists(playlists.map(p => p.id === id ? { ...p, title: newName } : p));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Playlists</h1>
          <p className="text-zinc-400 mt-1">
            Plan: <span className="text-amber-400 capitalize">{mockUser.subscription}</span> 
            ({playlists.length} / {limit === Infinity ? "∞" : limit})
          </p>
        </div>
        
        {playlists.length > 0 && (
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 text-black font-bold py-3 px-8 rounded-full transition"
          >
            Create New Playlist
          </button>
        )}
      </header>

      {playlists.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
          <div className="bg-zinc-900 p-6 rounded-full mb-6">
            <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2ZM21 16c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No playlists yet</h2>
          <p className="text-zinc-400 mb-8 text-center max-w-xs">
            Create your first playlist and start building your collection.
          </p>
          <button
            onClick={handleCreate}
            className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-zinc-200 transition"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map(pl => (
            <PlaylistCard 
              key={pl.id} 
              playlist={pl} 
              onDelete={handleDelete} 
              onRename={handleRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
