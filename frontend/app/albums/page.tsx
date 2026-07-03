"use client";

import { useState, useEffect } from "react";
import { mockSongs, mockAlbums, mockArtists } from "@/data/mockMusicData";
import { Song, Album, Artist, Playlist } from "@/types/music";
import AlbumCard from "@/components/albums/AlbumCard";
import SingleCard from "@/components/albums/SingleCard";
import PlaylistSelector from "@/components/albums/PlaylistSelector"; // Add this line

export default function AlbumsAndSinglesPage() {
  // Navigation & detailed modal views states
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"plays" | "date">("plays");

  // Dynamic player state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Playlists fetched from localStorage
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Hydrate playlists from localStorage safely on client side
    const stored = localStorage.getItem("user_playlists");
    if (stored) {
      setPlaylists(JSON.parse(stored));
    }
  }, []);

  // Update localStorage whenever the state changes
  const savePlaylists = (updated: Playlist[]) => {
    setPlaylists(updated);
    localStorage.setItem("user_playlists", JSON.stringify(updated));
  };

  // Manage playlist songs toggle (add or remove limit-aware)
  const handleTogglePlaylist = (playlistId: string, song: Song) => {
    const updated = playlists.map((pl) => {
      if (pl.id !== playlistId) return pl;

      const songExists = pl.songs?.some((s) => s.id === song.id);
      let updatedSongs = pl.songs ? [...pl.songs] : [];

      if (songExists) {
        updatedSongs = updatedSongs.filter((s) => s.id !== song.id);
      } else {
        updatedSongs.push(song);
      }

      return {
        ...pl,
        songs: updatedSongs,
        trackCount: updatedSongs.length,
      };
    });
    savePlaylists(updated);
  };

  // Logic to view individual entities
  const handleAlbumClick = (albumId: string) => {
    const album = mockAlbums.find((a) => a.id === albumId);
    if (album) setSelectedAlbum(album);
  };

  const handleArtistClick = (artistId: string) => {
    const artist = mockArtists.find((a) => a.id === artistId);
    if (artist) setSelectedArtist(artist);
  };

  // Filter and sorting logic
  const filteredSongs = mockSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artistName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlbums = mockAlbums.filter(
    (album) =>
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artistName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === "plays") return b.playsCount - a.playsCount;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });

  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });

  if (!mounted) return null; // Avoid Server-Client hydration mismatch

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Music Archive</h1>
        <p className="text-zinc-400 text-sm">Explore albums, singles, and artists.</p>
      </header>

      {/* Control Bar: Search and Sort */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-zinc-400 shrink-0">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "plays" | "date")}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500 transition cursor-pointer text-zinc-300 w-full md:w-40"
          >
            <option value="plays">Popularity (Plays)</option>
            <option value="date">Release Date</option>
          </select>
        </div>
      </div>

      {/* Main Grid display */}
      <div className="space-y-12">
        {/* Albums Section */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>Albums</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {sortedAlbums.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onAlbumClick={handleAlbumClick}
                onArtistClick={handleArtistClick}
              />
            ))}
          </div>
        </section>

        {/* Singles Section */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>Singles & Tracks</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {sortedSongs.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedSongs.map((song) => (
              <SingleCard
                key={song.id}
                song={song}
                playlists={playlists}
                onPlay={(sg) => setCurrentSong(sg)}
                onArtistClick={handleArtistClick}
                onAlbumClick={handleAlbumClick}
                onTogglePlaylist={handleTogglePlaylist}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Dedicated View Modal: Album Details */}
      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-green-500 font-bold">Album View</span>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedAlbum.title}</h2>
                <p className="text-zinc-400 text-sm mt-0.5">by {selectedAlbum.artistName}</p>
              </div>
              <button
                onClick={() => setSelectedAlbum(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              <p className="text-xs text-zinc-500">Released: {selectedAlbum.releaseDate}</p>
              <div className="space-y-2 mt-4">
                {selectedAlbum.songs.map((song, idx) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      setCurrentSong(song);
                      setSelectedAlbum(null);
                    }}
                    className="flex justify-between items-center bg-zinc-950 hover:bg-zinc-800 p-3 rounded-lg cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 font-mono text-xs">{idx + 1}</span>
                      <span className="text-sm font-semibold text-zinc-200">{song.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500">{song.duration}</span>
                      <PlaylistSelector
                        song={song}
                        playlists={playlists}
                        onTogglePlaylist={handleTogglePlaylist}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated View Modal: Artist Profile */}
      {selectedArtist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setSelectedArtist(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-500">
                {selectedArtist.name[0]}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-green-500 font-bold">Artist Profile</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedArtist.name}</h2>
                <p className="text-xs text-zinc-400">{selectedArtist.followersCount.toLocaleString()} Followers</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">About</h3>
              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-4 rounded-lg">
                {selectedArtist.bio}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Mini Player */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-6 py-4 flex items-center justify-between z-40 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-zinc-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{currentSong.title}</p>
              <p className="text-xs text-zinc-400">{currentSong.artistName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest animate-pulse">
              Now Playing
            </span>
            <button
              onClick={() => setCurrentSong(null)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full transition"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
