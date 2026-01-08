"use client";

import { getLastAccessed } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { Base } from "@/types/bases";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BiCoinStack } from "react-icons/bi";
import { BaseActionsDropdown } from "./base-actions-dropdown";
import BaseEditMode from "./base-edit-mode";

interface props {
  base: Base;
}

export default function BaseCard({ base }: props) {
  const [onHover, setOnHover] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // used for optimistic rendering when changing the base name + favourite
  const [baseName, setBaseName] = useState(base.name);
  const [isFavourite, setIsFavourite] = useState(base.isFavourite);

  const router = useRouter();
  const updateLastAccessed = api.base.updateLastAccessed.useMutation();

  function handleRedirect() {
    // update last accessed when we press into the base
    updateLastAccessed.mutate({
      id: base.id,
    });
    router.push(`/base/${base.id}`);
  }

  return (
    <div
      className="pointer relative flex h-25 w-78 flex-row gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-md"
      onClick={handleRedirect}
      onMouseEnter={() => setOnHover(true)}
      onMouseLeave={() => setOnHover(false)}
    >
      {/* Dropdown in top right - only visible on hover */}
      {onHover && !editMode ? (
        <div className="absolute top-3 right-3">
          <BaseActionsDropdown
            base={base}
            favouriteState={[isFavourite, setIsFavourite]}
            setEditMode={setEditMode}
          />
        </div>
      ) : (
        isFavourite && (
          <div className="absolute top-4 right-4">
            <Star size={16} className="fill-yellow-500 text-yellow-500" />
          </div>
        )
      )}

      <div
        className="flex h-14 w-14 items-center justify-center rounded-lg"
        style={{ backgroundColor: base.color }}
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
