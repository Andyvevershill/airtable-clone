"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import type { View } from "@/server/db/schemas";
import { api } from "@/trpc/react";
import { Star, TableCellsSplit } from "lucide-react";
import { useState } from "react";
import { PiDotsSixVerticalLight } from "react-icons/pi";
import { EditViewDropdown } from "../dropdowns/edit-view-dropdown";
import ViewEditMode from "../view/view-edit-mode";
interface Props {
  setHoveredViewId: React.Dispatch<React.SetStateAction<string | null>>;
  setViews: React.Dispatch<React.SetStateAction<View[]>>;
  setEditViewId: React.Dispatch<React.SetStateAction<string | null>>;

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

  view,
  views,
  isHovered,
  isEditing,
}: Props) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  const utils = api.useUtils();

  const toggleFavouriteSidebar = api.view.toggleFavourite.useMutation({
    onMutate: ({ id, isFavourite }) => {
      setIsSaving(true);
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
    onSettled: () => setIsSaving(false),
  });

  const handleActiveChange = api.view.setActive.useMutation({
    onMutate: ({ id }) => {
      setIsSaving(true);

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
    onSettled: () => setIsSaving(false),
  });
  function handleSetActive() {
    if (view.isActive) return;
    handleActiveChange.mutate({
      id: view.id,
      tableId: view.tableId,
    });
  }

  return (
    <div
      onClick={handleSetActive}
      onMouseEnter={() => setHoveredViewId(view.id)}
      onMouseLeave={() => setHoveredViewId(null)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditViewId(view.id);
      }}
      className={`pointer flex h-9 w-full items-center gap-2 rounded px-2 text-[13px] ${
        view.isActive ? "bg-gray-100" : ""
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

          {(isHovered || openDropdownId === view.id) && (
            <div className="mr-1 flex shrink-0 flex-row gap-1">
              <EditViewDropdown
                deleteDisabled={views.length === 1}
                view={view}
                setViews={setViews}
                onRename={() => setEditViewId(view.id)}
                onOpenChange={(open) =>
                  setOpenDropdownId(open ? view.id : null)
                }
              />
              <PiDotsSixVerticalLight size={14} className="hover:cursor-grab" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
