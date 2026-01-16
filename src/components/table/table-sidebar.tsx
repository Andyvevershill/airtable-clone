"use client";

import type { TableWithViews } from "@/types";
import { useState } from "react";
import { CiSearch } from "react-icons/ci";
import Add100kRowButton from "../buttons/add-100k-rows-button";
import ViewButton from "../buttons/view-button";
import { CreateViewDropdown } from "../dropdowns/create-view-dropdown";
import { Input } from "../ui/input";
interface Props {
  sidebarOpen: boolean;
  tableWithViews: TableWithViews;
}
export function TableSidebar({ tableWithViews, sidebarOpen }: Props) {
  const [views, setViews] = useState(tableWithViews.views);
  const [hoveredViewId, setHoveredViewId] = useState<string | null>(null);
  const [editViewId, setEditViewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredViews = views.filter((view) =>
    view.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className={`relative h-full border-r border-gray-200 bg-white transition-[width] duration-300 ${
        sidebarOpen ? "w-[265px]" : "w-0"
      }`}
    >
      <div
        className={`flex h-full flex-col justify-between gap-2 overflow-hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col gap-2 px-2 py-1">
          <CreateViewDropdown
            tableId={tableWithViews.id}
            viewLength={views.length}
            setViews={setViews}
          />

          <div className="relative flex h-8 flex-1 items-center text-[13px]">
            <CiSearch className="absolute left-2 text-gray-400" size={16} />
            <Input
              type="text"
              value={searchQuery}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a view"
              className="h-7 w-full rounded-xs border-none bg-white pl-8 shadow-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredViews.map((view) => {
            const isHovered = hoveredViewId === view.id;
            const isEditing = editViewId === view.id;
            return (
              <ViewButton
                key={view.id}
                setHoveredViewId={setHoveredViewId}
                setViews={setViews}
                setEditViewId={setEditViewId}
                view={view}
                views={views}
                searchQuery={searchQuery}
                isHovered={isHovered}
                isEditing={isEditing}
              />
            );
          })}
        </div>

        <div className="p-2">
          <Add100kRowButton tableId={tableWithViews.id} />
        </div>
      </div>
    </div>
  );
}
