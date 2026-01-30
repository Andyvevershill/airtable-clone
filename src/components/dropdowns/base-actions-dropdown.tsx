"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
} from "@/components/ui/menubar";
import { api } from "@/trpc/react";
import type { typeBaseWithTableIds } from "@/types/base";
import { MenubarTrigger } from "@radix-ui/react-menubar";
import { Star } from "lucide-react";
import { BsThreeDots } from "react-icons/bs";
import { GoPencil } from "react-icons/go";
import { RiDeleteBinLine } from "react-icons/ri";

interface Props {
  base: typeBaseWithTableIds;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export function BaseActionsDropdown({ base, setEditMode }: Props) {
  const utils = api.useUtils();
  const setIsSaving = useSavingStore((state) => state.setIsSaving);

  const toggleFavourite = api.base.updateFavouriteById.useMutation({
    onMutate: async ({ baseId, favourite }) => {
      setIsSaving(true);

      // Cancel
      await utils.base.getAll.cancel();

      // Snapshot
      const previousBases = utils.base.getAll.getData();

      // Optimistically update
      utils.base.getAll.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((b) =>
          b.id === baseId ? { ...b, isFavourite: favourite } : b,
        );
      });

      return { previousBases };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousBases) {
        utils.base.getAll.setData(undefined, context.previousBases);
      }
    },
    onSuccess: () => {
      // Refetch
      void utils.base.getAll.invalidate();
      void utils.base.getAllFavourites.invalidate();
      setIsSaving(false);
    },
  });

  const deleteBase = api.base.deleteById.useMutation({
    onMutate: async ({ id }) => {
      setIsSaving(true);

      // Cancel
      await utils.base.getAll.cancel();

      // Snapshot
      const previousBases = utils.base.getAll.getData();

      // Optimistically remove
      utils.base.getAll.setData(undefined, (old) => {
        if (!old) return old;
        return old.filter((b) => b.id !== id);
      });

      return { previousBases };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBases) {
        utils.base.getAll.setData(undefined, context.previousBases);
      }
    },
    onSettled: () => {
      void utils.base.getAll.invalidate();
      void utils.base.getAllFavourites.invalidate();
      setIsSaving(false);
    },
  });

  const handleDelete = () => {
    deleteBase.mutate({ id: base.id });
  };

  const handleFavourite = () => {
    toggleFavourite.mutate({
      baseId: base.id,
      favourite: !base.isFavourite,
    });
  };

  return (
    <div className="flex flex-row gap-1">
      {/* Favourite Star Button */}
      <div className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
        <Menubar className="h-8 w-8 border-0 bg-transparent p-0">
          <MenubarMenu>
            <MenubarTrigger asChild>
              <div
                onClick={handleFavourite}
                className="IC flex h-8 w-8 cursor-pointer rounded-md border border-gray-200 hover:shadow-sm"
              >
                <Star
                  size={16}
                  className={
                    base.isFavourite // Use prop directly
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-gray-400"
                  }
                />
              </div>
            </MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Three Dots Menu */}
      <div className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
        <Menubar className="h-8 w-8 border-0 bg-transparent p-0">
          <MenubarMenu>
            <MenubarTrigger className="IC flex h-8 w-8 cursor-pointer rounded-md border border-gray-200 hover:shadow-sm">
              <BsThreeDots size={16} />
            </MenubarTrigger>
            <MenubarContent
              className="rounded-xs p-4 text-sm md:w-50"
              align="center"
            >
              <MenubarItem
                className="pointer hover:rounded-xs"
                onSelect={() => setEditMode(true)}
              >
                <GoPencil className="mr-2" /> Rename
              </MenubarItem>
              <MenubarSeparator className="my-2" />
              <MenubarItem
                className="pointer hover:rounded-xs"
                onSelect={handleDelete}
              >
                <RiDeleteBinLine className="mr-2" /> Delete
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  );
}
