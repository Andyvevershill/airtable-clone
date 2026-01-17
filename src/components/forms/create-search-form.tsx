"use client";

import { useGlobalSearchStore } from "@/app/stores/use-search-store";
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";
import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { LuLoaderPinwheel } from "react-icons/lu";
import { RxCross1 } from "react-icons/rx";
import { Button } from "../ui/button";
import { DropdownMenu } from "../ui/dropdown-menu";

export function CreateSearchForm() {
  const {
    setGlobalSearch,
    setActiveMatchIndex,
    setIsSearching,
    globalSearchLength,
    activeMatchIndex,
    isSearching,
    hasSearched,
    resetSearch,
  } = useGlobalSearchStore();
  const [searchQuery, setsearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGlobalSearch(searchQuery);
  }

  function handleClearSearch() {
    resetSearch(); // Use the reset function
    setsearchQuery("");
    setOpen(false);
  }

  function handleArrowUp() {
    if (activeMatchIndex === globalSearchLength - 1) {
      setActiveMatchIndex(0);
      return;
    }
    setActiveMatchIndex(activeMatchIndex + 1);
  }

  function handleArrowDown() {
    if (activeMatchIndex === 0) {
      setActiveMatchIndex(globalSearchLength - 1);
      return;
    }
    setActiveMatchIndex(activeMatchIndex - 1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setsearchQuery(value);

    // Reset search state when input is cleared
    if (value === "") {
      resetSearch();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild className="pointer flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="pointer ml-2 h-6.5 rounded-sm border-none p-0"
        >
          <Search />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="hover:none focus:none m-0 mt-0.5 mr-2 flex h-10 w-[366px] flex-row items-center rounded-b-sm p-0 text-sm"
        side="bottom"
        align="start"
        sideOffset={8}
      >
        <div className="hover:none focus:none flex h-10 w-[366px] flex-row items-center gap-2 p-0 px-2 py-1 text-sm text-[13px]">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
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

          <div className="flex w-full flex-row items-center justify-end text-[11px] text-gray-400">
            {isSearching ? (
              <div className="flex h-full w-10 items-center justify-end text-gray-400">
                <LuLoaderPinwheel size={16} className="mr-4 animate-spin" />
              </div>
            ) : globalSearchLength > 0 ? (
              <div className="flex flex-row items-center justify-start">
                <div className="flex max-w-[90px] flex-row items-center justify-start truncate whitespace-nowrap">
                  <p className="truncate">
                    {activeMatchIndex + 1} of {globalSearchLength}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleArrowDown}
                  className="pointer ml-2 flex h-5 w-4 items-center justify-center rounded-sm p-0 hover:bg-gray-100"
                >
                  <IoIosArrowDown />
                </button>
                <button
                  type="button"
                  onClick={handleArrowUp}
                  className="pointer flex h-5 w-4 items-center justify-center rounded-sm hover:bg-gray-100"
                >
                  <IoIosArrowUp />
                </button>
              </div>
            ) : (
              hasSearched &&
              globalSearchLength === 0 && (
                <div className="text-xm mr-2 flex flex-row items-center">
                  <p>No results</p>
                </div>
              )
            )}
            <Button
              variant="destructive"
              type="button"
              onClick={handleSearch}
              className="pointer hover:none ml-1 h-[24px] w-[70px] bg-black text-xs"
            >
              Ask Omni
            </Button>
            <div className="pointer ml-1 flex h-5 w-5 items-center justify-center rounded-sm hover:bg-gray-100">
              <RxCross1 onClick={handleClearSearch} />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
