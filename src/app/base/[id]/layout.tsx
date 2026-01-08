import { BaseSidebar } from "@/components/base-by-id/navigation/base-sidebar";
import { BaseTopNav } from "@/components/base-by-id/navigation/base-top-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  // grabbed the session (for log out and account info) and base for the top bar (changing base name, colour, icon)
  const session = await getSession();
  if (!session) redirect("/");

  const base = await api.base.getById({
    id: params.id,
  });

  if (!base) redirect("/");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "56px",
        } as React.CSSProperties
      }
    >
      <BaseSidebar user={session.user} />

      <SidebarInset>
        <div className="flex h-screen flex-col overflow-hidden">
          <BaseTopNav base={base} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
