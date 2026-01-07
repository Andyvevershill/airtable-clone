"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { CiExport, CiSquarePlus, CiStar } from "react-icons/ci";
import { FiBookOpen } from "react-icons/fi";
import { GoHome } from "react-icons/go";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { LuPanelTopOpen } from "react-icons/lu";
import { PiShare } from "react-icons/pi";
import CreateBaseDialog from "./create-base-dialog";

const items = [
  {
    title: "Home",
    icon: GoHome,
  },
  {
    title: "Starred",
    icon: CiStar,
  },
  {
    title: "Shared",
    icon: PiShare,
  },
  {
    title: "Workspaces",
    icon: HiOutlineUserGroup,
  },
];

const footerItems = [
  { title: "Templates and apps", icon: FiBookOpen },
  { title: "Marketplace", icon: LuPanelTopOpen },
  { title: "Import", icon: CiExport },
];

export function DashboardSidebar() {
  const { state, setOpen } = useSidebar();
  const [closeAfterHover, setCloseAfterHover] = useState(false);

  function handleMouseEntry() {
    // see if the initial status is collapsed, as we will want to collapse the side bar when leaving the mouse entry
    setCloseAfterHover(state === "collapsed");
    setOpen(true);
  }

  function handleMouseLeave() {
    setOpen(!closeAfterHover);
  }

  return (
    <Sidebar
      collapsible="icon"
      className="flex w-[300px]"
      onMouseEnter={handleMouseEntry}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarContent className="flex-1 bg-white">
        <div className="h-12" />
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex flex-col items-center justify-center">
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className="items-center justify-center hover:cursor-pointer"
                  >
                    <SidebarMenuButton asChild>
                      <div className="h-[40px] rounded-xs">
                        <item.icon
                          className="shrink-0"
                          style={{ width: "20px", height: "20px" }}
                        />
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        {/*  add a seperator when collapsed */}
        {state === "collapsed" && (
          <div className="flex justify-center px-2">
            <div className="w-3/4 border-t border-gray-300" />
          </div>
        )}
      </SidebarContent>

      {/*  seperator  */}

      <SidebarGroup className="bg-white">
        <div className="mb-4 flex justify-center">
          <div className="w-4/5 border-t border-gray-300" />
        </div>

        <div className="flex flex-col items-center justify-center p-0">
          <SidebarMenu>
            {footerItems.map((item) => (
              <SidebarMenuItem
                key={item.title}
                className="list-none p-0 hover:cursor-pointer"
              >
                <SidebarMenuButton asChild>
                  <a
                    className={`flex items-center rounded-xs ${state === "collapsed" ? "text-gray-400" : ""}`}
                  >
                    <item.icon
                      className="shrink-0"
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span className="text-[13px]">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {/* want to show the create button only when expanded */}
          {state === "collapsed" ? (
            <CiSquarePlus
              className="mt-2"
              style={{ width: "16px", height: "16px" }}
            />
          ) : (
            <CreateBaseDialog />
          )}
        </div>
      </SidebarGroup>
    </Sidebar>
  );
}
