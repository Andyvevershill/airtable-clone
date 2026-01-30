"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import type { Base } from "@/types/base";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";

interface Props {
  base: Base;
}

export function TopNavBaseActions({ base }: Props) {
  const router = useRouter();
  const setIsSaving = useSavingStore((state) => state.setIsSaving);

  const [name, setName] = useState(base.name);
  const [editingName, setEditingName] = useState(base.name);
  const [isOpen, setIsOpen] = useState(false);
  const [isFavourite, setIsFavourite] = useState(base.isFavourite);

  const toggleFavourite = api.base.updateFavouriteById.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
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
      router.push("/dashboard");
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const renameBase = api.base.updateNameById.useMutation({
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

  const handleSave = () => {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== name) {
      setName(trimmed);
      renameBase.mutate({
        baseId: base.id,
        name: trimmed,
      });
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

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
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="border-0 bg-transparent p-0 shadow-none">
            <div className="pointer flex flex-row items-center gap-2 leading-none">
              <div
                className="IC flex h-8 w-8 rounded-md"
                style={{ backgroundColor: base.colour }}
              >
                <p className="text-md flex text-white capitalize">
                  {name.slice(0, 2)}
                </p>
              </div>
              <span className="text-[16px] font-medium">{name}</span>
              <MdKeyboardArrowDown size={18} />
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="z-50 w-100 rounded-sm p-4 text-sm"
          align="start"
          sideOffset={20}
          alignOffset={-10}
        >
          {/* Rename input with star button */}
          <div className="mb-2 flex flex-row items-center gap-2">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Base name"
              className="h-[41px] w-76 rounded-xs border-none bg-transparent p-2 text-[20px] shadow-none transition-colors outline-none placeholder:text-gray-400 hover:bg-gray-100 focus-visible:border focus-visible:border-blue-500 focus-visible:bg-blue-50 focus-visible:ring-1 focus-visible:ring-blue-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Favourite Star Button */}
            <div className="IC flex h-8 flex-1 cursor-pointer">
              <Star
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavourite();
                }}
                size={15}
                className={
                  isFavourite
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-gray-600"
                }
              />
              <HiOutlineDotsHorizontal
                size={14}
                className="ml-4 text-gray-600"
              />
            </div>
          </div>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem
            className="pointer hover:rounded-xs"
            onClick={handleDelete}
          >
            <RiDeleteBinLine className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
