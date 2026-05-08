import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationProvider } from "@/components/layout/NotificationProvider";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <NotificationProvider />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
