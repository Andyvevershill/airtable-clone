import AddRowButton from "@/components/buttons/add-row-button";
import type { ColumnType } from "@/types/column";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

interface TableFooterProps {
  tableId: string;
  columns: ColumnType[];
  sorting: SortingState;
  filters: ColumnFiltersState;
  notHydratedVirtualRows: boolean;
}

export function TableFooter({
  tableId,
  columns,
  sorting,
  filters,
  notHydratedVirtualRows,
}: TableFooterProps) {
  return (
    <tfoot>
      <tr>
        <td
          colSpan={columns.length + 1}
          className="pointer h-8 border border-t-0 border-l-0 border-gray-200 bg-white p-0"
        >
          <AddRowButton
            notHydratedVirtualRows={notHydratedVirtualRows}
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
