"use client";

import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useViewStore } from "@/app/stores/use-view-store";
import type { View } from "@/server/db/schemas";
import { api } from "@/trpc/react";
import { CircleStar } from "lucide-react";
import { useState } from "react";
import { AiOutlineLock } from "react-icons/ai";
import { GrGroup } from "react-icons/gr";
import { IoPersonOutline } from "react-icons/io5";

interface Props {
  tableId: string;
  viewLength: number;
  setViews: React.Dispatch<React.SetStateAction<View[]>>;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateViewForm({
  tableId,
  onCancel,
  setViews,
  onSuccess,
  viewLength,
}: Props) {
  const [viewName, setViewName] = useState<string>(`Grid ${viewLength + 1}`);
  const { setIsLoadingView } = useLoadingStore();
  const { setActiveView } = useViewStore();

  const utils = api.useUtils();

  const createView = api.view.createView.useMutation({
    onMutate: async ({ viewId, name: viewName, tableId }) => {
      setIsLoadingView(true);

      await utils.table.getTableWithViews.cancel({ tableId });

      const previousData = utils.table.getTableWithViews.getData({ tableId });

      const newView: View = {
        id: viewId,
        tableId,
        name: viewName,
        createdAt: new Date(),
        isFavourite: false,
        isActive: true,
        filters: null,
        sorting: null,
        hidden: null,
      };

      // Update cache
      utils.table.getTableWithViews.setData({ tableId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          views: [
            ...old.views.map((v) => ({ ...v, isActive: false })),
            newView,
          ],
        };
      });

      // Update local state
      setViews((prev) => {
        const deactivated = prev.map((v) =>
          v.isActive ? { ...v, isActive: false } : v,
        );
        return [...deactivated, newView];
      });

      // Set as active view in store
      setActiveView(newView);

      onSuccess();

      return { previousData };
    },
    onSuccess: () => {
      void utils.table.getTableWithViews.invalidate({ tableId });
      setViewName("");
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.table.getTableWithViews.setData(
          { tableId },
          context.previousData,
        );
        setViews(context.previousData.views);
      }
    },
  });

  const handleCreateView = () => {
    if (!viewName.trim()) return;

    createView.mutate({
      viewId: crypto.randomUUID(),
      name: viewName,
      tableId: tableId,
    });
  };

  const list = [
    { label: "Collaborative", icon: GrGroup, showBlue: true },
    { label: "Personal", icon: IoPersonOutline },
    { label: "Locked", icon: AiOutlineLock },
  ];

  return (
    <div className="w-full space-y-3 p-2">
      <input
        type="text"
        placeholder="View name"
        value={viewName}
        onChange={(e) => setViewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleCreateView();
          }
        }}
        autoFocus
        className="text-md w-[380px] rounded border border-gray-200 px-1 py-1.5 focus:ring-2 focus:ring-gray-300 focus:outline-none"
      />
      <div className="mt-4 flex flex-col gap-2">
        <h2 className="text-md font-[500] text-gray-800">Who can edit</h2>
        <div className="text-gray-70 flex w-full flex-row justify-between gap-1 text-[13px]">
          {list.map((item, index) => (
            <div key={index} className="pointer flex items-center gap-1">
              {item.showBlue ? (
                <div className="pointer flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
              ) : (
                <div className="pointer flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300">
                  <div className="h-2 w-2 rounded-full" />
                </div>
              )}
              <item.icon size={16} />
              <span>{item.label}</span>
              {!item.showBlue && <CircleStar size={16} color="#166EE1" />}
            </div>
          ))}
        </div>

        <p className="text-[13px] text-gray-500">
          All collaborators can edit the configuration
        </p>
      </div>
      <div className="flex w-full flex-row items-center justify-end">
        <button
          onClick={() => {
            setViewName("");
            onCancel();
          }}
          className="pointer max-w-[65px] flex-1 rounded-sm px-2 py-1.5 text-[13px] hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateView}
          disabled={!viewName.trim()}
          className="pointer max-w-[125px] flex-1 rounded-sm bg-[#166EE1] px-3 py-1.5 text-[13px] text-white"
        >
          Create view
        </button>
      </div>
    </div>
  );
}
