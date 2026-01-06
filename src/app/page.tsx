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
      <div className="mx-20 grid min-h-screen lg:grid-cols-2">
        {/* left grid */}
        <div className="flex items-center justify-center px-8">
          <div className="-mt-96 flex flex-col gap-12 lg:items-start">
            <Image
              src="/airtable-icon.png"
              alt="Login illustration"
              width={38}
              height={38}
              priority
            />

            <h1 className="mb-4 font-sans text-3xl font-medium text-[#1d1f25]">
              Sign in to Airtable
            </h1>

            <GoogleSignInButton />
          </div>
        </div>

        {/* right grid */}
        <div className="mt-12 hidden items-center justify-center lg:flex">
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
    </HydrateClient>
  );
}
