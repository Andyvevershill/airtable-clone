"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useSavingStore } from "@/app/stores/use-saving-store";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { User } from "@/types/users";
import { Bell, HelpCircle, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LuLoaderPinwheel } from "react-icons/lu";
import { AvatarLogOutDropdown } from "../../dropdowns/avatar-log-out-dropdown";

interface props {
  user: User;
}

export function DashboardTopNav({ user }: props) {
  const router = useRouter();

  const isSaving = useSavingStore((state) => state.isSaving);
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <div className="shadow-b relative z-100 flex h-[56px] w-full items-center justify-between border-b border-gray-200 bg-white px-3 shadow-xs">
      {/* Left: sidebar trigger, logo */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="pointer" />
        <div className="ml-2 flex flex-row gap-1">
          <Image
            src="/airtable-icon.png"
            alt="Login illustration"
            width={25}
            height={22}
            priority
          />
          <span
            className="pointer text-lg font-semibold text-gray-900"
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Airtable
          </span>
        </div>
        {isSaving && (
          <div className="flex flex-row gap-2 text-gray-500">
            <LuLoaderPinwheel size={16} className="animate-spin" />
            <p className="text-xs">Saving...</p>
          </div>
        )}
        {isLoading && (
          <div className="flex flex-row gap-2 text-gray-500">
            <LuLoaderPinwheel size={16} className="animate-spin" />
            <p className="text-xs">Loading...</p>
          </div>
        )}
      </div>

      {/* search bar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search... "
            className="pointer h-8.5 w-[360px] rounded-full border border-gray-200 pr-5 pl-10 text-sm text-[13px] shadow-xs outline-none hover:shadow-md focus:border-gray-300 focus:bg-white"
          />
          <p className="absolute top-1/2 right-3 mr-2 -translate-y-1/2 text-[13px] text-gray-400">
            ⌘ K
          </p>
        </div>
      </div>

      {/* Right: help icon, bell icon, avatar */}
      <div className="flex items-center gap-3">
        <div className="pointer flex flex-row gap-1 rounded-full hover:bg-gray-200">
          <button className="pointer flex flex-row gap-1 rounded px-3 py-2">
            <HelpCircle size={16} />
            <p className="text-xs">Help</p>
          </button>
        </div>

        <button className="pointer IC mr-1.5 flex h-7.5 w-7.5 rounded-full border border-gray-200 hover:bg-gray-100">
          <Bell size={14} className="text-gray-600" />
        </button>

        <AvatarLogOutDropdown user={user} />
      </div>
    </div>
  );
}
