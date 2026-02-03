"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useSavingStore } from "@/app/stores/use-saving-store";
import { useViewStore } from "@/app/stores/use-view-store";
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
  const { setActiveView } = useViewStore();

  const utils = api.useUtils();

  const toggleFavourite = api.view.toggleFavourite.useMutation({
    onMutate: async ({ id, isFavourite }) => {
      setIsSaving(true);

      await utils.table.getTableWithViews.cancel({ tableId: view.tableId });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: view.tableId,
      });

      utils.table.getTableWithViews.setData(
        { tableId: view.tableId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            views: old.views.map((v) =>
              v.id === id ? { ...v, isFavourite: !isFavourite } : v,
            ),
          };
        },
      );

      setViews((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, isFavourite: !isFavourite } : v,
        ),
      );

      return { previousData };
    },
    onSettled: () => setIsSaving(false),
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId: view.tableId },
          context.previousData,
        );
        setViews(context.previousData.views);
      }
      setIsSaving(false);
    },
  });

  const deleteView = api.view.deleteById.useMutation({
    onMutate: async () => {
      setIsLoadingView(true);

      await utils.table.getTableWithViews.cancel({ tableId: view.tableId });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: view.tableId,
      });

      let newActiveView: View | null = null;

      // Update cache
      utils.table.getTableWithViews.setData(
        { tableId: view.tableId },
        (old) => {
          if (!old) return old;

          const filteredViews = old.views.filter((v) => v.id !== view.id);

          // If deleted view was active, make first remaining view active
          if (view.isActive && filteredViews.length > 0) {
            const firstView = filteredViews[0];
            if (firstView) {
              newActiveView = {
                id: firstView.id,
                name: firstView.name,
                createdAt: firstView.createdAt,
                isFavourite: firstView.isFavourite,
                tableId: firstView.tableId,
                isActive: true,
                filters: firstView.filters,
                sorting: firstView.sorting,
                hidden: firstView.hidden,
              };
            }

            return {
              ...old,
              views: filteredViews.map((v, index) => ({
                ...v,
                isActive: index === 0,
              })),
            };
          }

          return {
            ...old,
            views: filteredViews,
          };
        },
      );

      // Update local state
      setViews((prev) => {
        const filtered = prev.filter((v) => v.id !== view.id);

        if (view.isActive && filtered.length > 0) {
          return filtered.map((v, index) => ({
            ...v,
            isActive: index === 0,
          }));
        }

        return filtered;
      });

      // Set new active view in store
      if (newActiveView) {
        setActiveView(newActiveView);
      }

      return { previousData };
    },
    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({ tableId: view.tableId });
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId: view.tableId },
          context.previousData,
        );
        setViews(context.previousData.views);
      }
    },
  });

  const duplicate = api.view.duplicateView.useMutation({
    onMutate: async ({ newId, name }) => {
      setIsSaving(true);

      await utils.table.getTableWithViews.cancel({ tableId: view.tableId });

      const previousData = utils.table.getTableWithViews.getData({
        tableId: view.tableId,
      });

      const duplicatedView: View = {
        ...view,
        id: newId,
        name,
        isFavourite: false,
        isActive: false,
      };

      utils.table.getTableWithViews.setData(
        { tableId: view.tableId },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            views: [...old.views, duplicatedView],
          };
        },
      );

      setViews((prev) => [...prev, duplicatedView]);

      return { previousData };
    },
    onSettled: () => setIsSaving(false),
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId: view.tableId },
          context.previousData,
        );
        setViews(context.previousData.views);
      }
    },
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
              e.preventDefault();
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
