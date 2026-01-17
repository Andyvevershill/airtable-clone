"use client";

import { signIn } from "@/server/better-auth/client";
import { FcGoogle } from "react-icons/fc";

export default function GoogleSignInButton() {
  const handleSocialLogin = async () => {
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch (error) {
      console.error("Social login failed", error);
    }
  };

  return (
    <button
      className="pointer IC mb-2 flex h-10 flex-row rounded-sm border border-gray-200 bg-white px-10 text-[15px] text-black shadow-xs transition hover:shadow-sm md:w-125"
      onClick={handleSocialLogin}
    >
      <FcGoogle className="h-7 w-7 pr-2 font-sans" />
      Continue with <span className="pl-1 font-[550]">Google</span>
    </button>
  );
}
