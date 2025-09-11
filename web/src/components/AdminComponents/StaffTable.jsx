import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/api/firebase";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
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
  UserRoundSearch,
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
import { useAcademicHeadProfile } from "@/context/AcademicHeadProfileContext";
import { useProgramHeadProfile } from "@/context/ProgramHeadProfileContext";
import { useTeacherProfile } from "@/context/TeacherProfileContext";
import AddStaffAccountModal from "@/components/AdminComponents/AddStaffAccountModal";

// Action handlers
const handleCopyEmployeeNumber = (employeeNumber) => {
  if (!employeeNumber) {
    toast.error("Employee Number not found");
    return;
  }
  navigator.clipboard
    .writeText(employeeNumber)
    .then(() => {
      toast.success("Employee Number copied to clipboard");
    })
    .catch(() => {
      toast.error("Failed to copy Employee Number");
    });
};

const searchGlobalFilter = (row, columnId, filterValue) => {
  const employeeNumber = row.original.employeeNumber?.toLowerCase() || "";
  const email = row.original.email?.toLowerCase() || "";
  const firstName = row.original.firstName?.toLowerCase() || "";
  const lastName = row.original.lastName?.toLowerCase() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const role = row.original.role?.toLowerCase() || "";
  const department = row.original.departmentName?.toLowerCase() || "";

  const search = filterValue.toLowerCase();

  return (
    employeeNumber.includes(search) ||
    email.includes(search) ||
    fullName.includes(search) ||
    role.includes(search) ||
    department.includes(search)
  );
};

const createColumns = (handleArchiveUser, handleViewStaffProfile) => [
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

  // employee no. column
  {
    id: "Employee No.",
    accessorKey: "employeeNumber",
    header: "Employee No.",
    cell: ({ row }) => {
      const employeeNo = row.original.employeeNumber;
      return <div className="capitalize">{employeeNo || "N/A"}</div>;
    },
  },
  // role column
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("role") || "N/A"}</div>,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
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
          <AvatarImage src={photoURL || initials} alt="Staff Photo" />
          <AvatarFallback>{initials.toUpperCase() || "N/A"}</AvatarFallback>
        </Avatar>
      );
    },
  },

  // name column
  {
    id: "name",
    accessorFn: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="mr-12"
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const firstName = row.original.firstName || "";
      const lastName = row.original.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return <div className="ml-3 capitalize">{fullName || "N/A"}</div>;
    },
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
    cell: ({ row }) => (
      <div className="lowercase ml-3">{row.getValue("email") || "N/A"}</div>
    ),
  },

  // department column
  {
    id: "department",
    accessorKey: "departmentName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Department
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="ml-3">{row.original.departmentName || "N/A"}</div>
    ),
  },

  // date created
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
  // last updated
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

  // actions column
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
                  onClick={() => handleCopyEmployeeNumber(user.employeeNumber)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleViewStaffProfile(user)}
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

