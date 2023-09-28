import {
  // PaginationState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";

import { memo } from "react";

interface DataTableProps<T> {
  data: Array<T>;
  columns: Array<ColumnDef<T, any>>;
  pageSize?: number;
}

const DataTableComponent = <T extends any>(
  props: DataTableProps<T>,
): React.ReactElement<T> => {
  // const [pagination, setPagination] = useState<PaginationState>({
  //   pageIndex: 0,
  //   pageSize: props.pageSize || 10,
  // });

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    state: {
      pagination: {
        pageIndex: 0,
        pageSize: 1000,
      },
    },
    // state: {
    //   pagination,
    // },
    // onPaginationChange: setPagination,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
  });
  console.log("table", table.getRowModel());
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full rounded-lg overflow-hidden bg-white shadow-md">
        <thead className="bg-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4 py-2 text-left font-semibold text-gray-700"
                  >
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr
                key={row.id}
                className="hover:bg-gray-100 transition-all duration-100"
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td
                      key={cell.id}
                      className="px-4 py-2 border-t border-gray-300"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {table.getRowModel().rows.length === 0 && (
        <p className="py-4 text-center w-full font-bold bg-white border-b rounded">
          No Data Available
        </p>
      )}
    </div>
  );
};

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
