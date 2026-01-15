import { useLoadingStore } from "@/app/stores/use-loading-store";
import { api } from "@/trpc/react";
import { AiOutlinePlus } from "react-icons/ai";

interface Props {
  tableId: string;
}

export default function AddRowButton({ tableId }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);
  const utils = api.useUtils();

  const addRow = api.row.addRow.useMutation({
    onMutate: async () => {
      const traceId = `add-row-${Date.now()}`;
      console.log(`🟢 [${traceId}] Starting optimistic row add`);

      setIsLoading(true);

      // ✅ Include sorting in the query key
      const queryKey = {
        tableId,
        limit: 5000,
      };

      console.log(`📋 [${traceId}] Query key:`, queryKey);

      await utils.row.getRowsInfinite.cancel(queryKey);

      const previousData = utils.row.getRowsInfinite.getInfiniteData(queryKey);

      console.log(`📊 [${traceId}] Previous data:`, {
        hasData: !!previousData,
        pageCount: previousData?.pages?.length,
        firstPageItems: previousData?.pages?.[0]?.items?.length,
      });

      utils.row.getRowsInfinite.setInfiniteData(queryKey, (old) => {
        if (!old) {
          console.warn(`⚠️ [${traceId}] No old data found!`);
          return old;
        }

        const tempRowId = `temp-${Date.now()}`;

        const newRow = {
          id: tempRowId,
          tableId,
          position: old.pages[0]?.items.length ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          cells: [],
        };

        console.log(
          `✅ [${traceId}] Adding row at position ${newRow.position}`,
        );

        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0 ? { ...page, items: [...page.items, newRow] } : page,
          ),
        };
      });

      return { previousData, traceId, queryKey };
    },

    onError: (err, _variables, context) => {
      console.error(`❌ [${context?.traceId}] Failed:`, err);

      if (context?.previousData && context?.queryKey) {
        utils.row.getRowsInfinite.setInfiniteData(
          context.queryKey,
          context.previousData,
        );
      }
    },

    onSuccess: (_data, _variables, context) => {
      console.log(`🎉 [${context?.traceId}] Success - invalidating`);
      void utils.row.getRowsInfinite.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
    },

    onSettled: () => {
      setIsLoading(false);
    },
  });

  return (
    <button
      className="pointer flex h-full w-full items-center justify-start pl-2 hover:bg-gray-50"
      title="Add row"
      onClick={() => addRow.mutate({ tableId })}
      disabled={addRow.isPending}
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}
