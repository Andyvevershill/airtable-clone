"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CreateBaseDialog() {
  const router = useRouter();

  const createBase = api.base.create.useMutation();

  async function handleBaseCreation() {
    try {
      // USING MUTATEASYNC RETURNS THE VAL!
      const res = await createBase.mutateAsync({});

      // Now redirect to the new base
      router.push(`/base/${res.base.id}`);
    } catch (error) {
      console.error("Failed to create base:", error);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="m-3 flex h-8 w-[275px] items-center justify-center rounded bg-[#166ee1] py-2 text-xs font-medium text-white hover:cursor-pointer">
          <Plus size={16} className="mr-2 shrink-0" /> Create
        </button>
      </DialogTrigger>
      <DialogContent className="h-115 w-188">
        <DialogHeader>
          <DialogTitle className="mb-2 text-2xl">
            How do you want to start?
          </DialogTitle>
          <div className="m-0 border-t border-gray-200 p-0" />
        </DialogHeader>
        {/* Remove DialogDescription wrapper, just use a div */}
        <div className="flex-grid flex gap-2 p-4">
          <div className="mt-1.5 hidden items-center justify-center lg:flex">
            <Image
              src="/purple-build-an-app-image.png"
              alt="Login illustration"
              width={340}
              height={220}
              priority
              className="cursor-pointer transition-transform duration-300 ease-out hover:scale-101"
            />
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <Image
              onClick={handleBaseCreation}
              src="/blue-build-an-app-image.png"
              alt="Login illustration"
              width={340}
              height={220}
              priority
              className="cursor-pointer transition-transform duration-300 ease-out hover:scale-101"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
