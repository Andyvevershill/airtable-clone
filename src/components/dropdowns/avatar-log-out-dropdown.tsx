"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
} from "@/components/ui/menubar";
import { signOut } from "@/server/better-auth/client";
import type { User } from "@/types/users";
import { MenubarTrigger } from "@radix-ui/react-menubar";
import { useRouter } from "next/navigation";
import { MdOutlineLogout } from "react-icons/md";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Props {
  user: User;
  align?: "start" | "center" | "end";
}

export function AvatarLogOutDropdown({ user, align = "center" }: Props) {
  const router = useRouter();
  const handleGoogleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Social logout failed", error);
    }
  };

  return (
    <Menubar className="border-0 shadow-none">
      <MenubarMenu>
        <MenubarTrigger>
          <Avatar className="pointer h-6.5 w-6.5">
            {user.image && (
              <AvatarImage
                src={user.image}
                alt={user.name || ""}
                className="object-cover"
              />
            )}

            <AvatarFallback className="bg-red-700 text-[13px] font-medium text-white capitalize">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </MenubarTrigger>
        <MenubarContent
          className="z-1000 mr-3.5 p-5 text-sm md:w-76"
          align={align}
        >
          <div className="height-10 mb-4 ml-2 flex flex-col justify-center gap-2">
            <p>{user.name}</p>
            <p>{user.email}</p>
          </div>
          <MenubarSeparator />
          <MenubarItem
            className="pointer mt-4"
            onClick={() => handleGoogleLogout()}
          >
            <MdOutlineLogout /> Log out
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
