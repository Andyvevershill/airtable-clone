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
import { cn, showNotFunctionalToast } from "@/lib/utils";
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
import CreateBaseDialog from "../../dialogs/create-base-dialog";
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

  const { data: favouriteBases = [], isLoading } =
    api.base.getAllFavourites.useQuery();

  function handleMouseEntry() {
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
                {/* Home */}
                <SidebarMenuItem className="pointer">
                  <SidebarMenuButton asChild>
                    <a
                      className={cn(
                        "flex h-[40px] items-center rounded-xs",
                        state === "collapsed"
                          ? "justify-center"
                          : "justify-start bg-gray-100",
                      )}
                    >
                      <GoHome
                        className="shrink-0"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span className="text-[15px] font-medium">Home</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Starred */}
                <Collapsible
                  defaultOpen
                  open={state === "collapsed" ? false : undefined}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuItem className="pointer">
                      <SidebarMenuButton asChild>
                        <a
                          className={cn(
                            "flex h-[40px] items-center rounded-xs",
                            state === "collapsed"
                              ? "justify-center"
                              : "justify-start",
                          )}
                        >
                          <CiStar
                            className="shrink-0"
                            style={{ width: "20px", height: "20px" }}
                          />
                          <span className="text-[15px] font-medium">
                            Starred
                          </span>
                          {state !== "collapsed" && (
                            <ChevronDown
                              style={{ width: "16px", height: "16px" }}
                              className="ml-auto text-gray-500 transition-transform group-data-[state=open]/collapsible:rotate-180"
                            />
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
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
                        favouriteBases.map((base) => (
                          <div key={base.id}>
                            <BaseNavBarButton base={base} />
                          </div>
                        ))
                      )}
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>

                {/* Shared */}
                <SidebarMenuItem className="pointer">
                  <SidebarMenuButton asChild onClick={showNotFunctionalToast}>
                    <a
                      className={cn(
                        "flex h-[40px] items-center rounded-xs",
                        state === "collapsed"
                          ? "justify-center"
                          : "justify-start",
                      )}
                    >
                      <PiShare
                        className="shrink-0"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span className="text-[15px] font-medium">Shared</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Workspaces */}
                <SidebarMenuItem className="pointer">
                  <SidebarMenuButton asChild onClick={showNotFunctionalToast}>
                    <a
                      className={cn(
                        "flex h-[40px] items-center rounded-xs",
                        state === "collapsed"
                          ? "translate-x-[2px] justify-center"
                          : "justify-start",
                      )}
                    >
                      <HiOutlineUserGroup
                        className="shrink-0"
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span className="text-[15px] font-medium">
                        Workspaces
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* separator when collapsed */}
        {state === "collapsed" && (
          <div className="flex items-center justify-center">
            <div className="w-3/4 border-t border-gray-300" />
          </div>
        )}
      </SidebarContent>

      {/* Footer */}
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
                <SidebarMenuButton asChild onClick={showNotFunctionalToast}>
                  <a
                    className={`flex items-center rounded-xs ${
                      state === "collapsed" ? "text-gray-400" : ""
                    }`}
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
