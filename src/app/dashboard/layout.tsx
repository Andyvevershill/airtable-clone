import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { DashboardTopNav } from "@/components/navigation/dashboard-top-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden">
        {/* Top nav */}
        <DashboardTopNav user={session.user} />

        {/* Sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
