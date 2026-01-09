"use client";

import { AvatarLogOutDropdown } from "@/components/dashboard/avatar-log-out-dropdown";
import { api } from "@/trpc/react";
import type { User } from "@/types/users";
import { ArrowLeft, Bell, Ellipsis, HelpCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  user: User;
}

const bottomItems = [
  { id: "help", icon: HelpCircle },
  { id: "notifications", icon: Bell },
];

export function BaseSideRail({ user }: Props) {
  const router = useRouter();
  const utils = api.useUtils();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  function handleRedirectMouseEnter() {
    utils.base.getAll.prefetch();
    setHoveredItem("home");
  }

  function handleRedirect() {
    router.push("/dashboard");
  }

  return (
    <div className="flex h-screen w-14 flex-col justify-between border-r border-gray-200 bg-white">
      {/* Top section */}
      <div className="pt-2">
        <ul className="flex flex-col items-center gap-1">
          <li>
            <button
              className="pointer pointer flex h-9 w-9 items-center justify-center hover:bg-transparent"
              onMouseEnter={handleRedirectMouseEnter}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={handleRedirect}
            >
              {hoveredItem === "home" ? (
                <ArrowLeft className="h-3 w-3" />
              ) : (
                <Image
                  src="/airtable-black-icon.png"
                  alt="Airtable logo"
                  width={30}
                  height={30}
                  className="h-9 w-10"
                />
              )}
            </button>
          </li>

          <li>
            <button
              className="pointer flex h-11 w-11 items-center justify-center"
              onMouseEnter={() => setHoveredItem("ellipsis")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {hoveredItem === "ellipsis" ? (
                <Ellipsis className="h-3 w-3" />
              ) : (
                <Image
                  src="/omni-icon.png"
                  alt="Omni icon"
                  width={30}
                  height={30}
                  className="h-10 w-12"
                />
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Bottom section */}
      <div className="pb-4">
        <ul className="flex flex-col items-center gap-1">
          {bottomItems.map((item) => (
            <li key={item.id}>
              <button className="pointer flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <item.icon className="w-3.4 h-3.5" />
              </button>
            </li>
          ))}

          <li>
            <AvatarLogOutDropdown user={user} align="start" />
          </li>
        </ul>
      </div>
    </div>
  );
}
