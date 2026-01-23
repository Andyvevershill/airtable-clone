"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useViewStore } from "@/app/stores/use-view-store";
import { type View } from "@/server/db/schemas";
import { api } from "@/trpc/react";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import type { User } from "better-auth";
import { Star, TableCellsSplit } from "lucide-react";
import { useState } from "react";
import { GrGroup } from "react-icons/gr";
import { PiDotsSixVerticalLight, PiSpinnerThin } from "react-icons/pi";
import { EditViewDropdown } from "../dropdowns/edit-view-dropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import ViewEditMode from "../view/view-edit-mode";

interface Props {
  setHoveredViewId: React.Dispatch<React.SetStateAction<string | null>>;
  setViews: React.Dispatch<React.SetStateAction<View[]>>;
  setEditViewId: React.Dispatch<React.SetStateAction<string | null>>;

  user: User;
  view: View;
  views: View[];
  searchQuery: string;
  isHovered: boolean;
  isEditing: boolean;
}

export default function ViewButton({
  setHoveredViewId,
  setViews,
  setEditViewId,

  user,
  view,
  views,
  isHovered,
  isEditing,
}: Props) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const { setSavingView } = useViewStore();
  const { setIsLoadingView } = useLoadingStore();
  const { savingView, activeViewId } = useViewStore();

  const utils = api.useUtils();

  const toggleFavouriteSidebar = api.view.toggleFavourite.useMutation({
    onMutate: ({ id, isFavourite }) => {
      setViews((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, isFavourite: !isFavourite } : v,
        ),
      );
    },
    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({
        tableId: view.tableId,
      });
    },
    onError: (_err, { id, isFavourite }) => {
      setViews((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isFavourite } : v)),
      );
    },
  });

  const handleActiveChange = api.view.setActive.useMutation({
    onMutate: ({ id }) => {
      // Snapshot previous state for rollback
      const previousViews = views;

      // Set all views to inactive, then set the clicked view to active
      setViews((prev) =>
        prev.map((v) => ({
          ...v,
          isActive: v.id === id,
        })),
      );

      // Return context for rollback
      return { previousViews };
    },
    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({
        tableId: view.tableId,
      });
    },
    onError: (_err, _variables, context) => {
      // Revert to previous state on error
      if (context?.previousViews) {
        setViews(context.previousViews);
      }
    },
  });

  function handleSetActive() {
    if (view.isActive) return;
    setIsLoadingView(true);
    handleActiveChange.mutate({
      id: view.id,
      tableId: view.tableId,
    });
  }

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip open={openDropdownId ? false : undefined}>
        <TooltipTrigger asChild>
          <div
            onClick={(e) => {
              handleSetActive();
            }}
            onMouseEnter={() => setHoveredViewId(view.id)}
            onMouseLeave={() => setHoveredViewId(null)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditViewId(view.id);
            }}
            className={`pointer flex h-[32.25px] w-full items-center gap-2 rounded px-2 text-[13px] ${
              view.isActive ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            <div className="mr-2 w-2">
              {isHovered ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavouriteSidebar.mutate({
                      id: view.id,
                      isFavourite: view.isFavourite,
                    });
                  }}
                  className="flex h-6 w-6 items-center justify-start rounded-md hover:bg-gray-100"
                >
                  <Star
                    size={16}
                    className={
                      view.isFavourite
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-800"
                    }
                  />
                </div>
              ) : (
                <TableCellsSplit size={16} className="text-blue-500" />
              )}
            </div>

            {isEditing ? (
              <ViewEditMode
                view={view}
                setViews={setViews}
                onDone={() => setEditViewId(null)}
              />
            ) : (
              <div className="flex w-full items-center gap-2">
                <span className="w-20 flex-1 truncate text-[13px] font-normal">
                  {view.name}
                </span>

                {savingView && activeViewId === view.id && (
                  <div className="flex shrink-0 flex-row items-center justify-end gap-1 text-gray-400">
                    <PiSpinnerThin size={12} className="animate-spin" />
                    <p className="text-xs">Saving...</p>
                  </div>
                )}

                {(isHovered || openDropdownId === view.id) && (
                  <div className="mr-1 flex shrink-0 flex-row gap-1">
                    <EditViewDropdown
                      deleteDisabled={views.length === 1}
                      view={view}
                      setViews={setViews}
                      onRename={() => setEditViewId(view.id)}
                      onOpenChange={(open) => {
                        setOpenDropdownId(open ? view.id : null);
                      }}
                    />
                    <PiDotsSixVerticalLight
                      size={14}
                      className="hover:cursor-grab"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            side="right"
            className="ml-2 w-62 rounded-[3px] px-1.5"
          >
            <div className="flex flex-col">
              <h1 className="mb-2 text-sm text-white">{view.name}</h1>
              <p className="text-gray-300">Created by</p>
              <div className="mb-2 flex flex-row items-center justify-start gap-1">
                {user.name && (
                  <p className="text text-[13px] text-white">{user.name}</p>
                )}
                {user.email && (
                  <p className="text-[13px] text-gray-300">{user.email}</p>
                )}
              </div>
              <p className="text-gray-300">editing</p>

              <span className="flex flex-row items-start gap-1">
                <GrGroup className="mt-[2px] shrink-0" size={14} />
                <span className="text-[13px]">
                  everyone can edit the view
                  <br /> configuration
                </span>
              </span>
            </div>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}
