import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Eye,
  Trash2,
  Copy,
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
import { toast } from "sonner";

export default function ArchiveTable() {
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBatchRestoreDialog, setShowBatchRestoreDialog] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  // Action handlers
  const handleCopyId = (userId) => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }
    navigator.clipboard
      .writeText(userId)
      .then(() => {
        toast.success("User ID copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy User ID");
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
    if (!user || !user.id || !user.role) {
      toast.error("Invalid user data");
      return false;
    }
    try {
      // delete from archive collection
      const archiveRef = doc(db, "archive", user.id);

      await deleteDoc(archiveRef);

      toast.success(
        `User ${user.firstName} ${user.lastName} permanently deleted successfully`
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
          console.warn(`Archived user ${doc.id} missing email`);
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
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("email") || "N/A"}</div>
      ),
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

    // role column
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") || "N/A";
        return <div className="capitalize">{role.replace("_", " ")}</div>;
      },
    },

    // status column
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") || "active";
        return (
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status === "active" ? "Active" : "Inactive"}
          </div>
        );
      },
    },
    // actions column
    {
      header: "Actions",
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const [showDeleteDialog, setShowDeleteDialog] = useState(false);
        const [showRestoreDialog, setShowRestoreDialog] = useState(false);

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
                  onClick={() => handleCopyId(user.id)}
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
                <DropdownMenuSeparator />
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
                  className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
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
                    Are you sure you want to permanently delete the user "
                    {user.firstName} {user.lastName}"? This action cannot be
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
                      handleDeleteUser(user);
                      setShowDeleteDialog(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Trash2 /> Delete Permanently
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
                    Are you sure you want to restore the user "{user.firstName}{" "}
                    {user.lastName}"? The user will be moved back to active
                    accounts.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowRestoreDialog(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
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
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // error and loading states
  if (archivedUsers.length === 0 && !loading) {
    return (
      <div className="w-full">
        {/* search and filters */}
        <div className="flex items-center gap-2 py-4">
          {/* search */}
          <div className="relative max-w-sm flex-1">
            <Input
              placeholder="Search archived users by email..."
              value={table.getColumn("email")?.getFilterValue() ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                table.getColumn("email")?.setFilterValue(value);
              }}
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
                      <FolderArchive className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-blue-900 text-lg font-medium">
                        No archived users found
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Archived users will appear here once they are moved from
                        active accounts.
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

  // loading state
  if (loading) {
    return (
      <div className="w-full">
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
          <div className="bg-gray-50 px-4">
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
        <div className="flex justify-between items-center py-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    );
  }

  // Render main table
  return (
    <div className="w-full">
      {/* Search and filters */}
      <div className="flex items-center gap-2 py-4">
        {/* search */}

        {/* batch restore & delete selected button */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetRowSelection()}
                className="text-amber-600 hover:text-amber-800 cursor-pointer"
              >
                Clear selection
              </Button>
              <Button
                variant="warning"
                size="sm"
                onClick={() => setShowBatchRestoreDialog(true)}
                className="bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
              >
                Batch Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBatchDeleteDialog(true)}
                className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Batch Delete
              </Button>
            </div>
          </div>
        )}

        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Search archived users by email..."
            value={table.getColumn("email")?.getFilterValue() ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              table.getColumn("email")?.setFilterValue(value);
            }}
            className="pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {/* clear button */}
            {table.getColumn("email")?.getFilterValue() && (
              <button
                onClick={() => table.getColumn("email")?.setFilterValue("")}
                className="p-1 hover:bg-gray-100 rounded-sm mr-1 cursor-pointer"
                type="button"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            {/* search icon */}
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No archived users found.
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
                  {table.getFilteredSelectedRowModel().rows.length} selected
                  users? They will be moved back to active accounts.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
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
                  <RotateCcw /> Restore All
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
                  {table.getFilteredSelectedRowModel().rows.length} selected
                  users? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBatchDeleteDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  onClick={() => {
                    handleBatchDeleteUser();
                    setShowBatchDeleteDialog(false);
                  }}
                >
                  <Trash2 /> Delete All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
