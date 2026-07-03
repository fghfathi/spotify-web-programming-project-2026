import ContentSection from "@/components/home/ContentSection";
import ContentCard from "@/components/home/ContentCard";
import { ArtistRelease } from "@/types/artist";

interface ArtistReleasesSectionProps {
  releases: ArtistRelease[];
}

// Combined albums + singles list for one artist. Reuses the same
// card/section primitives as the Home page for visual consistency.
export default function ArtistReleasesSection({
  releases,
}: ArtistReleasesSectionProps) {
  return (
    <ContentSection
      title="Albums & Singles"
      emptyMessage="This artist hasn't released anything yet."
    >
      {releases.map((release) => (
        <ContentCard
          key={release.id}
          title={release.title}
          subtitle={release.type === "album" ? "Album" : "Single"}
          coverImageUrl={release.coverImageUrl}
        />
      ))}
    </ContentSection>
  );
}