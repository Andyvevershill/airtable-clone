import AddRowButton from "@/components/buttons/add-row-button";
import type { ColumnType } from "@/types";
import type { QueryParams } from "@/types/view";

interface TableFooterProps {
  tableId: string;
  queryParams: QueryParams;
  notHydratedVirtualRows: boolean;
  columns: ColumnType[];
  effectiveRowCount: number;
}

export function TableFooter({
  tableId,
  columns,
  queryParams,
  notHydratedVirtualRows,
  effectiveRowCount,
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
            queryParams={queryParams}
            columns={columns}
            rowCount={effectiveRowCount}
          />
        </td>
      </tr>
    </tfoot>
  );
}
