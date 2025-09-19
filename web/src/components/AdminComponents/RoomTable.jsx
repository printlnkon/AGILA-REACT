import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, CalendarDays } from "lucide-react";
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
  flexRender,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Columns2,
  Search,
  X,
  Loader2,
  Building,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  collectionGroup,
} from "firebase/firestore";
import ViewRoomSchedule from "@/components/AdminComponents/ViewRoomSchedule";
import AddRoomModal from "@/components/AdminComponents/AddRoomModal";
import EditRoomModal from "@/components/AdminComponents/EditRoomModal";

const checkRoomHasSchedules = async (roomId) => {
  try {
    const schedulesQuery = query(
      collectionGroup(db, "schedules"),
      where("roomId", "==", roomId)
    );
    const querySnapshot = await getDocs(schedulesQuery);
    return !querySnapshot.empty; // Returns true if schedules exist, false otherwise
  } catch (error) {
    console.error("Error checking for room schedules:", error);
    toast.error("An error occurred while checking room schedules.");
    // Return true to prevent accidental deletion if the check fails
    return true;
  }
};

const createColumns = (
  handleEditRoom,
  handleDeleteRoom,
  handleViewSchedules
) => [
  // floor
  {
    accessorKey: "floor",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Floor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const floor = row.getValue("floor");
      return (
        <div className="capitalize ml-3">
          {floor}
          {floor === "1"
            ? "st"
            : floor === "2"
            ? "nd"
            : floor === "3"
            ? "rd"
            : "th"}{" "}
          Floor
        </div>
      );
    },
  },
  // room no.
  {
    accessorKey: "roomNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Room No.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="ml-3">{row.getValue("roomNo")}</div>,
  },
  // actions
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const roomData = row.original;
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [checkingSchedules, setCheckingSchedules] = useState(false);

      const handleDeleteClick = async () => {
        setCheckingSchedules(true);
        try {
          const hasAssignedSchedules = await checkRoomHasSchedules(roomData.id);
          if (!hasAssignedSchedules) {
            setShowDeleteDialog(true);
          } else {
            toast.error("Cannot delete room with assigned schedules.", {
              description:
                "Please remove all schedules assigned to this room first.",
            });
          }
        } catch (error) {
          console.error("Error checking room schedules:", error);
          toast.error("Failed to check room schedules. Please try again.");
        } finally {
          setCheckingSchedules(false);
        }
      };

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
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">View More Actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleViewSchedules(row.original)}
                  className="cursor-pointer"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  View Schedules
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleEditRoom(row.original)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="cursor-pointer text-destructive"
                  disabled={checkingSchedules}
                >
                  {checkingSchedules ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  )}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>

          {/* delete confirmation dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete the room
                  <strong>"{roomData.roomNo}"</strong>
                  {""}? This action cannot be undone.
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
                    handleDeleteRoom(roomData.id);
                    setShowDeleteDialog(false);
                  }}
                  className="cursor-pointer"
                >
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

export default function RoomTable() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([{ id: "floor", desc: false }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showSchedulesModal, setShowSchedulesModal] = useState(false);

  const [existingRoomNos, setExistingRoomNos] = useState([]);

  // state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);

  // Extract unique floors for filtering
  const availableFloors = Array.from(
    new Set(rooms.map((room) => room.floor))
  ).sort();

  // Function to view room schedules
  const handleViewSchedules = (room) => {
    setSelectedRoom(room);
    setShowSchedulesModal(true);
  };

  // Function to handle editing room
  const handleEditRoom = (room) => {
    setRoomToEdit(room);
    setShowEditModal(true);
  };

  // Function to handle deleting room
  const handleDeleteRoom = async (roomId) => {
    try {
      // First check if the room has schedules
      const hasSchedules = await checkRoomHasSchedules(roomId);

      if (hasSchedules) {
        toast.error("Cannot delete room with assigned schedules", {
          description: "Remove all schedules assigned to this room first",
        });
        return;
      }

      await deleteDoc(doc(db, "rooms", roomId));
      toast.success("Room deleted successfully");
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  // Function to handle room added
  const handleRoomAdded = (newRoom) => {
    toast.success(`${newRoom.roomNo} added successfully`);
  };

  // Function to handle room updated
  const handleRoomUpdated = (updatedRoom) => {
    toast.success(`${updatedRoom.roomNo} updated successfully`);
  };

  // Fetch rooms data from Firestore
  useEffect(() => {
    setLoading(true);

    // Set up a real-time listener to Firestore
    const unsubscribe = onSnapshot(
      collection(db, "rooms"),
      (snapshot) => {
        const roomsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            type: data.roomType ? data.roomType.toLowerCase() : "",
          };
        });
        setRooms(roomsData);

        const roomNos = roomsData.map(room => room.roomNo);
        setExistingRoomNos(roomNos);

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to load rooms");
        setLoading(false);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const columns = createColumns(
    handleEditRoom,
    handleDeleteRoom,
    handleViewSchedules
  );

  const table = useReactTable({
    data: rooms,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
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
          {/* skeleton for export button */}
          <Skeleton className="h-9 w-28" />

          {/* search + filters */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 ml-auto">
            {/* skeleton for search box */}
            <Skeleton className="relative w-full sm:max-w-xs h-9" />

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

  return (
    <div className="w-full p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-2xl font-bold">Manage Rooms</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, and manage rooms available in the system.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 py-4">
        {/* add room button */}
        <AddRoomModal 
          onRoomAdded={handleRoomAdded}
          existingRooms={existingRoomNos}
        />

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 ml-auto">
          {/* search */}
          <div className="relative w-full sm:max-w-xs">
            {/* search icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            <Input
              placeholder="Search rooms..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10 w-full"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {/* clear button */}
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="p-1 mr-2 hover:bg-transparent rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* filter by floor */}
          {availableFloors.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Building className="mr-2 h-4 w-4" /> Filter By Floor
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn("floor")?.getFilterValue() === undefined
                  }
                  onCheckedChange={() => {
                    table.getColumn("floor")?.setFilterValue(undefined);
                  }}
                >
                  All Floors
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {availableFloors.map((floor) => (
                  <DropdownMenuCheckboxItem
                    key={floor}
                    checked={
                      table.getColumn("floor")?.getFilterValue() === floor
                    }
                    onCheckedChange={(checked) => {
                      table
                        .getColumn("floor")
                        ?.setFilterValue(checked ? floor : undefined);
                    }}
                    className="capitalize"
                  >
                    {floor}
                    {floor === "1"
                      ? "st"
                      : floor === "2"
                      ? "nd"
                      : floor === "3"
                      ? "rd"
                      : "th"}{" "}
                    Floor
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Columns2 className="mr-2 h-4 w-4" /> Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  let displayName = column.id;

                  if (column.id === "roomNo") displayName = "Room No.";
                  if (column.id === "type") displayName = "Room Type";
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {displayName}
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
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full">
                      <Search className="h-12 w-12" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">No rooms found.</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        Click "Add Room" to get started.
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
        <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-4 w-full sm:w-auto">
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
                      : "cursor-pointer h-8 w-8 p-0"
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
                      : "cursor-pointer h-8 w-8 p-0"
                  }
                />
              </PaginationItem>

              {table.getPageCount() > 0 && (
                <>
                  {/* compact pagination on smaller screens */}
                  <div className="hidden xs:flex items-center">
                    {/* first page */}
                    <PaginationItem className="hidden sm:block">
                      {" "}
                      {/* hide on extra small mobile */}
                      <PaginationLink
                        onClick={() => table.setPageIndex(0)}
                        isActive={table.getState().pagination.pageIndex === 0}
                        className="cursor-pointer h-8 w-8 p-0"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {/* show ellipsis if currentPage > 3 */}
                    {table.getState().pagination.pageIndex > 2 && (
                      <PaginationItem className="hidden sm:block">
                        {" "}
                        {/* hide on extra small mobile */}
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
                          <PaginationItem key={i} className="hidden sm:block">
                            {" "}
                            {/* hide on extra small mobile */}
                            <PaginationLink
                              onClick={() => table.setPageIndex(i)}
                              isActive={
                                table.getState().pagination.pageIndex === i
                              }
                              className="cursor-pointer h-8 w-8 p-0"
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
                      <PaginationItem className="hidden sm:block">
                        {" "}
                        {/* Hide on extra small mobile */}
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* last page */}
                    {table.getPageCount() > 1 && (
                      <PaginationItem className="hidden sm:block">
                        {" "}
                        {/* Hide on extra small mobile */}
                        <PaginationLink
                          onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                          }
                          isActive={
                            table.getState().pagination.pageIndex ===
                            table.getPageCount() - 1
                          }
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          {table.getPageCount()}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                  </div>

                  {/* page indicator for all screen sizes */}
                  <div className="flex items-center">
                    <Label className="text-sm font-medium mx-1 whitespace-nowrap">
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
                      : "cursor-pointer h-8 w-8 p-0"
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
                      : "cursor-pointer h-8 w-8 p-0"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* View Room Schedules Modal */}
      {selectedRoom && (
        <ViewRoomSchedule
          open={showSchedulesModal}
          onOpenChange={setShowSchedulesModal}
          room={selectedRoom}
        />
      )}

      {/* Edit Room Modal */}
      {roomToEdit && (
        <EditRoomModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          roomData={roomToEdit}
          onRoomUpdated={handleRoomUpdated}
          existingRooms={existingRoomNos}
        />
      )}
    </div>
  );
}
