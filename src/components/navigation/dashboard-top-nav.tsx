"use client";

import type { User } from "@/types/users";
import { Bell, HelpCircle, Search } from "lucide-react";
import Image from "next/image";
import { AvatarLogOutDropdown } from "../dashboard/avatar-log-out-dropdown";
import { SidebarTrigger } from "../ui/sidebar";

interface props {
  user: User;
}

export function DashboardTopNav({ user }: props) {
  return (
    <div className="shadow-b z-100 flex h-[56px] w-full items-center justify-between border-b border-gray-200 bg-white px-4 shadow-xs">
      {/* Left: sidebar trigger, logo */}
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div className="ml-2 flex flex-row gap-1">
          <Image
            src="/airtable-icon.png"
            alt="Login illustration"
            width={25}
            height={22}
            priority
          />
          <span className="text-lg font-semibold text-gray-900">Airtable</span>
        </div>
      </div>

      {/* search bar */}
      <div className="flex items-center">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-600"
          />
          <input
            type="text"
            placeholder="Search... "
            className="h-8 w-[354px] rounded-full border border-gray-200 pr-3 pl-9 text-sm outline-none hover:cursor-pointer hover:shadow-md focus:border-gray-300 focus:bg-white"
          />
          <p className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-300">
            ⌘ K
          </p>
        </div>
      </div>

      {/* Right: help icon, bell icon, avatar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-row gap-1 rounded-full hover:cursor-pointer hover:bg-gray-200">
          <button className="flex flex-row gap-1 rounded px-3 py-2 hover:cursor-pointer">
            <HelpCircle size={16} />
            <p className="text-xs">Help</p>
          </button>
        </div>

        <button className="mr-2 flex h-7.5 w-7.5 items-center justify-center rounded-full border border-gray-200 hover:cursor-pointer hover:bg-gray-100">
          <Bell size={14} className="text-gray-600" />
        </button>

        <AvatarLogOutDropdown user={user} />
      </div>
    </div>
  );
}
