import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Columns2,
  Eye,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination";

const data = [
  {
    id: "m5gr84i9",
    status: "active",
    email: "ken99@yahoo.com",
    firstName: "Ken",
    lastName: "Dawg",
  },
  {
    id: "3u1reuv4",
    status: "active",
    email: "Abe45@gmail.com",
    firstName: "Abe",
    lastName: "Dawg",
  },
  {
    id: "derv1ws0",
    status: "inactive",
    email: "Monserrat44@gmail.com",
    firstName: "Monserrat",
    lastName: "Dawg",
  },
  {
    id: "5kma53ae",
    status: "active",
    email: "Silas22@gmail.com",
    firstName: "Silas",
    lastName: "Dawg",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    email: "carmella@hotmail.com",
    firstName: "Carmella",
    lastName: "Dawg",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",

    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",

    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",

    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
  {
    id: "idiex2p5",
    status: "inactive",
    email: "jakura@hotmail.com",
    firstName: "Ja",
    lastName: "Kura",
  },
];

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // email column
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },

  // name column
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
  },

  // status column
  {
    accessorKey: "status",
    header: "Status",

    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    header: "Actions",
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              <Copy /> Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye /> View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              {" "}
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const pagination = {};

export default function AccountsTable() {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        {/* search */}
        <Input
          placeholder="Filter emails..."
          value={table.getColumn("email")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {/* columns toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto cursor-pointer">
              <Columns2 /> Filter Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* data table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        {/* rows per page */}
        <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-18 border-gray-200 cursor-pointer"
                id="rows-per-page"
              >
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* pagination */}
          <Pagination className="flex items-center">
            <PaginationContent className="flex flex-wrap justify-center gap-1">
              <PaginationItem>
                <PaginationFirst
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {table.getPageCount() > 0 && (
                <>
                  {/* compact pagination on smaller screens */}
                  <div className="hidden xs:flex items-center">
                    {/* first page */}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => table.setPageIndex(0)}
                        isActive={table.getState().pagination.pageIndex === 0}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {/* show ellipsis if currentPage > 3 */}
                    {table.getState().pagination.pageIndex > 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* pages around current page */}
                    {Array.from({ length: table.getPageCount() }, (_, i) => {
                      // show current page and 1 page before/after
                      if (
                        i > 0 &&
                        i < table.getPageCount() - 1 &&
                        Math.abs(i - table.getState().pagination.pageIndex) <= 1
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => table.setPageIndex(i)}
                              isActive={
                                table.getState().pagination.pageIndex === i
                              }
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    {/* show ellipsis if currentPage < lastPage - 2 */}
                    {table.getState().pagination.pageIndex <
                      table.getPageCount() - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* last page */}
                    {table.getPageCount() > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                          }
                          isActive={
                            table.getState().pagination.pageIndex ===
                            table.getPageCount() - 1
                          }
                          className="cursor-pointer"
                        >
                          {table.getPageCount()}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                  </div>

                  {/* page indicator */}
                  <div className="flex items-center">
                    <Label className="text-sm font-medium mx-1">
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()}
                    </Label>
                  </div>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLast
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
