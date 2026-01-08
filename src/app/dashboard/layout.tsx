import { DashboardSidebar } from "@/components/dashboard/navigation/dashboard-sidebar";
import { DashboardTopNav } from "@/components/dashboard/navigation/dashboard-top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "300px",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-full flex-col overflow-hidden">
        {/* Top nav - fixed height, on top */}
        <DashboardTopNav user={session.user} />

        {/* Sidebar + main content row */}
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <SidebarInset>
            <main className="h-full overflow-auto">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
