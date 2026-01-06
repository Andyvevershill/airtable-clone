import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";
import Image from "next/image";
import GoogleSignInButton from "./_components/buttons/google-sign-in-button";

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="mx-20 grid min-h-screen grid-cols-2">
        {/* left grid */}
        <div className="flex flex-1 items-center justify-center gap-10 px-8">
          {/* This block is centered in the column */}
          <div className="flex flex-col items-start gap-10">
            <Image
              src="/log-in-icon.png"
              alt="Login illustration"
              width={60}
              height={60}
              priority
            />

            <h1 className="font-[#1d1f25] text-[32px] font-semibold">
              Sign in to Airtable
            </h1>

            <GoogleSignInButton />
          </div>
        </div>

        {/* right of grid */}
        <div className="flex items-center justify-center">
          <Image
            src="/log-in-image.png"
            alt="Login illustration"
            width="400"
            height="585"
            priority
            className="object-cover transition-transform duration-300 ease-out hover:scale-103 hover:cursor-pointer"
          />
        </div>
      </div>
    </HydrateClient>
  );
}
