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

    const filteredAgents = fieldAgents.filter((field) =>
      field.name.toLowerCase().includes(query),
    );

    const filteredStandard = standardFields.filter((field) =>
      field.name.toLowerCase().includes(query),
    );

    setFilteredFieldAgents(filteredAgents);
    setFilteredStandardFields(filteredStandard);
  }, [searchQuery]);

  function handleOpenSubmenu(e: Event, value: string | undefined) {
    e.preventDefault();
    e.stopPropagation();

    // only given a value to strings or number options! do nothing if you select e.g. data
    if (!value || value === undefined) return;
    setSelectedField(value);
    setSearchQuery("");
    setIsSubmenuOpen(true);
  }

  function handleResetAll() {
    setIsSubmenuOpen(false);
    setSelectedField("");
    setSearchQuery("");
    setMenuKey((prev) => prev + 1);
  }

  return (
    <div className="relative flex items-center bg-white">
      <Menubar
        className="border-0 bg-transparent p-0 shadow-none"
        key={menuKey}
      >
        {!isSubmenuOpen ? (
          // MAIN DROPDOWN MENU
          <MenubarMenu>
            <MenubarTrigger className="pointer-IC h-9.25 w-23.5 border-r border-b border-gray-300 shadow-none">
              <AiOutlinePlus size={16} className="text-gray-800" />
            </MenubarTrigger>

            <MenubarContent
              className="p-y-3 z-50 mt-2 max-h-[700px] w-[375px] overflow-y-scroll rounded-sm px-2 text-sm"
              align="end"
              sideOffset={-5}
            >
              {/* Search through type array */}
              <div className="sticky top-0 z-10 mb-2 flex flex-row items-center gap-1 bg-white pt-1 pb-2">
                <div className="relative flex flex-1 items-center">
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
                    className="focus-visable:border-blue-500 h-9 w-full rounded-xs border-none bg-blue-50 pr-3 pl-10 text-sm shadow-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-1"
                    autoFocus
                  />
                </div>

                <Link
                  href="https://support.airtable.com/docs/supported-field-types-in-airtable-overview"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center"
                  target="_blank"
                >
                  <HelpCircle size={16} className="text-gray-500" />
                </Link>
              </div>

              <MenubarSeparator className="my-2" />

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

              {/* Separator only if both sections have results */}
              {filteredFieldAgents.length > 0 &&
                filteredStandardFields.length > 0 && (
                  <MenubarSeparator className="my-2" />
                )}

              {/* Standard fields */}
              {filteredStandardFields.length > 0 && (
                <div>
                  <p className="px-1 py-2 text-[13px] text-gray-500">
                    Standard fields
                  </p>
                  {filteredStandardFields.map((field) => (
                    <MenubarItem
                      key={field.name}
                      className="pointer flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-gray-700 hover:bg-slate-50"
                      onSelect={(e) => {
                        e.preventDefault();
                        handleOpenSubmenu(e, field.value);
                      }}
                    >
                      <field.icon size={16} className="text-slate-600" />
                      <span>{field.name}</span>
                    </MenubarItem>
                  ))}
                </div>
              )}

              {/* no results */}
              {filteredStandardFields.length === 0 &&
                filteredFieldAgents.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="mb-4 text-[13px] text-gray-400">
                      No field types or table names matching {searchQuery}
                    </p>
                    <p
                      onClick={() => {
                        setSearchQuery("");
                      }}
                      className="text-grey-500 cursor-pointer text-xs hover:text-gray-400"
                    >
                      Clear
                    </p>
                  </div>
                )}
            </MenubarContent>
          </MenubarMenu>
        ) : (
          // conditionally render different menu !? best way I could thing - we do not want another enu above, we want it to replace it - like airtable do!
          <MenubarMenu>
            <MenubarTrigger className="pointer-IC h-9.25 w-23.5 border-r border-b border-gray-300 shadow-none">
              <AiOutlinePlus size={16} className="text-gray-800" />
            </MenubarTrigger>

            <MenubarContent
              className="z-50 mt-2 w-[400px] rounded-sm p-4 text-sm"
              align="end"
              sideOffset={-5}
              onCloseAutoFocus={() => handleResetAll()}
              onEscapeKeyDown={() => handleResetAll()}
              onPointerDownOutside={() => handleResetAll()}
              onInteractOutside={() => handleResetAll()}
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
