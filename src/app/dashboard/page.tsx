import DashboardContainer from "@/components/dashboard/dashboard-container";
import { getSession } from "@/server/better-auth/server";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const bases = await api.base.getAll();
  // console.log(bases);

  return <DashboardContainer bases={bases} />;
}
