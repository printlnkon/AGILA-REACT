import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { format } from "date-fns";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/api/firebase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Columns2,
  Trash2,
  Search,
  X,
  RotateCcw,
  FolderArchive,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ArchiveTable() {
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBatchRestoreDialog, setShowBatchRestoreDialog] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  // table global filter for search
  const searchGlobalFilter = (row, columnId, filterValue) => {
    const studentNumber = row.original.studentNumber?.toLowerCase() || "";
    const employeeNo = row.original.employeeNo?.toLowerCase() || "";
    const email = row.original.email?.toLowerCase() || "";
    const firstName = row.original.firstName?.toLowerCase() || "";
    const lastName = row.original.lastName?.toLowerCase() || "";
    const fullName = `${firstName} ${lastName}`.trim();

    const search = filterValue.toLowerCase();

    return (
      studentNumber.includes(search) ||
      employeeNo.includes(search) ||
      email.includes(search) ||
      fullName.includes(search)
    );
  };

  // Action handlers
  const handleRestoreUser = async (user) => {
    if (!user || !user.id || !user.role) {
      toast.error("Invalid user data");
      return false;
    }

    try {
      // get reference to the archive document
      const archiveRef = doc(db, "archive", user.id);
      const archiveSnap = await getDoc(archiveRef);

      if (!archiveSnap.exists()) {
        toast.error("Archived user data not found");
        return false;
      }

      const userData = archiveSnap.data();

      // matches the collection path in firestore
      const rolePath = user.role.toLowerCase().replace(" ", "_");
      // create reference to user document in the appropriate collection
      const userRef = doc(db, `users/${rolePath}/accounts`, user.id);

      const restoreData = {
        ...userData,
        id: user.id,
        role: user.role,
        status: "active",
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        // add any other fields that AccountsTable expects
      };
      // delete from archive collection
      await setDoc(userRef, restoreData);

      await deleteDoc(archiveRef);

      toast.success(
        `User ${user.firstName} ${user.lastName} restored successfully`
      );

      setArchivedUsers((currentUsers) =>
        currentUsers.filter((u) => u.id !== user.id)
      );

      // refresh the archive list
      fetchArchivedUsers();
      return true;
    } catch (error) {
      console.error("Error restoring user:", error);
      toast.error(`Restore failed: ${error.message}`);
      return false;
    }
  };

  const handleBatchRestoreUser = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error("No users selected");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Show a loading toast
    const loadingToast = toast.loading(
      `Restoring ${selectedRows.length} users...`
    );

    // Process each selected user
    for (const row of selectedRows) {
      const user = row.original;
      const success = await handleRestoreUser(user);

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
      toast.success(`Successfully restored ${successCount} users`);
    }
    if (failCount > 0) {
      toast.error(`Failed to restore ${failCount} users`);
    }

    // Clear selection
    table.resetRowSelection();

    // force re-fetch users to update the table
    if (successCount > 0) {
      const remainingUsers = archivedUsers.filter(
        (user) => !selectedRows.some((row) => row.original.id === user.id)
      );
      setArchivedUsers(remainingUsers);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user || !user.id || !user.role || !user.email?.trim()) {
      toast.error("Invalid user data. Please check the user details.");
      return false;
    }
    try {
      const deleteUser = httpsCallable(functions, "deleteUserAuth");
      // delete from firebase authentication
      await deleteUser({ email: user.email });
      // delete from firestore archive collection
      const archiveRef = doc(db, "archive", user.id);

      await deleteDoc(archiveRef);

      toast.success(
        `User ${user.firstName} ${user.lastName} permanently deleted.`
      );

      // force re-fetch users to update the table
      setArchivedUsers((currentUsers) =>
        currentUsers.filter((u) => u.id !== user.id)
      );

      // refresh the archive list
      fetchArchivedUsers();
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Delete failed: ${error.message}`);
      return false;
    }
  };

  const handleBatchDeleteUser = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error("No users selected");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Show a loading toast
    const loadingToast = toast.loading(
      `Permanently deleting ${selectedRows.length} users...`
    );

    // Process each selected user
    for (const row of selectedRows) {
      const user = row.original;
      const success = await handleDeleteUser(user);

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
      toast.success(`Successfully deleted ${successCount} users`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} users`);
    }

    // Clear selection
    table.resetRowSelection();
  };

  // data fetching
  const fetchArchivedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const archivedUsersArray = [];

      // Get archived users from the archive collection
      const querySnapshot = await getDocs(collection(db, "archive"));

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // validate required fields
        if (!userData.email) {
          console.warn(`Missing email for user ${doc.id}:`, userData);
        }

        archivedUsersArray.push({
          id: doc.id,
          role: userData.role || "unknown",
          status: "inactive",
          email: userData.email || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          ...userData,
        });
      });

      if (archivedUsersArray.length === 0) {
        setError("No archived users found.");
      } else {
        setArchivedUsers(archivedUsersArray);
      }
    } catch (error) {
      console.error("Error fetching archived users:", error);
      setError(
        "Failed to load archived users. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";

    try {
      // For Firestore Timestamps
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        return format(timestamp.toDate(), "MMMM do, yyyy");
      }

      // For ISO strings or timestamp numbers
      if (typeof timestamp === "string" || typeof timestamp === "number") {
        return format(new Date(timestamp), "MMMM do, yyyy");
      }

      // For Date objects
      if (timestamp instanceof Date) {
        return format(timestamp, "MMMM do, yyyy");
      }

      return "-";
    } catch (error) {
      console.error("Date formatting error:", error, timestamp);
      return "-";
    }
  };

  // initial data loading
  useEffect(() => {
    fetchArchivedUsers();
  }, []);

  // table columns definition
  const columns = [
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

    // photo column
    {
      id: "Photo",
      accessorKey: "photoURL",
      header: "Photo",
      cell: ({ row }) => {
        const photoURL = row.original.photoURL;
        const firstName = row.original.firstName || "";
        const lastName = row.original.lastName || "";
        const initials =
          (firstName.charAt(0) || "") + (lastName.charAt(0) || "");
        return (
          <Avatar className="w-10 h-10">
            <AvatarImage src={photoURL || initials} alt="Student Photo" />
            <AvatarFallback>{initials.toUpperCase() || "N/A"}</AvatarFallback>
          </Avatar>
        );
      },
    },

    // name column
    {
      accessorKey: "name",
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
        <div className="ml-3 lowercase">{row.getValue("email") || "N/A"}</div>
      ),
    },

    // role column
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") || "N/A";
        return <div className="capitalize">{role.replace("_", " ")}</div>;
      },
    },

    // date created
    {
      id: "Date Created",
      accessorKey: "createdAt",
      header: "Date Created",
      cell: ({ row }) => {
        return <div>{formatDate(row.original.createdAt)}</div>;
      },
    },

    // last updated
    {
      id: "Last Updated",
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => {
        return <div>{formatDate(row.original.updatedAt)}</div>;
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
          <Badge variant={isActive ? "default" : "destructive"}>
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
        const [showDeleteDialog, setShowDeleteDialog] = useState(false);
        const [showRestoreDialog, setShowRestoreDialog] = useState(false);

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
                    onClick={() => setShowRestoreDialog(true)}
                    className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                  >
                    <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                    Delete Permanently
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
            {/* delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to permanently delete the user "
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    "? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteUser(user);
                      setShowDeleteDialog(false);
                    }}
                    className="cursor-pointer"
                  >
                    Delete Permanently
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Restore Confirmation Dialog */}
            <Dialog
              open={showRestoreDialog}
              onOpenChange={setShowRestoreDialog}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Restore</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to restore the user "
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    "? The user will be moved back to active accounts.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setShowRestoreDialog(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700  text-white cursor-pointer"
                    onClick={() => {
                      handleRestoreUser(user);
                      setShowRestoreDialog(false);
                    }}
                  >
                    Restore
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );
      },
    },
  ];

  // initialize table
  const table = useReactTable({
    data: archivedUsers,
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // loading state
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
          {/* skeleton for search box */}
          <Skeleton className="relative max-w-sm flex-1 h-9" />

          {/* skeleton for filter columns */}
          <Skeleton className="h-9 w-36 ml-2" />
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
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4" style={{ width: "15%" }} />

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
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4" style={{ width: "15%" }} />

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

  // Render main table
  return (
    <div className="w-full p-4 space-y-4">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Archives</h1>
          <p className="text-muted-foreground">
            Restore or delete permanently archives available in the system.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 py-4">
        {/* batch restore & delete selected button */}
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
              onClick={() => setShowBatchRestoreDialog(true)}
              className="bg-blue-900 text-white hover:bg-blue-700 cursor-pointer"
            >
              <RotateCcw />
              Batch Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBatchDeleteDialog(true)}
              className="cursor-pointer"
            >
              <Trash2 />
              Batch Delete
            </Button>
          </div>
        )}

        {/* search */}
        <div className="relative max-w-sm flex-1">
          {/* search icon */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search archived users..."
            value={globalFilter ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setGlobalFilter(value);
            }}
            className="pl-10 max-w-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {/* clear button */}
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="p-1 mr-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* filter by role */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer ml-2">
              <Search /> Filter By Role <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={table.getColumn("role")?.getFilterValue() === undefined}
              onCheckedChange={() => {
                table.getColumn("role")?.setFilterValue(undefined);
              }}
            >
              All Roles
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {["academic head", "program head", "teacher", "student"].map(
              (role) => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={table.getColumn("role")?.getFilterValue() === role}
                  onCheckedChange={(checked) => {
                    table
                      .getColumn("role")
                      ?.setFilterValue(checked ? role : undefined);
                  }}
                  className="capitalize"
                >
                  {role.replace("_", " ")}
                </DropdownMenuCheckboxItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* filter columns */}
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
              // will show if no data
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FolderArchive className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No archives found.</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters to find archives.
                    </p>
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

          {/* batch restore dialog */}
          <Dialog
            open={showBatchRestoreDialog}
            onOpenChange={setShowBatchRestoreDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Batch Restore</DialogTitle>
                <DialogDescription>
                  Are you sure you want to restore{" "}
                  <strong>
                    {table.getFilteredSelectedRowModel().rows.length} selected
                    users?
                  </strong>{" "}
                  They will be moved back to active accounts.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowBatchRestoreDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  onClick={() => {
                    handleBatchRestoreUser();
                    setShowBatchRestoreDialog(false);
                  }}
                >
                  Restore All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* batch delete dialog */}
          <Dialog
            open={showBatchDeleteDialog}
            onOpenChange={setShowBatchDeleteDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Batch Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete{" "}
                  <strong>
                    {table.getFilteredSelectedRowModel().rows.length} selected
                    users?
                  </strong>{" "}
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowBatchDeleteDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className=" cursor-pointer"
                  onClick={() => {
                    handleBatchDeleteUser();
                    setShowBatchDeleteDialog(false);
                  }}
                >
                  Delete All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
