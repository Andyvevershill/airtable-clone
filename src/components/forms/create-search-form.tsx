"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";
import { useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { Button } from "../ui/button";
import { DropdownMenu } from "../ui/dropdown-menu";

export function CreateSearchForm() {
  const { setGlobalSearch } = useGlobalSearchStore();
  const { setIsLoading } = useLoadingStore();
  const [searchQuery, setsearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  function handleSearch() {
    setIsLoading(true);
    setGlobalSearch(searchQuery);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="pointer flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="pointer ml-2 h-6.5 rounded-sm border-none p-0"
        >
          <Search />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="hover:none focus:none m-0 mt-0.5 mr-2 flex h-10 w-[366px] flex-row items-center rounded-xs p-0 text-sm"
        side="bottom"
        align="start"
        sideOffset={8}
      >
        <div className="hover:none focus:none flex h-10 w-[366px] flex-row items-center gap-2 rounded-xs p-0 px-2 py-1 text-sm text-[13px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setsearchQuery(e.target.value)}
            onBlur={handleSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Find in view..."
            className="h-full w-full border-none bg-transparent p-2 ring-0 outline-none focus:border-none focus:ring-0 focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="destructive"
            type="button"
            onClick={handleSearch}
            className="pointer hover:none h-[24px] w-[70px] bg-black text-xs"
          >
            Ask Omni
          </Button>
          <RxCross1
            className="pointer"
            onClick={() => {
              setOpen(false);
            }}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
