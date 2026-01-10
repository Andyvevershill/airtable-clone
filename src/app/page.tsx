"use server";

import { getSession } from "@/server/better-auth/server";
import { HydrateClient } from "@/trpc/server";
import { redirect } from "next/navigation";
import LogInPage from "./log-in/page";

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <LogInPage />
    </HydrateClient>
  );
}
