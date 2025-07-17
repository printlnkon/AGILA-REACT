import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Edit,
  MoreHorizontal,
  Trash2,
  Check,
  Calendar as CalendarIcon,
  LoaderCircle,
} from "lucide-react";

export default function AddSemesterCard({ 
  semester, 
  onEdit, 
  onDelete, 
  onSetActive,
  isActivating = false
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isStartDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setEndDatePickerOpen] = useState(false);
  
  const toDate = (timestamp) => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  };
  
  const [editedSemester, setEditedSemester] = useState({
    semesterName: semester.semesterName,
    startDate: toDate(semester.startDate),
    endDate: toDate(semester.endDate),
  });

  const handleSelectChange = (value) => {
    setEditedSemester((prev) => ({ ...prev, semesterName: value }));
  };

  const handleDateChange = (date, field) => {
    setEditedSemester((prev) => ({ ...prev, [field]: date }));
    if (field === "startDate") {
      setStartDatePickerOpen(false);
    } else if (field === "endDate") {
      setEndDatePickerOpen(false);
    }
  };

  const handleEdit = () => {
    onEdit(semester, editedSemester);
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    onDelete(semester);
    setShowDeleteDialog(false);
  };

  const getStatusConfig = (status) => {
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
    return statusConfig[status] || statusConfig.Upcoming;
  };

  const isActive = semester.status === "Active";
  const statusConfig = getStatusConfig(semester.status);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{semester.semesterName}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0 cursor-pointer" 
                disabled={isActivating}
              >
                <span className="sr-only">Open menu</span>
                {isActivating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isActive && (
                <>
                  <DropdownMenuItem
                    onClick={() => onSetActive(semester)}
                    className="text-green-600 hover:text-green-700 focus:text-green-700 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                    disabled={isActive || isActivating}
                  >
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Set as Active</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setShowEditDialog(true)}
                className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-blue-600" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                disabled={isActive}
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                <span>Delete Permanently</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          <Badge variant={statusConfig.variant} className={statusConfig.className}>
            {semester.status}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date:</span>
            <span>
              {semester.startDate
                ? format(
                    toDate(semester.startDate),
                    "MMMM d, yyyy"
                  )
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End Date:</span>
            <span>
              {semester.endDate
                ? format(
                    toDate(semester.endDate),
                    "MMMM d, yyyy"
                  )
                : "-"}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Edit Semester</DialogTitle>
            <DialogDescription>
              Make changes to the semester details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="Semester" className="text-right">
                Semester
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={handleSelectChange}
                  value={editedSemester.semesterName}
                >
                  <SelectTrigger id="semesterName" className="w-full">
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* start date */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="startDate" className="text-right pt-2">
                Start Date
              </Label>
              <div className="col-span-3">
                <Popover
                  open={isStartDatePickerOpen}
                  onOpenChange={setStartDatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="startDate"
                      className={`w-full justify-between ${
                        !editedSemester.startDate ? "text-muted-foreground" : ""
                      }`}
                    >
                      {editedSemester.startDate ? (
                        format(editedSemester.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editedSemester.startDate}
                      captionLayout="dropdown"
                      onSelect={(date) => handleDateChange(date, "startDate")}
                      className="text-primary"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* end date */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="endDate" className="text-right pt-2">
                End Date
              </Label>
              <div className="col-span-3">
                <Popover
                  open={isEndDatePickerOpen}
                  onOpenChange={setEndDatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="endDate"
                      className={`w-full justify-between ${
                        !editedSemester.endDate ? "text-muted-foreground" : ""
                      }`}
                    >
                      {editedSemester.endDate ? (
                        format(editedSemester.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editedSemester.endDate}
                      captionLayout="dropdown"
                      onSelect={(date) => handleDateChange(date, "endDate")}
                      className="text-primary"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          {/* cancel and save btn */}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowEditDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              className="cursor-pointer bg-primary"
            >
              <Check /> Save Changes
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
              Are you sure you want to delete the semester "
              <strong>{semester.semesterName}</strong>"? This action cannot be
              undone.
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
              onClick={handleDelete}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}