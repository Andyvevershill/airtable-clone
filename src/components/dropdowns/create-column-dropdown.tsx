"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { CiSearch } from "react-icons/ci";
import { fieldAgents, standardFields } from "../columns/add-collumn-config";
import { Input } from "../ui/input";
import { CreateColumnSubmenu } from "./create-column-submenu";

interface Props {
  tableId: string;
}

const fieldIconClasses: Record<string, string> = {
  green: "text-green-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  orange: "text-orange-600",
  slate: "text-slate-600",
};

const hoverBgColors: Record<string, string> = {
  green: "#ebf4ed",
  blue: "#e8f4fd",
  purple: "#f5f0f7",
  orange: "#fff6e8",
  slate: "#f0f4f7",
};

export function CreateColumnDropdown({ tableId }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [filteredFieldAgents, setFilteredFieldAgents] = useState(fieldAgents);
  const [filteredStandardFields, setFilteredStandardFields] =
    useState(standardFields);
  const [selectedField, setSelectedField] = useState("");
  const [menuKey, setMenuKey] = useState(0);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      setFilteredFieldAgents(fieldAgents);
      setFilteredStandardFields(standardFields);
      return;
    }

    setFilteredFieldAgents(
      fieldAgents.filter((f) => f.name.toLowerCase().includes(query)),
    );

    setFilteredStandardFields(
      standardFields.filter((f) => f.name.toLowerCase().includes(query)),
    );
  }, [searchQuery]);

  function handleOpenSubmenu(e: Event, value?: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;

    setSelectedField(value);

    setSearchQuery("");
    setIsSubmenuOpen(true);
  }

  function handleResetAll() {
    setIsSubmenuOpen(false);
    setSelectedField("");
    setSearchQuery("");
    setMenuKey((k) => k + 1);
  }

  return (
    <div className="relative flex items-center bg-white">
      <Menubar
        key={menuKey}
        className="border-0 bg-transparent p-0 shadow-none"
      >
        {!isSubmenuOpen ? (
          <MenubarMenu>
            <MenubarTrigger className="pointer-IC h-9.25 w-23.5 border-r border-b border-gray-300 shadow-none">
              <AiOutlinePlus size={16} className="text-gray-800" />
            </MenubarTrigger>

            <MenubarContent
              align="end"
              sideOffset={-5}
              className="z-50 mt-2 w-[400px] rounded-sm bg-white p-0 text-sm"
            >
              <div className="mb-1 border-b border-gray-200 px-2 pt-1 pb-2">
                <div className="flex items-center gap-1">
                  <div className="relative flex flex-1 items-center text-[13px]">
                    <CiSearch
                      className="absolute left-3 text-gray-400"
                      size={18}
                    />
                    <Input
                      type="text"
                      value={searchQuery}
                      onKeyDown={(e) => e.stopPropagation()}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find a field type"
                      className="h-9 w-full rounded-sm border-none bg-blue-50 pr-3 pl-10 text-sm shadow-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <Link
                    href="https://support.airtable.com/docs/supported-field-types-in-airtable-overview"
                    target="_blank"
                    className="flex h-9 w-9 items-center justify-center"
                  >
                    <HelpCircle size={16} className="text-gray-500" />
                  </Link>
                </div>
              </div>

              <div className="max-h-[620px] overflow-y-auto px-2 py-2">
                {filteredFieldAgents.length > 0 && (
                  <div className="mb-4">
                    <p className="px-1 py-2 text-[13px] text-gray-500">
                      Field agents
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {filteredFieldAgents.map((field) => (
                        <MenubarItem
                          key={field.name}
                          className="pointer flex items-center gap-1 rounded-sm px-2 py-2 text-[13px] text-gray-700"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              hoverBgColors[field.colour] ?? "";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "";
                          }}
                        >
                          <field.icon
                            size={16}
                            className={fieldIconClasses[field.colour]}
                          />
                          <span className="truncate">{field.name}</span>
                        </MenubarItem>
                      ))}
                    </div>
                  </div>
                )}

                {filteredFieldAgents.length > 0 &&
                  filteredStandardFields.length > 0 && (
                    <MenubarSeparator className="my-2" />
                  )}

                {filteredStandardFields.length > 0 && (
                  <div>
                    <p className="px-1 py-2 text-[13px] text-gray-500">
                      Standard fields
                    </p>
                    {filteredStandardFields.map((field) => (
                      <MenubarItem
                        key={field.name}
                        className="pointer flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-gray-700 hover:bg-slate-50"
                        onSelect={(e) => handleOpenSubmenu(e, field.value)}
                      >
                        <field.icon size={16} className="text-slate-600" />
                        <span>{field.name}</span>
                      </MenubarItem>
                    ))}
                  </div>
                )}

                {filteredStandardFields.length === 0 &&
                  filteredFieldAgents.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="mb-4 text-[13px] text-gray-400">
                        No field types matching “{searchQuery}”
                      </p>
                      <p
                        onClick={() => setSearchQuery("")}
                        className="cursor-pointer text-xs text-gray-500 hover:text-gray-400"
                      >
                        Clear
                      </p>
                    </div>
                  )}
              </div>
            </MenubarContent>
          </MenubarMenu>
        ) : (
          <MenubarMenu>
            <MenubarTrigger className="pointer-IC h-9.25 w-23.5 border-r border-b border-gray-300 shadow-none">
              <AiOutlinePlus size={16} className="text-gray-800" />
            </MenubarTrigger>

            <MenubarContent
              align="end"
              sideOffset={-5}
              className="z-50 mt-2 w-[400px] rounded-sm p-4 text-sm"
              onCloseAutoFocus={handleResetAll}
              onEscapeKeyDown={handleResetAll}
              onPointerDownOutside={handleResetAll}
              onInteractOutside={handleResetAll}
            >
              <CreateColumnSubmenu
                tableId={tableId}
                selectedField={selectedField}
                handleResetAll={handleResetAll}
              />
            </MenubarContent>
          </MenubarMenu>
        )}
      </Menubar>
    </div>
  );
}
