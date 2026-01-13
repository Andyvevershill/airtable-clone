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
      setIsLoading(true);
      await utils.row.getRowsInfinite.cancel({ tableId });

      const previousData = utils.row.getRowsInfinite.getInfiniteData({
        tableId,
        limit: 250,
      });

      utils.row.getRowsInfinite.setInfiniteData(
        { tableId, limit: 250 },
        (old) => {
          if (!old) return old;

          const tempRowId = `temp-${Date.now()}`;
          const newRow = {
            id: tempRowId,
            tableId,
            position: old.pages[0]?.items.length ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            cells: [],
          };

          return {
            ...old,
            pages: old.pages.map((page, index) =>
              index === 0 ? { ...page, items: [...page.items, newRow] } : page,
            ),
          };
        },
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        utils.row.getRowsInfinite.setInfiniteData(
          { tableId, limit: 250 },
          context.previousData,
        );
      }

      console.error("Failed to add row:", err);
    },
    onSuccess: () => {
      void utils.row.getRowsInfinite.invalidate({ tableId });
      void utils.row.getRowCount.invalidate({ tableId });
      setIsLoading(false);
    },
  });

  const handleAddRow = () => {
    addRow.mutate({ tableId });
  };

  return (
    <button
      className="pointer flex h-full w-full items-center justify-start pl-2 hover:bg-gray-50"
      title="Add row"
      onClick={handleAddRow}
      disabled={addRow.isPending}
    >
      <AiOutlinePlus size={16} className="text-gray-600" />
    </button>
  );
}
