import {
  DesktopSidebar,
  MobileHeader,
  MobileBottomNav,
} from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary/40">
      <DesktopSidebar />
      <MobileHeader />
      <main className="pb-16 lg:pl-64 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
