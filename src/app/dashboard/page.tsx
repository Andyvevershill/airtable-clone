import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import GoogleSignOutButton from "../_components/buttons/google-sign-out-button";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-black">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-4xl font-bold">Welcome to the Dashboard</h1>
      </div>
      <GoogleSignOutButton />
    </main>
  );
}
