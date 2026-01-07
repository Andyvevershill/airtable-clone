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

  // we need the button to shrink to fit the content if small screen

  return (
    <button
      className="flex h-10 flex-row items-center justify-center rounded-sm border border-gray-200 bg-white px-10 py-2 text-black shadow-xs transition hover:cursor-pointer hover:shadow-sm md:w-125"
      onClick={handleSocialLogin}
    >
      <FcGoogle className="h-7 w-7 pr-2 font-sans" />
      Continue with <span className="pl-1 font-semibold">Google</span>
    </button>
  );
}
