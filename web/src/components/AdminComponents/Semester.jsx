import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  Columns2,
  MoreHorizontal,
  Pencil,
  Check,
  Trash2,
  CalendarDays,
} from "lucide-react";
import AddSemesterModal from "@/components/AdminComponents/AddSemesterModal";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
const createColumns = (
  handleSetStatus, 
  handleEditSemester,
  handleDeleteSemester) => [
  // semester
  {
    accessorKey: "semesterName",
    header: ({ header }) => {
      return (
        <>
          <div className="ml-4">Semester</div>
        </>
      );
    },
    cell: ({ row }) => (
      <div className="ml-4 font-medium">{row.getValue("semesterName")}</div>
    ),
  },

  // start date column
  {
    id: "Start Date",
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const timestamp = row.original.startDate;
      if (!timestamp) return <div>-</div>;

      // Convert Firebase timestamp to date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  // end date column
  {
    id: "End Date",
    accessorKey: "endDate",
    header: "End Date",
     cell: ({ row }) => {
      const timestamp = row.original.endDate;
      if (!timestamp) return <div>-</div>;

      // Convert Firebase timestamp to date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  // status column
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
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
  // actions column
   {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const sem = row.original;
      const isActive = sem.status === "Active";
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [editedSemester, setEditedSemester] = useState({
        semesterName: sem.semesterName,
        startDate: sem.startDate,
        endDate: sem.endDate,
      });

      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setEditedSemester((prev) => ({ ...prev, [id]: value }));
      };

      return (
        <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-green-600 hover:text-green-700 focus:text-green-700 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                  onClick={() => handleSetStatus(sem)}
                  disabled={isActive}
                >
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Set as Active
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                  onClick={() => setShowEditDialog(true)}
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
          <Dialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the semester "
                  <strong>{sem.semesterName}</strong>"? This action cannot be
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
                    handleDeleteSemester(sem);
                    setShowDeleteDialog(false);
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Semester</DialogTitle>
                <DialogDescription>
                  Make changes to the semester details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="semesterName" className="text-right">
                    Semester
                  </Label>
                  <Input
                    id="semesterName"
                    value={editedSemester.semesterName}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={editedSemester.startDate}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={editedSemester.endDate}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
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
                    handleEditSemester(sem, editedSemester);
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

export default function Semester() {
  const [activeAcadYear, setActiveAcadYear] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const fetchActiveAcademicYear = useCallback(async () => {
    try {
      const q = query(
        collection(db, "academic_years"),
        where("status", "==", "Active")
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const acadYearDoc = querySnapshot.docs[0];
        setActiveAcadYear({ id: acadYearDoc.id, ...acadYearDoc.data() });
      } else {
        setActiveAcadYear(null);
      }
    } catch (error) {
      console.error("Error fetching active academic year: ", error);
      toast.error("Failed to fetch active academic year.");
    }
  }, []);

  const fetchSemesters = useCallback(async () => {
    if (!activeAcadYear) {
      setSemesters([]);
      return;
    }
    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        activeAcadYear.id,
        "semesters"
      );
      const q = query(semestersColRef);
      const semesterSnapshot = await getDocs(q);
      const semesterList = semesterSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSemesters(semesterList);
    } catch (error) {
      console.error("Error fetching semesters: ", error);
      toast.error("Failed to fetch semesters.");
    } finally {
      setLoading(false);
    }
  }, [activeAcadYear]);

  useEffect(() => {
    fetchActiveAcademicYear();
  }, [fetchActiveAcademicYear]);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);


  const handleSetStatus = async (semesterToActivate) => {
    if (!activeAcadYear) return;

    const batch = writeBatch(db);
    semesters.forEach((sem) => {
      const semRef = doc(
        db,
        "academic_years",
        activeAcadYear.id,
        "semesters",
        sem.id
      );
      if (sem.id === semesterToActivate.id) {
        batch.update(semRef, { status: "Active" });
      } else if (sem.status === "Active") {
        batch.update(semRef, { status: "Archived" });
      }
    });

    try {
      await batch.commit();
      toast.success(`"${semesterToActivate.name}" is now the active semester.`);
      fetchSemesters(); // Refresh the list
    } catch (error) {
      console.error("Error updating semester status: ", error);
      toast.error("Failed to update semester status.");
      setLoading(false);
    }
  };

  const handleEditSemester = async (semesterToEdit, newData) => {
    if (
      !newData.semesterName ||
      !newData.startDate ||
      !newData.endDate
    ) {
      toast.error("Please fill out all fields.");
      return;
    }

    const semRef = doc(
      db,
      "academic_years",
      activeAcadYear.id,
      "semesters",
      semesterToEdit.id
    );

    try {
      await updateDoc(semRef, newData);
      toast.success("Semester updated successfully.");
      fetchSemesters();
    } catch (error) {
      console.error("Error updating semester: ", error);
      toast.error("Failed to update semester.");
    }
  };

  const handleDeleteSemester = async (semesterToDelete) => {
    if (semesterToDelete.status === "Active") {
      toast.error("Cannot delete an active semester.");
      return;
    }

    const semRef = doc(
      db,
      "academic_years",
      activeAcadYear.id,
      "semesters",
      semesterToDelete.id
    );

    try {
      await deleteDoc(semRef);
      toast.success("Semester deleted successfully.");
      fetchSemesters();
    } catch (error) {
      console.error("Error deleting semester: ", error);
      toast.error("Failed to delete semester.");
    }
  };

  const columns = createColumns(
    handleSetStatus,
    handleEditSemester,
    handleDeleteSemester
  );

  const table = useReactTable({
    data: semesters,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col p-6">
        {/* header skeleton */}
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>

        {/* controls skeleton */}
        <div className="flex items-center gap-2 py-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="ml-auto h-10 w-40" />
        </div>

        {/* table skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-5 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-20" />
                </TableHead>
                <TableHead>
                  <div className="flex justify-end">
                    <Skeleton className="h-5 w-20" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="ml-4">
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* pagination skeleton */}
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
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Manage Semester</h1>
          {activeAcadYear ? (
            <p className="text-md text-gray-600">
              For Academic Year:{" "}
              <span className="font-semibold">{activeAcadYear.acadYear}</span>
            </p>
          ) : (
            <p className="text-md text-red-600">
              No active academic year found. Please set one first.
            </p>
          )}
        </div>
      </div>

      {/* search */}
      <div className="flex items-center py-4 gap-2">
        <AddSemesterModal
          activeAcadYear={activeAcadYear}
          onSemesterAdded={fetchSemesters}
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by semester name..."
            value={table.getColumn("semesterName")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table
                .getColumn("semesterName")
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
           {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="ml-4">
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
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
                  {activeAcadYear
                    ? "No semesters found. Add one to get started."
                    : "No active academic year selected."}
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
