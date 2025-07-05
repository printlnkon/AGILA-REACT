import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import AddAcademicYearModal from "@/components/AdminComponents/AddAcademicYearModal";
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
  Columns2,
  Search,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Check,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const createColumns = (
  handleSetAsActive,
  handleDeleteAcademicYear,
  handleEditAcademicYear,
  activatingYearId
) => [
  // academic year column
  {
    id: "Academic Year",
    accessorKey: "acadYear",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Academic Year
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="ml-4">{row.getValue("Academic Year")}</div>;
    },
  },

  // date created column
  {
    id: "Date Created",
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      if (!timestamp) return <div>-</div>;

      // Convert Firebase timestamp to date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{format(date, "MMMM do, yyyy")}</div>;
    },
  },

  // date updated column
  {
    id: "Last Updated",
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const timestamp = row.original.updatedAt;
      if (!timestamp) return <div>-</div>;

      // Convert Firebase timestamp to date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{format(date, "MMMM do, yyyy")}</div>;
    },
  },

  // status column
  {
    accessorKey: "status",
    header: "Status",

    cell: ({ row }) => {
      const status = row.getValue("status");
      const year = row.original;
      const isActivating = activatingYearId === year.id;

      if (isActivating) {
        return (
          <div className="flex items-center">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            <span>Activating...</span>
          </div>
        );
      }

      const statusConfig = {
        Active: {
          variant: "default",
          className: "bg-green-600 text-white",
        },
        Archived: {
          variant: "default",
          className: "bg-red-600 text-white",
        },
        Upcoming: {
          variant: "outline",
          className: "bg-blue-900 text-white",
        },
      };

      // Get the config for the current status, or fallback to 'upcoming'
      const config = statusConfig[status] || statusConfig.Upcoming;

      return (
        <Badge variant={config.variant} className={config.className}>
          {status}
        </Badge>
      );
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const year = row.original;
      const isActive = year.status === "Active";
      const isActivating = activatingYearId === year.id;
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [editedAcadYear, setEditedAcadYear] = useState(year.acadYear);
      
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isActivating}
              >
                <span className="sr-only">Open menu</span>
                {isActivating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-green-600 hover:text-green-700 focus:text-green-700 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                onClick={() => handleSetAsActive(year)}
                disabled={isActive || isActivating}
              >
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Set as Active
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                onClick={() => {
                  setEditedAcadYear(year.acadYear);
                  setShowEditDialog(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                disabled={isActive}
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete this academic year
                  "<strong>{year.acadYear}</strong>"? This action cannot be
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
                    handleDeleteAcademicYear(year);
                    setShowDeleteDialog(false);
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 /> Delete Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Confirmation Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-blue-900">
                  Edit Academic Year
                </DialogTitle>
                <DialogDescription>
                  Make changes to the academic year. Click save when you're
                  done.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={editedAcadYear}
                  onChange={(e) => setEditedAcadYear(e.target.value)}
                  placeholder="e.g., S.Y - 202X-202X"
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
                    handleEditAcademicYear(year, editedAcadYear);
                    setShowEditDialog(false);
                  }}
                  className="cursor-pointer bg-blue-900 hover:bg-blue-700"
                >
                  <Check /> Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];

export default function AcademicYear() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingYearId, setActivatingYearId] = useState(null);
  const [sorting, setSorting] = useState([
    { id: "status", desc: false },
    { id: "Academic Year", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  useEffect(() => {
    const q = query(collection(db, "academic_years"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const years = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAcademicYears(years);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching academic years:", error);
        toast.error("Failed to load academic years. Check permissions.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteAcademicYear = async (yearToDelete) => {
    if (!yearToDelete || !yearToDelete.id) {
      toast.error("Invalid academic year data.");
      return;
    }
    if (yearToDelete.status === "Active") {
      toast.error(
        "Cannot delete an active academic year. Set another year as active first."
      );
      return;
    }
    try {
      const batch = writeBatch(db);

      // get and delete all semesters in the subcollection
      const semestersColRef = collection(
        db,
        "academic_years",
        yearToDelete.id,
        "semesters"
      );
      const semestersSnapshot = await getDocs(semestersColRef);
      semestersSnapshot.forEach((semesterDoc) => {
        batch.delete(semesterDoc.ref);
      });

      // delete the academic year document itself
      const yearRef = doc(db, "academic_years", yearToDelete.id);
      batch.delete(yearRef);

      // commit the batch
      await batch.commit();

      toast.success(
        `Academic Year "${yearToDelete.acadYear}" and all its semesters have been permanently deleted.`
      );
    } catch (error) {
      console.error("Error deleting academic year:", error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleEditAcademicYear = async (yearToEdit, newAcadYear) => {
    if (!yearToEdit || !yearToEdit.id) {
      toast.error("Invalid academic year data.");
      return;
    }
    if (!newAcadYear || newAcadYear.trim() === "") {
      toast.error("Academic year cannot be empty.");
      return;
    }

    const yearFormat = /^S\.Y - \d{4}-\d{4}$/;
    if (!yearFormat.test(newAcadYear)) {
      toast.error("Invalid format. Please use the format 'S.Y - YYYY-YYYY'.");
      return;
    }

    const years = newAcadYear.split(" - ")[1].split("-");
    const startYear = parseInt(years[0]);
    const endYear = parseInt(years[1]);

    if (endYear !== startYear + 1) {
      toast.error(
        "Invalid year range. The end year must be one year after the start year (e.g., S.Y - 2025-2026)."
      );
      return;
    }

    // check if the academic year already exists
    const checkExistingYear = query(
      collection(db, "academic_years"),
      where("acadYear", "==", newAcadYear)
    );
    const querySnapshot = await getDocs(checkExistingYear);
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      if (existingDoc.id !== yearToEdit.id) {
        toast.error("An academic year with this name already exists.");
        return;
      }
    }

    const yearRef = doc(db, "academic_years", yearToEdit.id);

    try {
      await updateDoc(yearRef, {
        acadYear: newAcadYear,
        updatedAt: new Date(),
      });
      toast.success(`Academic Year updated to "${newAcadYear}".`);
    } catch (error) {
      console.error("Error updating academic year:", error);
      toast.error(`Update failed: ${error.message}`);
    }
  };

  const handleSetAsActive = async (yearToActivate) => {
    if (yearToActivate.status === "Active") {
      toast.info("This academic year is already active.");
      return;
    }

    setActivatingYearId(yearToActivate.id);
    const batch = writeBatch(db);
    const currentActiveYear = academicYears.find(
      (year) => year.status === "Active"
    );

    if (currentActiveYear) {
      const prevActiveRef = doc(db, "academic_years", currentActiveYear.id);
      batch.update(prevActiveRef, {
        status: "Archived",
        updatedAt: new Date(),
      });
    }

    const newActiveRef = doc(db, "academic_years", yearToActivate.id);
    batch.update(newActiveRef, { status: "Active", updatedAt: new Date() });

    try {
      await batch.commit();
      toast.success(`Academic Year ${yearToActivate.acadYear} is now active.`);
    } catch (error) {
      console.error("Error setting active year: ", error);
      toast.error("Failed to set active year. Please try again.");
    } finally {
      setActivatingYearId(null);
    }
  };

  const columns = createColumns(
    handleSetAsActive,
    handleDeleteAcademicYear,
    handleEditAcademicYear,
    activatingYearId
  );

  const table = useReactTable({
    data: academicYears,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    enableSortingRemoval: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="flex items-center py-4 gap-2">
          <Skeleton className="h-10 w-36" />
          <div className="relative flex-1">
            <Skeleton className="h-10 max-w-sm" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-6 w-32" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-6 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-6 w-28" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-6 w-28" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-6 w-24" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-6 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-2/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-2/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-2/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
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
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-blue-900">
          Manage Academic Year
        </h1>
      </div>

      <div className="flex items-center py-4 gap-2">
        <AddAcademicYearModal className="cursor-pointer" />
        {/* search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by academic year..."
            value={table.getColumn("Academic Year")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table
                .getColumn("Academic Year")
                ?.setFilterValue(event.target.value)
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
