import TopBar from "@/components/home/TopBar";
import Sidebar from "@/components/home/Sidebar";
import ContentSection from "@/components/home/ContentSection";
import ContentCard from "@/components/home/ContentCard";
import EarlyAccessSection from "@/components/home/EarlyAccessSection";
import {
  mockUser,
  mockRecentPlaylists,
  mockRecentAlbums,
  mockPopularSongs,
  mockEarlyAccess,
  sidebarNavItems,
} from "@/data/mockHomeData";

// Phase 1: all data is mocked. Replace the imports above with API calls
// (e.g. fetch from Django REST endpoints) once the backend phase begins —
// the component tree below does not need to change.
export default function HomePage() {
  const isGoldMember = mockUser.subscription === "gold";

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <TopBar user={mockUser} />

        <main className="flex-1 px-4 py-6 md:px-8">
          <ContentSection
            title="Recently Listened Playlists"
            emptyMessage="You haven't listened to any playlists yet. Start exploring to see them here."
          >
            {mockRecentPlaylists.map((playlist) => (
              <ContentCard
                key={playlist.id}
                title={playlist.title}
                subtitle={`${playlist.trackCount} tracks`}
                coverImageUrl={playlist.coverImageUrl}
              />
            ))}
          </ContentSection>

          <ContentSection
            title="Recently Released Albums"
            emptyMessage="No new albums to show right now."
          >
            {mockRecentAlbums.map((album) => (
              <ContentCard
                key={album.id}
                title={album.title}
                subtitle={album.artistName}
                coverImageUrl={album.coverImageUrl}
              />
            ))}
          </ContentSection>

          <ContentSection
            title="Popular Songs"
            emptyMessage="Nothing trending yet. Check back soon."
          >
            {mockPopularSongs.map((song) => (
              <ContentCard
                key={song.id}
                title={song.title}
                subtitle={song.artistName}
                coverImageUrl={song.coverImageUrl}
              />
            ))}
          </ContentSection>

          {/* Gold-exclusive content is rendered only for Gold subscribers */}
          {isGoldMember && <EarlyAccessSection items={mockEarlyAccess} />}
        </main>
      </div>
    </div>
  );
}