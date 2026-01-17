import AddRowButton from "@/components/buttons/add-row-button";
import type { ColumnType } from "@/types/column";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

interface TableFooterProps {
  tableId: string;
  columns: ColumnType[];
  sorting: SortingState;
  filters: ColumnFiltersState;
}

export function TableFooter({
  tableId,
  columns,
  sorting,
  filters,
}: TableFooterProps) {
  const getColumnSpan = (): number => {
    return columns.length + 1;
  };

  return (
    <tfoot>
      <tr>
        <td
          colSpan={getColumnSpan()}
          className="pointer h-8 border border-gray-200 bg-white p-0"
        >
          <AddRowButton
            tableId={tableId}
            sorting={sorting}
            filters={filters}
            columns={columns}
          />
        </td>
      </tr>
    </tfoot>
  );
}
