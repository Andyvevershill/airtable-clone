import type { AppRouter } from "@/server/api/root";
import "@tanstack/react-table";
import { type inferRouterOutputs } from "@trpc/server";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    label: string;
    dataType: string;
    onCellUpdate: (
      rowId: string,
      columnId: string,
      value: string | null,
    ) => void;
  }
}

type RouterOutput = inferRouterOutputs<AppRouter>;
type GetRowsInfiniteOutput = RouterOutput["row"]["getRowsInfinite"];

type RowFromServer = GetRowsInfiniteOutput["items"][number];

type RowWithClientState = RowFromServer & {
  __optimistic?: boolean;
};
