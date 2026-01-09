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
import type { Base } from "@/types/base";
import { MenubarTrigger } from "@radix-ui/react-menubar";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import { Input } from "../ui/input";

interface Props {
  base: Base;
}

export function TopNavBaseActions({ base }: Props) {
  const router = useRouter();
  const setIsSaving = useSavingStore((state) => state.setIsSaving);
  const [name, setName] = useState(base.name);
  const [editingName, setEditingName] = useState(name);
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
      router.refresh();
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
    if (editingName.trim() && editingName !== name) {
      setName(editingName.trim());
      renameBase.mutate({
        baseId: base.id,
        name: editingName.trim(),
      });
    }
    setIsOpen(false);
  };

  const handleRenameSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleDelete = () => {
    if (confirm(`Delete "${base.name}"?`)) {
      deleteBase.mutate({ id: base.id });
    }
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
      <Menubar className="border-0 bg-transparent p-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger
            className="border-0 bg-transparent p-0 shadow-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="pointer flex flex-row items-center gap-2 leading-none">
              <div
                className="IC flex h-8 w-8 rounded-md"
                style={{ backgroundColor: base.colour }}
              >
                <p className="text-md flex text-white capitalize">
                  {base.name.slice(0, 2)}
                </p>
              </div>
              <span className="text-[16px] font-medium">{name}</span>
              <MdKeyboardArrowDown size={18} />
            </div>
          </MenubarTrigger>

          <MenubarContent
            className="z-50 w-100 rounded-sm p-4 text-sm"
            align="start"
            sideOffset={20}
          >
            {/* Rename input with star button */}
            <div
              className="mb-2 flex flex-row items-center gap-2"
              onSelect={(e) => e.preventDefault()}
            >
              <Input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleRenameSubmit}
                onBlur={handleBlur}
                placeholder="Base name"
                className="h-10 w-76 rounded-xs border border-none border-gray-300 bg-transparent text-sm shadow-none hover:bg-blue-50 focus-visible:border-blue-500 focus-visible:bg-blue-50 focus-visible:ring-1 focus-visible:ring-blue-200"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />

              {/* Favourite Star Button */}
              <div
                className="IC flex h-8 flex-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavourite();
                }}
              >
                <Star
                  size={18}
                  className={
                    isFavourite
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-gray-400"
                  }
                />
              </div>
            </div>

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
  );
}
