import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useProgramHeadProfile } from "@/context/ProgramHeadProfileContext";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Columns2,
  Eye,
  Copy,
  Search,
  X,
  Archive,
  UsersRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddProgramHeadModal from "@/components/AdminComponents/AddProgramHeadModal";
import AddUserBulkUpload from "@/components/AdminComponents/AddUserBulkUpload";


const handleCopyEmployeeNo = (employeeNo) => {
  if (!employeeNo) return toast.error("Employee No. not found");
  navigator.clipboard
    .writeText(employeeNo)
    .then(() => toast.success("Employee No. copied to clipboard"))
    .catch(() => toast.error("Failed to copy Employee No."));
};

const searchGlobalFilter = (row, columnId, filterValue) => {
  const id = row.original.id?.toLowerCase() || "";
  const email = row.original.email?.toLowerCase() || "";
  const fullName = `${row.original.firstName || ""} ${
    row.original.lastName || ""
  }`.toLowerCase();
  const search = filterValue.toLowerCase();
  return (
    id.includes(search) || email.includes(search) || fullName.includes(search)
  );
};

const createColumns = (handleArchiveUser, handleViewProgramHeadProfile) => [
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
        className="ml-4"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="ml-4"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    id: "Employee No.",
    accessorKey: "employeeNumber",
    header: "Employee No.",
    cell: ({ row }) => {
      const employeeNo = row.original.employeeNumber;
      return <div className="capitalize">{employeeNo || "N/A"}</div>;
    },
  },

  // photo column
  {
    id: "Photo",
    accessorKey: "photoURL",
    header: "Photo",
    cell: ({ row }) => {
      const photoURL = row.original.photoURL;
      const firstName = row.original.firstName || "";
      const lastName = row.original.lastName || "";
      const initials = (firstName.charAt(0) || "") + (lastName.charAt(0) || "");
      return (
        <Avatar className="w-10 h-10">
          <AvatarImage src={photoURL || initials} alt="Student Photo" />
          <AvatarFallback>{initials.toUpperCase() || "N/A"}</AvatarFallback>
        </Avatar>
      );
    },
  },

  {
    id: "name",
    accessorFn: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="mr-12"
      >
        Name <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="ml-3 capitalize">
        {`${row.original.firstName || ""} ${row.original.lastName || ""}` ||
          "N/A"}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="lowercase ml-3">{row.getValue("email") || "N/A"}</div>
    ),
  },

  {
    id: "Date Created",
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      if (!timestamp) return <div>-</div>;

      try {
        // convert timestamp to date, handles both Firestore Timestamps and date strings
        const date = timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

        // check if the created date is valid before formatting
        if (isNaN(date.getTime())) {
          return <div>Invalid Date</div>;
        }

        return <div>{format(date, "MMMM do, yyyy")}</div>;
      } catch (error) {
        return <div>Invalid Date</div>;
      }
    },
  },

  {
    id: "Last Updated",
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const timestamp = row.original.updatedAt;
      if (!timestamp) return <div>-</div>;

      try {
        // convert timestamp to date
        const date = timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

        // Check if the created date is valid before formatting
        if (isNaN(date.getTime())) {
          return <div>Invalid Date</div>;
        }

        return <div>{format(date, "MMMM do, yyyy")}</div>;
      } catch (error) {
        return <div>Invalid Date</div>;
      }
    },
  },

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
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      const [showArchiveDialog, setShowArchiveDialog] = useState(false);

      return (
        <>
          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 w-10 p-0 cursor-pointer"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">View More Actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleCopyEmployeeNo(user.employeeNumber)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2" /> Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleViewProgramHeadProfile(user)}
                  className="text-green-600 hover:text-green-700 focus:text-green-700 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4 text-green-600" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowArchiveDialog(true)}
                  className="text-amber-600 hover:text-amber-700 focus:text-amber-700 hover:bg-amber-50 focus:bg-amber-50 cursor-pointer"
                >
                  <Archive className="mr-2 h-4 w-4 text-amber-600" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>

          {/* Archive Confirmation Dialog */}
          <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Archive</DialogTitle>
                <DialogDescription>
                  Are you sure you want to archive the user{" "}
                  <strong>
                    "{user.firstName} {user.lastName}"
                  </strong>
                  ? This will set their account status to{" "}
                  <strong>inactive</strong>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowArchiveDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={() => {
                    handleArchiveUser(user);
                    setShowArchiveDialog(false);
                  }}
                  className="bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                >
                  Archive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];

