"use client";

import { signOut } from "@/server/better-auth/client";
import { useRouter } from "next/navigation";

export default function GoogleSignOutButton() {
  const router = useRouter();
  const handleSocialLogin = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Social logout failed", error);
    }
  };

  return (
    <button
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:cursor-pointer hover:bg-white/20"
      onClick={handleSocialLogin}
    >
      Sign out
    </button>
  );
}
