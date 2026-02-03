"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import type { BaseWithTables } from "@/types/base";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { RiArrowDownSLine } from "react-icons/ri";
import { Input } from "../ui/input";
import { AddTableSubmenu } from "./add-table-submenu";

interface Props {
  base: BaseWithTables;
  activeTab: string;
  setTables: React.Dispatch<
    React.SetStateAction<{ id: string; name: string }[]>
  >;
}

export function TableTabDropdown({ base, activeTab, setTables }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const filteredTables = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return base.tables;
    }

    return base.tables.filter((table) =>
      table.name.toLowerCase().includes(query),
    );
  }, [searchQuery, base.tables]);

  function handleSearch() {
    setSearchQuery("");
  }

  return (
    <div className="flex flex-row gap-1">
      <div className="h-8 w-8">
        <Menubar className="h-8 w-8 border-0 bg-transparent p-0">
          <MenubarMenu>
            <MenubarTrigger
              className="pointer-IC h-8 w-8 p-0"
              onClick={() => setIsOpen(!isOpen)}
            >
              <RiArrowDownSLine
                size={16}
                className="text-gray-600 hover:text-gray-900"
              />
            </MenubarTrigger>
            <MenubarContent
              className="rounded-xs p-4 text-sm md:w-110"
              align="start"
            >
              {/* Search */}
              <div
                className="flex w-full flex-row items-center gap-2 px-2 py-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <HiMagnifyingGlass size={16} className="text-gray-600" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                    e.stopPropagation();
                  }}
                  placeholder="Find a table"
                  className="h-6 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <MenubarSeparator className="my-2 w-full" />

              {/* Table list */}
              {filteredTables.map((table) => (
                <MenubarItem
                  key={table.id}
                  className="pointer flex flex-row items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-gray-100"
                  onClick={() => router.push(`/base/${base.id}/${table.id}`)}
                >
                  <div className="w-4">
                    {activeTab === table.id && <Check size={16} />}
                  </div>
                  <p className="text-sm">{table.name}</p>
                </MenubarItem>
              ))}

              {/* no results */}
              {filteredTables.length === 0 && (
                <div className="h-12 py-4 text-center">
                  <p className="mb-4 text-[13px] text-gray-600">
                    No matching tables
                  </p>
                </div>
              )}

              <MenubarSeparator className="my-2 w-full" />

              {/* Add table submenu */}
              <AddTableSubmenu
                baseId={base.id}
                tableNumber={base.tables.length + 1}
                setTables={setTables}
                onTableCreated={() => setIsOpen(false)}
              />
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  );
}
