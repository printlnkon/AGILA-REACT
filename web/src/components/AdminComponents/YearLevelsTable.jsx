import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import AddYearLevelModal from "@/components/AdminComponents/AddYearLevelModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Columns2,
  ChevronDown,
  BookOpen,
  Check,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createColumns = (handleEditYearLevel, handleDeleteYearLevel) => [
  {
    id: "Year Level",
    accessorKey: "name",
    header: <div className="ml-4">Year Level</div>,
    cell: ({ row }) => (
      <div className="ml-4 font-medium">{row.getValue("Year Level")}</div>
    ),
  },
  {
    id: "Date Created",
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      if (!timestamp) return <div>-</div>;
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{format(date, "MMMM d, yyyy")}</div>;
    },
  },
  {
    id: "Last Updated",
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const timestamp = row.original.updatedAt;
      if (!timestamp) return <div>-</div>;
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{format(date, "MMMM d, yyyy")}</div>;
    },
  },

  // status column
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") || "active";
      const isActive = status === "active";
      return (
        <Badge
          variant={isActive ? "default" : "destructive"}
          className={
            isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const yearLevel = row.original;
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [editedName, setEditedName] = useState(yearLevel.name);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditedName(yearLevel.name);
                  setShowEditDialog(true);
                }}
                className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-blue-600" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                <span>Delete Permanently</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Year Level</DialogTitle>
                <DialogDescription>
                  Make changes to the year level name.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="e.g., Grade 1"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleEditYearLevel(yearLevel, editedName);
                    setShowEditDialog(false);
                  }}
                  className="bg-primary cursor-pointer"
                >
                  <Check />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the year level "
                  <strong>{yearLevel.name}</strong>"? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteYearLevel(yearLevel);
                    setShowDeleteDialog(false);
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 />
                  Delete Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];

export default function YearLevelsTable() {
  const [yearLevels, setYearLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  useEffect(() => {
    const q = query(collection(db, "year_levels"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const levels = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sortOrder = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

        //  sort oder based on sortOrder array
        levels.sort((a, b) => {
          const indexA = sortOrder.indexOf(a.name);
          const indexB = sortOrder.indexOf(b.name);

          // If an item is not in the sortOrder array, place it at the end
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        });

        setYearLevels(levels);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching year levels:", error);
        toast.error("Failed to load year levels.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleEditYearLevel = async (yearLevel, newName) => {
    if (!newName.trim()) {
      toast.error("Year level name cannot be empty.");
      return;
    }

    const yearLevelsRef = collection(db, "year_levels");
    const q = query(
      yearLevelsRef,
      where("name_lowercase", "==", newName.trim().toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty && querySnapshot.docs[0].id !== yearLevel.id) {
      toast.error(`Year level "${newName.trim()}" already exists.`);
      return;
    }

    const yearLevelRef = doc(db, "year_levels", yearLevel.id);
    try {
      await updateDoc(yearLevelRef, {
        name: newName.trim(),
        name_lowercase: newName.trim().toLowerCase(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Year level updated successfully.");
    } catch (error) {
      console.error("Error updating year level:", error);
      toast.error("Failed to update year level.");
    }
  };

  const handleDeleteYearLevel = async (yearLevel) => {
    const yearLevelRef = doc(db, "year_levels", yearLevel.id);
    try {
      await deleteDoc(yearLevelRef);
      toast.success(`Year level "${yearLevel.name}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting year level:", error);
      toast.error("Failed to delete year level.");
    }
  };

  const columns = createColumns(handleEditYearLevel, handleDeleteYearLevel);

  const table = useReactTable({
    data: yearLevels,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add user button */}
          <Skeleton className="h-9 w-28" />

          {/* skeleton for search box */}
          <Skeleton className="relative max-w-sm flex-1 h-9" />

          {/* skeleton for filter columns */}
          <Skeleton className="h-9 w-36 ml-auto" />
        </div>

        {/* skeleton for table */}
        <div className="rounded-md border">
          <div className="px-4">
            <div className="h-10 flex items-center">
              {/* skeleton header row */}
              <div className="flex w-full space-x-4 py-3">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-4"
                      style={{
                        width:
                          i === 0
                            ? "5%"
                            : i === 5
                            ? "10%"
                            : i === 1
                            ? "25%"
                            : i === 2
                            ? "25%"
                            : "15%",
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* skeleton table rows */}
          <div>
            {Array(8)
              .fill(0)
              .map((_, rowIndex) => (
                <div key={rowIndex} className="border-t px-4">
                  <div className="flex w-full space-x-4 py-4">
                    {Array(6)
                      .fill(0)
                      .map((_, colIndex) => (
                        <Skeleton
                          key={colIndex}
                          className="h-4"
                          style={{
                            width:
                              colIndex === 0
                                ? "5%"
                                : colIndex === 5
                                ? "10%"
                                : colIndex === 1
                                ? "25%"
                                : colIndex === 2
                                ? "25%"
                                : "15%",
                          }}
                        />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* skeleton for footer/pagination */}
        <div className="flex justify-end items-center">
          <div className="flex flex-col items-start justify-end gap-4 py-4 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-end">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Year Levels</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete year levels available in the system.
          </p>
        </div>
      </div>

      <div className="flex items-center py-4 gap-2">
        {/* add year level */}
        <AddYearLevelModal />
        {/* search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by year level..."
            value={table.getColumn("Year Level")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("Year Level")?.setFilterValue(event.target.value)
            }
            className="pl-10 max-w-sm"
          />
        </div>
        {/* filter columns */}
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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No year levels found.</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Add Year Level" to get started or refine your
                      search.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* pagination */}
      {/* if ever gagamitin ko pa tong sa babang code, i-change ko dapat yung justify-end to justify-between */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 py-4">
        {/* <div className="text-sm text-muted-foreground whitespace-nowrap">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} results
        </div> */}

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
                className="h-8 w-18 cursor-pointer"
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
