"use client";

import { useViewStore } from "@/app/stores/use-view-store";
import { getLastAccessed } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { BaseWithTables } from "@/types/base";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BiCoinStack } from "react-icons/bi";
import { BaseActionsDropdown } from "./base-actions-dropdown";
import BaseEditMode from "./base-edit-mode";

interface props {
  base: BaseWithTables;
}

export default function BaseCard({ base }: props) {
  const [onHover, setOnHover] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [baseName, setBaseName] = useState(base.name);
  const [isFavourite, setIsFavourite] = useState(base.isFavourite);
  const { reset } = useViewStore();

  const router = useRouter();
  const utils = api.useUtils();
  const updateLastAccessed = api.base.updateLastAccessed.useMutation();

  function handleRedirect() {
    void updateLastAccessed.mutate({ id: base.id });
    reset();
    router.push(`/base/${base.id}`);
  }

  function handleHover() {
    // Prefetch base data
    void utils.base.getById.prefetch({ id: base.id });

    const tableId = base.tables[0]?.id;

    // Prefetch first table data
    if (tableId) {
      void utils.table.getTableWithViews.prefetch({ tableId });
      void utils.column.getColumns.prefetch({ tableId });
    }

    setOnHover(true);
  }

  return (
    <div
      className="pointer relative flex h-25 w-75 flex-row gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-md"
      onClick={handleRedirect}
      onMouseEnter={handleHover}
      onMouseLeave={() => setOnHover(false)}
    >
      {onHover && !editMode ? (
        <div className="absolute top-3 right-3">
          <BaseActionsDropdown
            base={base}
            favouriteState={[isFavourite, setIsFavourite]}
            setEditMode={setEditMode}
          />
        </div>
      ) : (
        isFavourite &&
        !editMode && (
          <div className="absolute top-4 right-4">
            <Star size={16} className="fill-yellow-500 text-yellow-500" />
          </div>
        )
      )}

      <div
        className="IC flex h-14 w-14 rounded-lg"
        style={{ backgroundColor: base.colour }}
      >
        <p className="flex text-2xl text-white capitalize">
          {base.name.slice(0, 2)}
        </p>
      </div>
      {editMode ? (
        <BaseEditMode
          base={base}
          nameState={[baseName, setBaseName]}
          setEditMode={setEditMode}
        />
      ) : (
        <div className="relative flex flex-col items-start justify-between py-3">
          <h3 className="overflow-hidden text-sm font-medium">{baseName}</h3>
          {onHover ? (
            <div className="flex items-center">
              <BiCoinStack />
              <p className="ml-2.5 text-xs text-gray-500">Open data</p>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">
              Opened {getLastAccessed(base.lastAccessedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
