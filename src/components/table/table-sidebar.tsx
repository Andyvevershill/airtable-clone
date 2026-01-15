"use client";
import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { TableWithViews } from "@/types";
import { Search, Star, TableCellsSplit } from "lucide-react";
import { useEffect, useState } from "react";
import Add100kRowButton from "../buttons/add-100k-rows-button";
import { CreateViewDropdown } from "../dropdowns/create-view-dropdown";
import { EditViewDropdown } from "../dropdowns/edit-view-dropdown";
import ViewEditMode from "../view/view-edit-mode";
interface Props {
  sidebarOpen: boolean;
  tableWithViews: TableWithViews;
}
export function TableSidebar({ tableWithViews, sidebarOpen }: Props) {
  const [views, setViews] = useState(tableWithViews.views);
  const [hoveredViewId, setHoveredViewId] = useState<string | null>(null);
  const [editViewId, setEditViewId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const setIsSaving = useSavingStore((s) => s.setIsSaving);

  const utils = api.useUtils();
  // keep in sync if server data changes
  useEffect(() => {
    setViews(tableWithViews.views);
  }, [tableWithViews.views]);

  const toggleFavouriteSidebar = api.view.toggleFavourite.useMutation({
    onMutate: ({ id, isFavourite }) => {
      setIsSaving(true);
      setViews((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, isFavourite: !isFavourite } : v,
        ),
      );
    },
    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({
        tableId: tableWithViews.id,
      });
    },
    onError: (_err, { id, isFavourite }) => {
      setViews((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isFavourite } : v)),
      );
    },
    onSettled: () => setIsSaving(false),
  });

  return (
    <div
      className={`relative h-full border-r border-gray-200 bg-white transition-[width] duration-300 ${
        sidebarOpen ? "w-[265px]" : "w-0"
      }`}
    >
      <div
        className={`flex h-full flex-col justify-between overflow-hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="space-y-1 px-2 py-2">
          <CreateViewDropdown tableId={tableWithViews.id} />

          <button className="flex h-9 w-full items-center gap-2 rounded px-2 text-gray-500">
            <Search size={18} />
            <span className="text-[13px]">Find a view</span>
          </button>

          {views.map((view) => {
            const isHovered = hoveredViewId === view.id;
            const isEditing = editViewId === view.id;
            return (
              <div
                key={view.id}
                onMouseEnter={() => setHoveredViewId(view.id)}
                onMouseLeave={() => setHoveredViewId(null)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditViewId(view.id);
                }}
                className={`pointer flex h-9 w-full items-center gap-2 rounded bg-gray-100 px-2 text-[13px] ${
                  view.isFavourite ? "bg-gray-100" : ""
                }`}
              >
                <div className="mr-2 w-3">
                  {isHovered ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavouriteSidebar.mutate({
                          id: view.id,
                          isFavourite: view.isFavourite,
                        });
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100"
                    >
                      <Star
                        size={16}
                        className={
                          view.isFavourite
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-800"
                        }
                      />
                    </div>
                  ) : (
                    <TableCellsSplit size={16} className="text-blue-500" />
                  )}
                </div>

                {isEditing ? (
                  <ViewEditMode
                    view={view}
                    setViews={setViews}
                    onDone={() => setEditViewId(null)}
                  />
                ) : (
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate text-[13px]">{view.name}</span>
                    {(isHovered || openDropdownId === view.id) && (
                      <EditViewDropdown
                        deleteDisabled={views.length === 1}
                        view={view}
                        setViews={setViews}
                        onRename={() => setEditViewId(view.id)}
                        onOpenChange={(open) =>
                          setOpenDropdownId(open ? view.id : null)
                        }
                      />
                    )}
                  </div>
                )}
              </div>
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
