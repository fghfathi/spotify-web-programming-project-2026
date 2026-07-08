"use client";

type DashboardTab = "overview" | "tracks" | "upload";

interface ArtistDashboardTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Analytics" },
  { id: "tracks", label: "My Tracks" },
  { id: "upload", label: "Upload" },
];

export default function ArtistDashboardTabs({ activeTab, onChange }: ArtistDashboardTabsProps) {
  return (
    <div className="mb-6 flex w-full max-w-md gap-1 rounded-xl bg-zinc-900 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            activeTab === tab.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}