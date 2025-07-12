import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import AddStudentModal from "@/components/AdminComponents/AddStudentModal";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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

// Action handlers
const handleCopyStudentNumber = (studentNumber) => {
  if (!studentNumber) {
    toast.error("Student Number not found");
    return;
  }
  navigator.clipboard
    .writeText(studentNumber)
    .then(() => {
      toast.success("Student Number copied to clipboard");
    })
    .catch(() => {
      toast.error("Failed to copy Student Number");
    });
};

const handleViewUser = (user) => {
  if (!user) {
    toast.error("User data not found");
    return;
  }
  // You can implement a view modal here or navigate to a details page
  toast.info(`Viewing user: ${user.firstName} ${user.lastName}`);
  console.log("User details:", user);
};

const handleEditUser = (user) => {
  if (!user) {
    toast.error("User data not found");
    return;
  }
  // You can implement an edit modal here
  toast.info(
    `Edit functionality for ${user.firstName} ${user.lastName} - Coming soon`
  );
  console.log("Edit user:", user);
};

const searchGlobalFilter = (row, columnId, filterValue) => {
  const studentNumber = row.original.studentNumber?.toLowerCase() || "";
  const email = row.original.email?.toLowerCase() || "";
  const firstName = row.original.firstName?.toLowerCase() || "";
  const lastName = row.original.lastName?.toLowerCase() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const search = filterValue.toLowerCase();

  return (
    studentNumber.includes(search) ||
    email.includes(search) ||
    fullName.includes(search)
  );
};


const createColumns = (handleArchiveUser) => [
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

  // student no. column
  {
    id: "Student No.",
    accessorKey: "studentNumber",
    header: "Student No.",
    cell: ({ row }) => {
      const studentNo = row.original.studentNumber;
      return <div className="capitalize">{studentNo || "N/A"}</div>;
    },
  },

  // name column
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const firstName = row.original.firstName || "";
      const lastName = row.original.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return <div className="capitalize">{fullName || "N/A"}</div>;
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

  // role column
  // {
  //   accessorKey: "role",
  //   header: "Role",
  //   cell: ({ row }) => {
  //     const role = row.getValue("role") || "N/A";
  //     return <div className="capitalize">{role.replace("_", " ")}</div>;
  //   },
  // },

  // date created
  {
    id: "Date Created",
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      if (!timestamp) return <div>-</div>;

      // convert timestamp to date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{format(date, "MMMM do, yyyy")}</div>;
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

      // convert timestamp to date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return <div>{format(date, "MMMM do, yyyy")}</div>;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleCopyStudentNumber(user.studentNumber)}
                className="cursor-pointer"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleViewUser(user)}
                className="text-green-600 hover:text-green-700 focus:text-green-700 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4 text-green-600" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditUser(user)}
                className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                Edit
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

          {/* Archive Confirmation Dialog */}
          <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Archive</DialogTitle>
                <DialogDescription>
                  Are you sure you want to archive the user "{user.firstName}{" "}
                  {user.lastName}"? This will set their account status to
                  inactive.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
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
                  <Archive /> Archive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];

export const pagination = {};

export default function StudentsTable() {
  const [users, setUsers] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter , setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBatchArchiveDialog, setShowBatchArchiveDialog] = useState(false);

  const handleArchiveUser = async (user) => {
    if (!user || !user.id || !user.role) {
      toast.error("Invalid user data");
      console.error("Missing required user data:", user);
      return false;
    }

    try {
      // matches the collection path in firestore
      const rolePath = user.role.toLowerCase().replace(" ", "_");
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

      setUsers((currentUsers) => currentUsers.filter((u) => u.id !== user.id));

      // refresh the users list
      await fetchUsers();
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
      const remainingUsers = users.filter(
        (user) => !selectedRows.some((row) => row.original.id === user.id)
      );
      setUsers(remainingUsers);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentsCollectionRef = collection(db, "users/student/accounts");
      const querySnapshot = await getDocs(studentsCollectionRef);

      if (querySnapshot.empty) {
        setError("No students found.");
        setUsers([]);
      } else {
        const studentData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            role: "student",
            status: data.status || "active",
            email: data.email || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            ...data,
          };
        });
        setUsers(studentData);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError(
        "Failed to load students. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = createColumns(handleArchiveUser, handleBatchArchive);
  const table = useReactTable({
    data: users,
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
      globalFilter
    },
  });

  if (users.length === 0 && !loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
        </div>
        {/* search and filters */}
        <div className="flex items-center gap-2 py-4">
          <AddStudentModal onUserAdded={fetchUsers} />
          {/* search */}
          <div className="relative max-w-sm flex-1">
            {/* TO BE CHANGED */}
            <Input
              placeholder="Search users by student no and email"
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pr-16"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <Search className="h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

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

        {/* empty table with message inside */}
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center py-12"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full bg-gray-50 p-3">
                      <UsersRound className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-blue-900 text-lg font-medium">
                        No users found
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Users will appear here once user data is added.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Empty pagination area for consistent layout */}
        <div className="flex justify-between items-center py-4">
          <div className="text-sm text-muted-foreground">
            0 of 0 row(s) selected.
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-40" />

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

  // main content
  return (
    <div className="w-full">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Students</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 py-4">
        {/* add new account button */}
        <AddStudentModal onUserAdded={fetchUsers} />

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
          <Input
            placeholder="Search users by student no and email"
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pr-16"
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
            {/* search icon */}
            <Search className="h-4 w-4 pointer-events-none" />
          </div>
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
                  className="h-64 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full">
                      <UsersRound className="h-12 w-12 " />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">
                        No students found
                      </p>
                      <p className="text-muted-foreground  text-sm mt-2">
                        Student data will appear here.
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
                  variant="outline"
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
