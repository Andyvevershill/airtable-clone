"use client";

import { useSavingStore } from "@/app/stores/use-saving-store";
import { useViewStore } from "@/app/stores/use-view-store";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { typeBaseWithTableIds } from "@/types/base";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PiDotsSixVerticalLight } from "react-icons/pi";

interface props {
  base: typeBaseWithTableIds;
}

export default function BaseNavBarButton({ base }: props) {
  const [onHover, setOnHover] = useState(false);
  const { reset } = useViewStore();
  const { setIsSaving } = useSavingStore();

  const router = useRouter();
  const utils = api.useUtils();
  const updateLastAccessed = api.base.updateLastAccessed.useMutation();

  function handleRedirect() {
    void updateLastAccessed.mutate({ id: base.id });
    reset();
    router.push(`/base/${base.id}/${base.tables[0]?.id}`);
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

  const toggleFavourite = api.base.updateFavouriteById.useMutation({
    onMutate: async ({ baseId, favourite }) => {
      setIsSaving(true);

      // Cancel
      await utils.base.getAll.cancel();
      await utils.base.getAllFavourites.cancel();

      // Snapshot
      const previousBases = utils.base.getAll.getData();
      const previousFavourites = utils.base.getAllFavourites.getData();

      // update
      utils.base.getAll.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((b) =>
          b.id === baseId ? { ...b, isFavourite: favourite } : b,
        );
      });

      utils.base.getAllFavourites.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((b) =>
          b.id === baseId ? { ...b, isFavourite: favourite } : b,
        );
      });

      return { previousBases, previousFavourites };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBases) {
        utils.base.getAll.setData(undefined, context.previousBases);
      }
      if (context?.previousFavourites) {
        utils.base.getAllFavourites.setData(
          undefined,
          context.previousFavourites,
        );
      }
      setIsSaving(false);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      void utils.base.getAll.invalidate();
      void utils.base.getAllFavourites.invalidate();
      setIsSaving(false);
    },
  });

  const handleFavourite = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    event?.preventDefault();

    toggleFavourite.mutate({
      baseId: base.id,
      favourite: !base.isFavourite, // Use prop directly
    });
  };

  return (
    <div
      className="pointer relative mb-1 flex h-[35px] w-[275px] flex-row items-center justify-between gap-2 px-2 hover:bg-gray-100"
      onClick={handleRedirect}
      onMouseEnter={handleHover}
      onMouseLeave={() => setOnHover(false)}
    >
      <div className="pointer flex flex-row gap-2">
        <div
          className="mb-0 flex h-[28px] w-[28px] items-center justify-center rounded-sm"
          style={{ backgroundColor: base.colour }}
        >
          <p className="text-md flex text-white capitalize">
            {base.name.slice(0, 2)}
          </p>
        </div>

        <div className="relative flex flex-col items-start justify-center">
          <h3
            className={cn(
              "w-full truncate text-[13px] text-gray-700",
              onHover ? "max-w-[130px]" : "max-w-[200px]",
            )}
          >
            {base.name}
          </h3>
        </div>
      </div>

      {onHover && (
        <div
          className="mr-4 flex flex-row items-center gap-2"
          onClick={handleFavourite}
        >
          <p className="text-[11px] text-gray-400">App</p>
          <Star
            size={16}
            className={`${base.isFavourite && "fill-yellow-500 text-yellow-500"}`}
          />
          <PiDotsSixVerticalLight className="h-20 text-gray-800 hover:cursor-grab" />
        </div>
      )}
    </div>
  );
}
