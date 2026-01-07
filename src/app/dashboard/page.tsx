import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="flex h-full flex-col items-center justify-center overflow-hidden bg-gray-50">
      <div className="flex flex-col items-center justify-center gap-12">
        <h1 className="text-4xl font-bold">Welcome to the Dashboard</h1>
        <p className="text-lg">User ID: {session.user.id}</p>
      </div>
    </main>
  );
}
