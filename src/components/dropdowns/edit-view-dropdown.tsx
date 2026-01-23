"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useSavingStore } from "@/app/stores/use-saving-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { View } from "@/server/db/schemas";
import { api } from "@/trpc/react";
import { Star } from "lucide-react";
import { GoPencil } from "react-icons/go";
import { HiOutlineDotsHorizontal, HiOutlineDuplicate } from "react-icons/hi";
import { RiDeleteBinLine } from "react-icons/ri";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface Props {
  view: View;
  deleteDisabled: boolean;
  setViews: React.Dispatch<React.SetStateAction<View[]>>;
  onRename: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function EditViewDropdown({
  view,
  deleteDisabled,
  setViews,
  onRename,
  onOpenChange,
}: Props) {
  const setIsSaving = useSavingStore((s) => s.setIsSaving);
  const { setIsLoadingView } = useLoadingStore();

  const utils = api.useUtils();

  const toggleFavourite = api.view.toggleFavourite.useMutation({
    onMutate: () => {
      setIsSaving(true);
      setViews((prev) =>
        prev.map((v) =>
          v.id === view.id ? { ...v, isFavourite: !v.isFavourite } : v,
        ),
      );
    },
    onSettled: () => setIsSaving(false),
  });

  const deleteView = api.view.deleteById.useMutation({
    onMutate: () => {
      setIsLoadingView(true);

      setViews((prev) => {
        const remaining = prev.filter((v) => v.id !== view.id);

        // If the deleted view was active, activate the first remaining one
        if (view.isActive && remaining.length > 0) {
          return remaining.map((v, index) => ({
            ...v,
            isActive: index === 0,
          }));
        }

        return remaining;
      });
    },

    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({ tableId: view.tableId });
    },
  });

  const duplicate = api.view.duplicateView.useMutation({
    onMutate: ({ newId, name }) => {
      setIsSaving(true);
      setViews((prev) => [
        ...prev,
        {
          ...view,
          id: newId,
          name,
          isFavourite: false,
          isActive: false,
        },
      ]);
    },
    onSettled: () => setIsSaving(false),
  });

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger className="pointer">
        <HiOutlineDotsHorizontal className="h-4 w-4 text-gray-500" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex w-72 flex-col gap-1 p-2.5 text-[13px]"
        align="start"
      >
        <DropdownMenuItem
          className="pointer flex gap-2"
          onClick={() =>
            toggleFavourite.mutate({
              id: view.id,
              isFavourite: view.isFavourite,
            })
          }
        >
          <Star
            className={
              view.isFavourite
                ? "mr-1 h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
                : "mr-1 h-3.5 w-3.5"
            }
          />
          {view.isFavourite ? "Remove from" : "Add to"} favourites
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="pointer" onClick={onRename}>
          <GoPencil className="mr-1 h-3.5 w-3.5" />
          Rename view
        </DropdownMenuItem>

        <DropdownMenuItem
          className="pointer"
          onClick={() =>
            duplicate.mutate({
              id: view.id,
              newId: crypto.randomUUID(),
              name: `${view.name} copy`,
            })
          }
        >
          <HiOutlineDuplicate className="mr-1 h-3.5 w-3.5" />
          Duplicate view
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className={cn(deleteDisabled && "opacity-50 hover:bg-none")}
          onSelect={(e) => {
            if (deleteDisabled) {
              e.preventDefault(); // Prevent the dropdown from closing
            }
          }}
        >
          {deleteDisabled ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex w-full gap-2 text-[#B10F41]">
                    <RiDeleteBinLine className="h-3.5 w-3.5" />
                    Delete view
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  You can&apos;t delete a view when it&apos;s the only grid view
                  left in the table
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              onClick={() => deleteView.mutate({ id: view.id })}
              className="pointer flex w-full gap-2 text-[#B10F41]"
            >
              <RiDeleteBinLine className="h-3.5 w-3.5" />
              Delete view
            </button>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
