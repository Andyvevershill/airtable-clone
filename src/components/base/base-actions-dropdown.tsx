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
import type { BaseWithTables } from "@/types/base";
import { MenubarTrigger } from "@radix-ui/react-menubar";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { BsThreeDots } from "react-icons/bs";
import { GoPencil } from "react-icons/go";
import { RiDeleteBinLine } from "react-icons/ri";

interface Props {
  base: BaseWithTables;
  favouriteState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export function BaseActionsDropdown({
  base,
  favouriteState,
  setEditMode,
}: Props) {
  const router = useRouter();
  const setIsSaving = useSavingStore((state) => state.setIsSaving);

  const [isFavourite, setIsFavourite] = favouriteState;

  const toggleFavourite = api.base.updateFavouriteById.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      // Rollback optimistic update on error
      setIsFavourite((prev) => !prev);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const deleteBase = api.base.deleteById.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      router.refresh();
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const handleDelete = () => {
    deleteBase.mutate({ id: base.id });
  };

  const handleFavourite = () => {
    const newFavouriteState = !isFavourite;
    setIsFavourite(newFavouriteState);

    toggleFavourite.mutate({
      baseId: base.id,
      favourite: newFavouriteState,
    });
  };

  return (
    <div className="flex flex-row gap-1">
      {/* Favourite Star Button */}
      <div className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
        <Menubar className="h-8 w-8 border-0 bg-transparent p-0">
          <MenubarMenu>
            <MenubarTrigger asChild>
              <div className="IC flex h-8 w-8 cursor-pointer rounded-md transition-transform hover:border-gray-400 hover:bg-gray-100 active:scale-95">
                <Star
                  size={16}
                  className={
                    isFavourite
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-gray-400"
                  }
                  onClick={handleFavourite}
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
            <MenubarTrigger className="pointer IC flex h-8 w-8 rounded-md transition-transform hover:border-gray-400 hover:bg-gray-100 active:scale-95">
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
