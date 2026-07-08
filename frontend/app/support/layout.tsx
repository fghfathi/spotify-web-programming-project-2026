import Sidebar from "@/components/home/Sidebar";
import TopBar from "@/components/home/TopBar";
import { mockCurrentStaffUser } from "@/data/mockSupportData";
import { SupportDataProvider } from "@/context/SupportDataContext";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <TopBar user={mockCurrentStaffUser} />
        <main className="flex-1 px-4 py-6 md:px-8">
          <SupportDataProvider>{children}</SupportDataProvider>
        </main>
      </div>
    </div>
  );
}