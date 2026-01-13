import "@tanstack/react-table";

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
