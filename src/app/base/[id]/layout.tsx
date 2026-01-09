import { BaseTopNav } from "@/components/base-by-id/navigation/base-top-nav";
import { BaseSideRail } from "@/components/base/base-side-rail";
import TabContainer from "@/components/tabs/tab-container";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id } = await params;
  const base = await api.base.getById({ id });
  if (!base) redirect("/");

  return (
    <div className="flex h-screen w-full">
      {/* Fixed left sidebar (56px) */}
      <BaseSideRail user={session.user} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <BaseTopNav base={base} />
        <TabContainer base={base} />
        <main className="relative flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