export default function ProgramHeadsTable() {
  const [users, setUsers] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBatchArchiveDialog, setShowBatchArchiveDialog] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // navigate to student profile
  const navigate = useNavigate();
  // context to set selected student
  const { setSelectedProgramHead } = useProgramHeadProfile();
  // handle viewing student profile
  const handleViewProgramHeadProfile = (user) => {
    if (!user) {
      toast.error("User data not found");
      return;
    }
    setSelectedProgramHead(user);
    navigate(`/admin/program-heads/profile`);
  };

  const fetchActiveSession = useCallback(async () => {
    try {
      // Find the active academic year first
      const academicYearsRef = collection(db, "academic_years");
      const qAcademicYear = query(
        academicYearsRef,
        where("status", "==", "Active")
      );

      const yearSnapshot = await getDocs(qAcademicYear);

      if (yearSnapshot.empty) {
        setActiveSession({ id: null, name: "No Active Session" });
        setDepartments([]);
        return false;
      }

      const academicYearDoc = yearSnapshot.docs[0];
      const academicYearData = {
        id: academicYearDoc.id,
        ...academicYearDoc.data(),
      };

      // Find the active semester within that academic year's sub-collection
      const semestersRef = collection(
        db,
        "academic_years",
        academicYearData.id,
        "semesters"
      );
      const qSemester = query(semestersRef, where("status", "==", "Active"));

      const semesterSnapshot = await getDocs(qSemester);

      if (semesterSnapshot.empty) {
        setActiveSession({
          ...academicYearData,
          semesterName: "No Active Semester",
        });
        return false;
      }

      const semesterDoc = semesterSnapshot.docs[0];
      const semesterData = semesterDoc.data();
      const semesterId = semesterDoc.id;

      // Combine data from both documents into the activeSession state
      const sessionInfo = {
        id: academicYearData.id,
        acadYear: academicYearData.acadYear,
        semesterName: semesterData.semesterName,
        semesterId: semesterId,
      };

      setActiveSession(sessionInfo);
      return true;
    } catch (error) {
      console.error("Error fetching active session:", error);
      toast.error("No Active School Year", {
        description:
          "Please set a school year and semester as active in the School Year & Semester module.",
      });
      return false;
    }
  }, []);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const hasActiveSession = await fetchActiveSession();

      if (!hasActiveSession) {
        // Still proceed with fetching users regardless of active session status
        // await fetchUsers();
        setLoading(false);
      }
    };

    loadData();
  }, [fetchActiveSession]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const ref = collection(db, "users/program_head/accounts");
      const snap = await getDocs(ref);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        role: "program_head",
        ...doc.data(),
      }));
      setUsers(data);
    } catch (e) {
      toast.error("Failed to load program heads");
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleArchiveUser = async (user) => {
    if (!user?.id) {
      toast.error("Invalid user data");
      return false;
    }

    try {
      const userRef = doc(db, "users/program_head/accounts", user.id);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) throw new Error("User not found");

      const archiveRef = doc(db, "archive", user.id);
      await setDoc(archiveRef, {
        ...snapshot.data(),
        status: "inactive",
        archivedAt: new Date(),
      });
      await deleteDoc(userRef);
      toast.success(
        `User ${user.firstName} ${user.lastName} archived successfully`
      );
      await fetchUsers();
      return true;
    } catch (err) {
      toast.error("Archive failed");
      return false;
    }
  };

  const handleBatchArchive = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error("No users selected");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Show a loading toast
    const loadingToast = toast.loading(
      `Archiving ${selectedRows.length} users...`
    );

    // Process each selected user
    for (const row of selectedRows) {
      const user = row.original;
      const success = await handleArchiveUser(user);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Dismiss the loading toast
    toast.dismiss(loadingToast);

    // Show results
    if (successCount > 0) {
      toast.success(`Successfully archived ${successCount} users`);
    }
    if (failCount > 0) {
      toast.error(`Failed to archive ${failCount} users`);
    }

    // Clear selection
    table.resetRowSelection();

    // force re-fetch users to update the table
    if (successCount > 0) {
      const remainingUsers = users.filter(
        (user) => !selectedRows.some((row) => row.original.id === user.id)
      );
      setUsers(remainingUsers);
    }
  };

  const columns = createColumns(
    handleArchiveUser,
    handleViewProgramHeadProfile
  );
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    globalFilterFn: searchGlobalFilter,
  });

  if (loading) {
    return (
      <div className="w-full p-4 space-y-4">
        <div className="mb-4">
          {/* skeleton for title */}
          <Skeleton className="h-8 w-64" />
          {/* skeleton for subtitle */}
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add user button */}
          <Skeleton className="h-9 w-28" />
          {/* skeleton for export button */}
          <Skeleton className="h-9 w-28" />

          {/* skeleton for search box */}
          <Skeleton className="relative max-w-sm flex-1 h-9" />

          {/* skeleton for filter columns */}
          <Skeleton className="h-9 w-36 ml-2" />
        </div>

        {/* skeleton for table */}
        <div className="rounded-md border">
          {/* skeleton header row */}
          <div className="px-4">
            <div className="h-10 flex items-center">
              <div className="flex w-full items-center space-x-6 py-3">
                {/* skeletons for select */}
                <Skeleton className="h-5 w-5 rounded-sm" />
                {/* skeleton for photo */}
                <Skeleton className="h-4" style={{ width: "15%" }} />
                <Skeleton className="h-4 w-10" />

                {/* 6 flexible-width skeletons */}
                {Array(6)
                  .fill(0)
                  .map((_, colIndex) => {
                    const remainingWidths = [
                      "17%", // Name
                      "20%", // Email
                      "10%", // Date Created
                      "10%", // Last Updated
                      "5%", // Status
                      "5%", // Actions
                    ];
                    return (
                      <Skeleton
                        key={colIndex}
                        className="h-4"
                        style={{ width: remainingWidths[colIndex] }}
                      />
                    );
                  })}
              </div>
            </div>
          </div>

          {/* skeleton table rows */}
          <div>
            {Array(8)
              .fill(0)
              .map((_, rowIndex) => (
                <div key={rowIndex} className="border-t px-4">
                  <div className="flex w-full items-center space-x-6 py-3">
                    {/* skeletons for select */}
                    <Skeleton className="h-5 w-5 rounded-md" />
                    {/* skeleton for photo */}
                    <Skeleton className="h-4" style={{ width: "15%" }} />
                    <Skeleton className="h-10 w-10 rounded-full" />

                    {/* 6 flexible-width skeletons */}
                    {Array(6)
                      .fill(0)
                      .map((_, colIndex) => {
                        const remainingWidths = [
                          "17%", // Name
                          "20%", // Email
                          "10%", // Date Created
                          "10%", // Last Updated
                          "5%", // Status
                          "5%", // Actions
                        ];
                        return (
                          <Skeleton
                            key={colIndex}
                            className="h-4"
                            style={{ width: remainingWidths[colIndex] }}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* skeleton for footer/pagination */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-40" />

          <div className="flex flex-col items-start justify-end gap-4 py-4 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-end">
              <div className="flex items-center gap-2">
                {/* skeleton for rows per page */}
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="flex items-center gap-1">
                {/* skeleton for page btns */}
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-4 w-24" />
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
    <div className="w-full p-4 space-y-4">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Program Heads</h1>
          <p className="text-muted-foreground">
            Add, edit, or archive program heads available in the system.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 py-4">
        {/* add new account button */}
        <AddProgramHeadModal onUserAdded={fetchUsers} />

        <AddUserBulkUpload role="program_head" onUserAdded={fetchUsers} />

        {/* archive selected button */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
              className="text-amber-600 hover:text-amber-800 cursor-pointer"
            >
              <X />
              Clear selection
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={() => setShowBatchArchiveDialog(true)}
              className="bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
            >
              <Archive />
              Batch Archive
            </Button>
          </div>
        )}

        {/* search */}
        <div className="relative max-w-sm flex-1">
          {/* search icon */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Search users..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 max-w-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {/* clear button */}
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="p-1 hover:bg-gray-100 rounded-full mr-2 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-primary" />
              </button>
            )}
          </div>
        </div>

        {/* flter columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 cursor-pointer">
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
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full">
                      <UsersRound className="h-12 w-12 " />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">
                        No program heads found.
                      </p>
                      <p className="text-muted-foreground  text-sm mt-2">
                        Try adjusting your search or filters to find program
                        heads.
                      </p>
                    </div>
                  </div>
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

          {/* Batch Archive Dialog */}
          <Dialog
            open={showBatchArchiveDialog}
            onOpenChange={setShowBatchArchiveDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Batch Archive</DialogTitle>
                <DialogDescription>
                  Are you sure you want to archive{" "}
                  {table.getFilteredSelectedRowModel().rows.length} selected
                  users? This will set their account status to inactive.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowBatchArchiveDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={() => {
                    handleBatchArchive();
                    setShowBatchArchiveDialog(false);
                  }}
                  className="bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                >
                  <Archive /> Archive Users
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