export default function StaffTable() {
  const [staff, setStaff] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBatchArchiveDialog, setShowBatchArchiveDialog] = useState(false);
  const [roleFilter, setRoleFilter] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // view profile contexts
  const { setSelectedAcademicHead } = useAcademicHeadProfile();
  const { setSelectedProgramHead } = useProgramHeadProfile();
  const { setSelectedTeacher } = useTeacherProfile();

  // navigate to staff profile
  const navigate = useNavigate();

  // handle viewing staff profile
  const handleViewStaffProfile = (user) => {
    if (!user) {
      toast.error("User data not found");
      return;
    }

    // navigate to the appropriate pofile page based on role
    switch (user.role) {
      case "Academic Head":
        setSelectedAcademicHead(user);
        navigate(`/admin/academic-heads/profile`, {
          state: { userId: user.id },
        });
        break;
      case "Program Head":
        setSelectedProgramHead(user);
        navigate(`/admin/program-heads/profile`, {
          state: { userId: user.id },
        });
        break;
      case "Teacher":
        setSelectedTeacher(user);
        navigate(`/admin/teachers/profile`, { state: { userId: user.id } });
        break;
      default:
        toast.error(`Cannot view profile for unknown role: ${user.role}`);
        return;
    }
  };

  const handleUserAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchStaff();
  };

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      // Arrays to hold staff from different collections
      let allStaff = [];

      // Fetch Academic Heads
      const academicHeadRef = collection(db, "users/academic_head/accounts");
      const academicHeadSnapshot = await getDocs(academicHeadRef);
      const academicHeadData = academicHeadSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: "Academic Head",
          status: data.status || "active",
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          ...data,
        };
      });
      allStaff = [...allStaff, ...academicHeadData];

      // Fetch Program Heads
      const programHeadRef = collection(db, "users/program_head/accounts");
      const programHeadSnapshot = await getDocs(programHeadRef);
      const programHeadData = programHeadSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: "Program Head",
          status: data.status || "active",
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          ...data,
        };
      });
      allStaff = [...allStaff, ...programHeadData];

      // Fetch Teachers
      const teacherRef = collection(db, "users/teacher/accounts");
      const teacherSnapshot = await getDocs(teacherRef);
      const teacherData = teacherSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          role: "Teacher",
          status: data.status || "active",
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          ...data,
        };
      });
      allStaff = [...allStaff, ...teacherData];

      if (allStaff.length === 0) {
        setError("No staff found.");
      }

      setStaff(allStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setError(
        "Failed to load staff. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [refreshTrigger]);

  const handleArchiveUser = async (user) => {
    if (!user || !user.id || !user.role) {
      toast.error("Invalid user data");
      console.error("Missing required user data:", user);
      return false;
    }

    try {
      // matches the collection path in firestore based on role
      let rolePath;
      switch (user.role) {
        case "Academic Head":
          rolePath = "academic_head";
          break;
        case "Program Head":
          rolePath = "program_head";
          break;
        case "Teacher":
          rolePath = "teacher";
          break;
        default:
          toast.error(`Unknown role: ${user.role}`);
          return false;
      }

      // reference to the user document
      const userPath = `users/${rolePath}/accounts`;
      console.log("Looking for user document at path:", userPath);

      const userDocRef = doc(db, userPath, user.id);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        console.error("User document not found at:", userPath, user.id);
        toast.error("User data not found.");
        return false;
      }

      const userData = userSnap.data();

      // create archive document
      const archiveRef = doc(db, "archive", user.id);
      await setDoc(archiveRef, {
        ...userData,
        role: user.role,
        id: user.id,
        status: "inactive",
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        archivedAt: new Date(),
      });

      // delete from original collection
      await deleteDoc(userDocRef);

      toast.success(
        `User ${user.firstName} ${user.lastName} archived successfully`
      );

      setStaff((currentStaff) => currentStaff.filter((s) => s.id !== user.id));
      return true;
    } catch (error) {
      console.error("Error archiving user:", error);
      toast.error(`Archive failed: ${error.message}`);
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
      const remainingStaff = staff.filter(
        (user) => !selectedRows.some((row) => row.original.id === user.id)
      );
      setStaff(remainingStaff);
    }
  };

  const handleRoleFilterChange = (selectedRoles) => {
    if (selectedRoles.length === 0) {
      // If no roles selected, clear the filter
      table.getColumn("role")?.setFilterValue(undefined);
      setRoleFilter([]);
    } else {
      // Set the filter with selected roles
      table.getColumn("role")?.setFilterValue(selectedRoles);
      setRoleFilter(selectedRoles);
    }
  };

  const columns = createColumns(handleArchiveUser, handleViewStaffProfile);
  const table = useReactTable({
    data: staff,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: searchGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
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
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 py-4">
          {/* skeleton for add staff button */}
          <Skeleton className="h-9 w-28" />

          {/* search + filters */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 ml-auto">
            {/* skeleton for search box */}
            <Skeleton className="h-9 w-48 flex-1" />

            {/* skeleton for filter by role */}
            <Skeleton className="h-9 w-full sm:w-36" />
            {/* skeleton for filter columns */}
            <Skeleton className="h-9 w-full sm:w-36" />
          </div>
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

                {/* remaining column skeletons */}
                {Array(7)
                  .fill(0)
                  .map((_, colIndex) => {
                    const remainingWidths = [
                      "17%", // Name
                      "20%", // Email
                      "10%", // Role
                      "10%", // Department
                      "10%", // Date Created
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

                    {/* remaining column skeletons */}
                    {Array(7)
                      .fill(0)
                      .map((_, colIndex) => {
                        const remainingWidths = [
                          "17%", // Name
                          "20%", // Email
                          "10%", // Role
                          "10%", // Department
                          "10%", // Date Created
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

  // main content
  return (
    <div className="w-full p-4 space-y-4">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-2xl font-bold">Manage Staff</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, or archive staff available in the system.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 py-4">
        {/* archive selected button */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
              className="w-full sm:w-auto text-amber-600 hover:text-amber-800 cursor-pointer"
            >
              <X className="w-4 h-4 mr-2" />
              Clear selection
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={() => setShowBatchArchiveDialog(true)}
              className="w-full sm:w-auto bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
            >
              <Archive className="w-4 h-4 mr-2" />
              Batch Archive
            </Button>
          </div>
        )}

        {/* add staff button */}
        <AddStaffAccountModal onUserAdded={handleUserAdded} />

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 ml-auto">
          {/* search */}
          <div className="relative w-full sm:max-w-xs">
            {/* search icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            <Input
              placeholder="Search staff..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10 max-w-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {/* clear button */}
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="p-1 mr-2 hover:bg-primary/10 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* filter by role */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="cursor-pointer">
                <UserRoundSearch /> Filter By Role <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("Academic Head")}
                onCheckedChange={(checked) => {
                  const newFilter = checked
                    ? [...roleFilter, "Academic Head"]
                    : roleFilter.filter((r) => r !== "Academic Head");
                  handleRoleFilterChange(newFilter);
                }}
              >
                Academic Head
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("Program Head")}
                onCheckedChange={(checked) => {
                  const newFilter = checked
                    ? [...roleFilter, "Program Head"]
                    : roleFilter.filter((r) => r !== "Program Head");
                  handleRoleFilterChange(newFilter);
                }}
              >
                Program Head
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("Teacher")}
                onCheckedChange={(checked) => {
                  const newFilter = checked
                    ? [...roleFilter, "Teacher"]
                    : roleFilter.filter((r) => r !== "Teacher");
                  handleRoleFilterChange(newFilter);
                }}
              >
                Teacher
              </DropdownMenuCheckboxItem>
              {roleFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-red-500 hover:text-red-600 cursor-pointer"
                    onClick={() => handleRoleFilterChange([])}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* filter columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="cursor-pointer">
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
                      <UsersRound className="h-12 w-12" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">No staff found.</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {error ||
                          "Try adjusting your search or filters to find staff."}
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
