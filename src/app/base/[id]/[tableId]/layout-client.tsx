"use client";

import { BaseTopNav } from "@/components/base-by-id/navigation/base-top-nav";
import TabContainer from "@/components/tabs/tab-container";
import { api } from "@/trpc/react";

interface Props {
  baseId: string;
  children: React.ReactNode;
}

export function BaseLayoutClient({ baseId, children }: Props) {
  const { data: base } = api.base.getById.useQuery({ id: baseId });

  // No loading state needed because data is prefetched on server
  if (!base) return null;

  return (
    <>
      <BaseTopNav base={base} />
      <TabContainer base={base} />
      <main className="relative flex-1 overflow-hidden">{children}</main>
    </>
  );
}
