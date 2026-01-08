"use server";

import { api } from "@/trpc/server";
import { getSession } from "better-auth/api";
import { redirect } from "next/navigation";

export default async function BaseByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = getSession();
  const { id } = await params;

  // we need to create a server action here that fetches the base by ID AND by the user ID from the session!! In real life there will be many users!
  // make sure we turn off the refetch after we initialise this page with the base, server data

  if (!session) {
    redirect("/auth/login");
  }

  const base = await api.base.getById({ id });
  // console.log(JSON.stringify(base));

  return (
    <main className="flex h-full flex-col items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-12">
        <h1 className="text-4xl font-bold">Welcome to base page</h1>
        <p className="text-lg">base ID: {id}</p>
      </div>
    </main>
  );
}
