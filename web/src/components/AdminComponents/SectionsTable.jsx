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
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import AddSectionModal from "@/components/AdminComponents/AddSectionModal";
import AddSectionCard from "@/components/AdminComponents/AddSectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Check,
  Info,
  AlertTriangle,
  LibraryBig,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const createColumns = (handleEditYearLevel, handleDeleteYearLevel) => [
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
              <Button variant="ghost" className="h-12 w-12 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditedName(yearLevel.yearLevelName);
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

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Year Name
                  </Label>
                  <Select
                    value={editedName}
                    onValueChange={(value) => {
                      setEditedName(value);
                    }}
                    placeholder="e.g., 1st Year"
                  >
                    <SelectTrigger
                      id="yearLevelEditedSelect"
                      className="col-span-3 w-full"
                    >
                      <SelectValue placeholder="Select a year level" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <strong>{yearLevel.yearLevelName}</strong>"? This action
                  cannot be undone.
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

export default function SectionsTable() {
  const [yearLevels, setYearLevels] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // state to hold active academic year info
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  useEffect(() => {
    setLoading(true);

    // Define a variable to hold the listener for the year levels
    let unsubscribeYearLevels = () => {};

    // Find the active academic year first
    const academicYearsRef = collection(db, "academic_years");
    const qAcademicYear = query(
      academicYearsRef,
      where("status", "==", "Active")
    );

    const unsubscribeAcademicYear = onSnapshot(
      qAcademicYear,
      async (yearSnapshot) => {
        unsubscribeYearLevels();
        if (yearSnapshot.empty) {
          toast.error(
            "No active academic year found. Please set one to manage year levels."
          );
          setActiveSession({ id: null, name: "No Active Session" });
          setYearLevels([]);
          setLoading(false);
          return;
        }

        const academicYearDoc = yearSnapshot.docs[0];
        const academicYearData = {
          id: academicYearDoc.id,
          ...academicYearDoc.data(),
        };

        // find the active semester within that academic year's sub-collection
        const semestersRef = collection(
          db,
          "academic_years",
          academicYearData.id,
          "semesters"
        );
        const qSemester = query(semestersRef, where("status", "==", "Active"));

        try {
          const semesterSnapshot = await getDocs(qSemester);

          if (semesterSnapshot.empty) {
            toast.error(
              `No active semester found for the academic year ${academicYearData.acadYear}.`
            );
            setActiveSession({
              ...academicYearData,
              semesterName: "No Active Semester",
            }); // still show the year
            setYearLevels([]);
            setLoading(false);
            return;
          }

          const semesterDoc = semesterSnapshot.docs[0];
          const semesterData = semesterDoc.data();
          const semesterId = semesterDoc.id;

          // combine data from both documents into the activeSession state
          const sessionInfo = {
            id: academicYearData.id,
            acadYear: academicYearData.acadYear,
            semesterName: semesterData.semesterName, // data from the sub-collection
            semesterId: semesterId, // id of the semester document
          };
          setActiveSession(sessionInfo);

          // listen for year levels associated with the active academic year ID
          const yearLevelsQuery = collection(
            db,
            `academic_years/${academicYearData.id}/semesters/${semesterId}/year_levels`
          );

          unsubscribeYearLevels = onSnapshot(
            yearLevelsQuery,
            (yearLevelsSnapshot) => {
              const levels = yearLevelsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                //  make editing/deleting easier
                academicYearId: academicYearData.id,
                semesterId: semesterId
              }));

              const sortOrder = [
                "1st Year",
                "2nd Year",
                "3rd Year",
                "4th Year",
              ];
              levels.sort((a, b) => {
                const indexA = sortOrder.indexOf(a.yearLevelName);
                const indexB = sortOrder.indexOf(b.yearLevelName);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });

              setYearLevels(levels);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error("Error fetching active semester:", error);
          toast.error("Failed to load the active semester.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching active academic year:", error);
        toast.error("Failed to determine the active academic year.");
        setLoading(false);
      }
    );

    // unsubscribe from both listeners
    return () => {
      unsubscribeAcademicYear();
      unsubscribeYearLevels();
    };
  }, []);

  const handleEditYearLevel = async (yearLevel, newName) => {
  if (!newName.trim()) {
    toast.error("Year level name cannot be empty.");
    return;
  }

  if (!activeSession || !activeSession.id || !yearLevel.semesterId) {
    toast.error("Missing required references to update year level.");
    return;
  }

  // Path to the specific year level using the hierarchical structure
  const yearLevelPath = `academic_years/${activeSession.id}/semesters/${yearLevel.semesterId}/year_levels`;
  
  // Check if the new name already exists in this semester
  const yearLevelsRef = collection(db, yearLevelPath);
  const q = query(
    yearLevelsRef,
    where("yearLevelName", "==", newName.trim())
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty && querySnapshot.docs[0].id !== yearLevel.id) {
    toast.error(`Year level "${newName.trim()}" already exists in this semester.`);
    return;
  }

  // Reference to the specific year level document
  const yearLevelRef = doc(db, yearLevelPath, yearLevel.id);
  
  try {
    await updateDoc(yearLevelRef, {
      yearLevelName: newName.trim(),
      updatedAt: serverTimestamp(),
    });
    toast.success("Year level updated successfully.");
  } catch (error) {
    console.error("Error updating year level:", error);
    toast.error("Failed to update year level.");
  }
};

  const handleDeleteYearLevel = async (yearLevel) => {
  if (!activeSession || !activeSession.id || !yearLevel.semesterId) {
    toast.error("Missing required references to delete year level.");
    return;
  }

  // Path to the specific year level using the hierarchical structure
  const yearLevelPath = `academic_years/${activeSession.id}/semesters/${yearLevel.semesterId}/year_levels`;
  
  // Reference to the specific year level document
  const yearLevelRef = doc(db, yearLevelPath, yearLevel.id);
  
  try {
    await deleteDoc(yearLevelRef);
    toast.success(`Year level "${yearLevel.yearLevelName}" deleted successfully.`);
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
        {/* skeleton for year levels active session */}
        <div>
          <Skeleton className="h-18 w-full" />
        </div>

        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add user button */}
          {/* <Skeleton className="h-9 w-28" /> */}

          {/* skeleton for search box */}
          {/* <Skeleton className="relative max-w-sm flex-1 h-9" /> */}

          {/* skeleton for filter columns */}
          {/* <Skeleton className="h-9 w-36 ml-auto" /> */}
        </div>

        {/* skeleton for card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-4 w-16 mt-1" />
                <div className="space-y-2 pt-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
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

  const isNoActiveSession = activeSession && !activeSession.id;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Sections</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete sections available in the system.
          </p>
        </div>
      </div>

      {/* year levels active session */}
      <div className="mb-4">
        {loading ? (
          <div className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ) : isNoActiveSession ? (
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-8 w-8 mt-2 text-yellow-600" />
              <div>
                <p className="font-semibold">No Active Academic Year</p>
                <p className="text-sm text-yellow-700">
                  Please go to the Academic Year module and set an active
                  session to manage year levels.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-sidebar-ring" />
              <div>
                <p className="font-normal ">
                  Sections for Active Academic Year and Semester
                </p>
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} | {activeSession.semesterName}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* <div className="flex items-center py-4 gap-2">
        add year level */}
      {/* <AddSectionModal
          activeSession={activeSession}
          disabled={isNoActiveSession}
        />
      </div> */}

      <div className="w-full">
        {yearLevels.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {yearLevels.map((yearLevel) => (
              <AddSectionCard
                key={yearLevel.id}
                yearLevel={yearLevel}
                activeSession={activeSession}
              />
            ))}
          </div>
        ) : (
          // Empty state - when no year levels
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
              <LibraryBig className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No sections found.</p>
              <p className="text-sm text-muted-foreground">
                Year levels should be added first to manage sections.
              </p>
            </CardContent>
          </Card>
        )}
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
