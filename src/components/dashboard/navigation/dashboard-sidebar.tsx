"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { api } from "@/trpc/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { CiExport, CiSquarePlus, CiStar } from "react-icons/ci";
import { FiBookOpen } from "react-icons/fi";
import { GoHome } from "react-icons/go";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { LuPanelTopOpen } from "react-icons/lu";
import { PiShare } from "react-icons/pi";
import CreateBaseDialog from "../../base/create-base-dialog";
import NoFavBaseButton from "./no-favourite-bases";
import BaseNavBarButton from "./side-nav-base-button";

const footerItems = [
  { title: "Templates and apps", icon: FiBookOpen },
  { title: "Marketplace", icon: LuPanelTopOpen },
  { title: "Import", icon: CiExport },
];

export function DashboardSidebar() {
  const { state, setOpen } = useSidebar();
  const [closeAfterHover, setCloseAfterHover] = useState(false);

  // Fetch data on the client side
  const { data: favouriteBases = [], isLoading } =
    api.base.getAllFavourites.useQuery();

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
      className="border border-gray-200"
      onMouseEnter={handleMouseEntry}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarContent className="flex-1 bg-white px-1 pl-1">
        <div className="h-12" />
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="IC flex flex-col">
              <SidebarMenu>
                <SidebarMenuItem className="pointer IC">
                  <SidebarMenuButton asChild>
                    <div className="h-[40px] rounded-xs bg-gray-100">
                      <GoHome
                        className="shrink-0"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span className="text-[15px] font-medium">Home</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger>
                    <div className="pointer flex h-[40px] w-[274px] flex-row items-center justify-between gap-2 rounded-xs px-2 hover:bg-gray-100">
                      <div className="flex flex-row items-center gap-2">
                        <CiStar
                          className="shrink-0"
                          style={{ width: "20px", height: "20px" }}
                        />
                        <span className="ml-[1px] text-[15px] font-medium">
                          Starred
                        </span>
                      </div>
                      <div className="flex h-[24px] w-[24px] items-center justify-center rounded-sm hover:bg-gray-200">
                        <ChevronDown
                          style={{ width: "16px", height: "16px" }}
                          className="mr-1 ml-auto text-gray-500 transition-transform group-data-[state=open]/collapsible:rotate-180"
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent className="mt-0">
                      {isLoading ? (
                        <div className="position-center flex items-center gap-2 p-2 text-[12px] text-gray-500">
                          <CgSpinner className="animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : favouriteBases.length === 0 ? (
                        <NoFavBaseButton />
                      ) : (
                        favouriteBases.map((favouriteBases) => (
                          <div key={favouriteBases.id}>
                            <BaseNavBarButton base={favouriteBases} />
                          </div>
                        ))
                      )}
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>

                <SidebarMenuItem className="pointer IC">
                  <SidebarMenuButton asChild>
                    <div className="h-[40px] rounded-xs">
                      <PiShare
                        className="shrink-0"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span className="text-[15px] font-medium">Shared</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem className="pointer IC">
                  <SidebarMenuButton asChild>
                    <div className="h-[40px] rounded-xs">
                      <HiOutlineUserGroup
                        className="shrink-0"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span className="text-[15px] font-medium">
                        Workspaces
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        {/*  add a seperator when collapsed */}
        {state === "collapsed" && (
          <div className="flex items-center justify-center">
            <div className="w-3/4 border-t border-gray-300" />
          </div>
        )}
      </SidebarContent>

      {/*  seperator  */}

      <SidebarGroup className="bg-white">
        <div className="mb-4 flex justify-center">
          <div className="w-4/5 border-t border-gray-300" />
        </div>

        <div className="IC flex flex-col p-0">
          <SidebarMenu>
            {footerItems.map((item) => (
              <SidebarMenuItem
                key={item.title}
                className="pointer list-none p-0"
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
