import {
  // PaginationState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";

// import { useState } from "react";

interface DataTableProps<T> {
  data: Array<T>;
  columns: Array<ColumnDef<T, any>>;
  pageSize?: number;
}

export const DataTable = <T extends any>(
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

  return (
    <div className="p-2">
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4 py-2 text-left"
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
              <tr key={row.id}>
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
    </div>
  );
};
