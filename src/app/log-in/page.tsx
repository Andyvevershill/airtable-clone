"use server";

import GoogleSignInButton from "@/components/buttons/google-sign-in-button";
import { getSession } from "@/server/better-auth/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FaApple } from "react-icons/fa6";

export default async function LogInPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-21 grid min-h-screen lg:grid-cols-2">
      {/* left grid */}
      <div className="IC mt-5 flex px-8">
        <div className="flex flex-col gap-2 lg:items-start">
          <Image
            src="/airtable-icon.png"
            alt="Login illustration"
            width={38}
            height={38}
            priority
          />

          <h1 className="my-10 font-sans text-3xl font-medium text-[#1d1f25]">
            Sign in to Airtable
          </h1>

          <p className="text-[15px]">Email</p>

          <div className="mb-3 flex h-10 w-full cursor-text items-center justify-start rounded-sm border border-gray-200 text-gray-500">
            <p className="ml-2.5 text-[15px]">Email address</p>
          </div>

          <button className="pointer IC flex h-10 flex-row rounded-sm border border-gray-200 bg-[#8AAEF0] px-10 font-normal text-white shadow-xs transition hover:shadow-sm md:w-125">
            Continue
          </button>

          <div className="relative my-4 flex w-full items-center md:w-125">
            <div className="flex-1"></div>
            <span className="px-4 text-[16px] text-gray-700">or</span>
            <div className="flex-1"></div>
          </div>

          <button className="pointer IC mb-2 flex h-10 flex-row rounded-sm border border-gray-200 bg-white px-10 text-[15px] text-black shadow-xs transition hover:shadow-sm md:w-125">
            Sign in with
            <span className="pl-1 font-[550]">Single sign on</span>
          </button>
          <GoogleSignInButton />
          <button className="pointer IC flex h-10 flex-row rounded-sm border border-gray-200 bg-white px-10 text-[15px] text-black shadow-xs transition hover:shadow-sm md:w-125">
            <FaApple className="h-5 w-5 pr-2 font-sans" />
            Continue with <span className="pl-1 font-[550]">Apple ID</span>
          </button>

          <p className="mt-18 flex flex-row justify-end text-[13px] text-gray-600">
            New to Airtable?
            <a
              href="https://airtable.com/signup"
              className="pointer mx-1 text-blue-600 underline hover:no-underline"
            >
              Create an account
            </a>
            instead
          </p>
        </div>
      </div>

      {/* right grid */}
      <div className="IC mt-12 hidden lg:flex">
        <Image
          src="/log-in-image.png"
          alt="Login illustration"
          width={400}
          height={585}
          priority
          className="cursor-pointer transition-transform duration-300 ease-out hover:scale-103"
        />
      </div>
    </div>
  );
}
