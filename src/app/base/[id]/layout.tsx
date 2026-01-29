import { BaseSideRail } from "@/components/base/base-side-rail";
import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";
import { redirect } from "next/navigation";
import { BaseLayoutClient } from "./[tableId]/layout-client";

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

  // Prefetch on server for instant load
  await api.base.getById.prefetch({ id });

  return (
    <HydrateClient>
      <div className="flex h-screen w-full">
        {/* Fixed left sidebar (56px) */}
        <BaseSideRail user={session.user} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <BaseLayoutClient baseId={id}>{children}</BaseLayoutClient>
        </div>
      </div>
    </HydrateClient>
  );
}
