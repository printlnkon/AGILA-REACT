import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ChevronDown,
  Columns2,
  Search,
  UsersRound,
  SquarePen,
  X,
  MoreHorizontal,
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
  PaginationEllipsis,
} from "@/components/ui/pagination";
import AddCourseSectionModal from "@/components/AdminComponents/AddCourseSectionModal";

export const createColumns = (handleOpenModal) => [

  // actions column
  {
    header: "Actions",  
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <Button
          onClick={() => handleOpenModal(student)}
          size="sm"
          className="cursor-pointer"
        >
          <SquarePen />
          Assign
        </Button>
      );
    },
  },
];

export default function CourseSectionTable() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    course: "",
    yearLevel: "",
    section: "",
  });

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const fetchActiveSession = useCallback(async () => {
    try {
      const acadYearQuery = query(
        collection(db, "academic_years"),
        where("status", "==", "Active")
      );
      const acadYearSnapshot = await getDocs(acadYearQuery);

      if (acadYearSnapshot.empty) {
        setActiveSession(null);
        return;
      }

      const acadYearDoc = acadYearSnapshot.docs[0];
      const acadYearData = { id: acadYearDoc.id, ...acadYearDoc.data() };

      const semesterQuery = query(
        collection(db, "academic_years", acadYearData.id, "semesters"),
        where("status", "==", "Active")
      );
      const semesterSnapshot = await getDocs(semesterQuery);

      if (semesterSnapshot.empty) {
        setActiveSession({ ...acadYearData, semesterId: null });
        return;
      }

      const semesterDoc = semesterSnapshot.docs[0];
      setActiveSession({
        ...acadYearData,
        semesterId: semesterDoc.id,
        ...semesterDoc.data(),
      });
    } catch (error) {
      console.error("Error fetching active session:", error);
      toast.error("Failed to fetch active session.");
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const studentsCollectionRef = collection(db, "users/student/accounts");
      const data = await getDocs(studentsCollectionRef);
      const studentData = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentData);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch student data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchActiveSession();
  }, [fetchStudents, fetchActiveSession]);

  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setAssignmentData({
      course: student.course || "",
      yearLevel: student.yearLevel || "",
      section: student.section || "",
    });
    setIsModalOpen(true);
  };

  const handleSelectChange = (id, value) => {
    setAssignmentData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAssign = async () => {
    if (!selectedStudent) return;

    try {
      const studentDocRef = doc(
        db,
        "users/student/accounts",
        selectedStudent.id
      );
      await updateDoc(studentDocRef, {
        course: assignmentData.course,
        yearLevel: assignmentData.yearLevel,
        section: assignmentData.section,
      });

      toast.success(
        `Successfully assigned ${selectedStudent.firstName} ${selectedStudent.lastName}.`
      );
      setIsModalOpen(false);
      setSelectedStudent(null);
      fetchStudents(); // Refresh data
    } catch (error) {
      console.error("Error assigning student:", error);
      toast.error("Failed to assign student. Please try again.");
    }
  };

  const columns = createColumns(handleOpenModal);
  const table = useReactTable({
    data: students,
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

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add user button */}
          <Skeleton className="h-9 w-28" />

          {/* skeleton for search box */}
          <Skeleton className="relative max-w-sm flex-1 h-9" />

          {/* skeleton for filter columns */}
          <Skeleton className="h-9 w-36 ml-2" />
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
          {/* <Skeleton className="h-4 w-40" /> */}

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
          <h1 className="text-2xl font-bold">Manage Course and Section</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 py-4">
        {/* search */}
          <AddCourseSectionModal activeSession={activeSession} />
        <div className="relative max-w-sm flex-1">
          {/* search icon */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student no..."
            value={table.getColumn("Student No.")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("Student No.")?.setFilterValue(event.target.value)
            }
            className="pl-10 max-w-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {table.getColumn("Student No.")?.getFilterValue() && (
              <button
                onClick={() =>
                  table.getColumn("Student No.")?.setFilterValue("")
                }
                className="p-1 mr-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4 text-primary" />
              </button>
            )}
          </div>

          {/* filter columns */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 cursor-pointer">
              <Columns2 /> Filter Columns
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
