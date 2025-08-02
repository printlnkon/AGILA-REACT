// SemesterCard.jsx
import { useState } from "react";
import { format } from "date-fns";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/api/firebase";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  MoreHorizontal,
  LoaderCircle,
  Check,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";

const getStatusConfig = (status) => {
  const config = {
    Active: "bg-green-600 text-white hover:bg-green-700",
    Archived: "bg-red-600 text-white hover:bg-red-700",
    Upcoming: "bg-blue-600 text-white hover:bg-blue-700",
  };
  return config[status] || "bg-gray-500 text-white";
};

const toDate = (timestamp) => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date;
};

export default function SemesterCard({
  semester,
  onSetActive,
  onDelete,
  isActivating,
  academicYearId,
  onDataRefresh,
}) {
  const statusConfig = getStatusConfig(semester.status);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editedData, setEditedData] = useState({
    semesterName: semester.semesterName,
    startDate: toDate(semester.startDate),
    endDate: toDate(semester.endDate),
  });
  const [isSubmitting, setSubmitting] = useState(false);

  // Sync state with props when the dialog is opened
  const handleEditOpenChange = (isOpen) => {
    if (isOpen) {
      setEditedData({
        semesterName: semester.semesterName,
        startDate: toDate(semester.startDate),
        endDate: toDate(semester.endDate),
      });
    }
    setEditOpen(isOpen);
  };

  const handleSaveChanges = async () => {
    if (
      !editedData.semesterName ||
      !editedData.startDate ||
      !editedData.endDate
    ) {
      toast.error("Please fill all fields.");
      return;
    }
    if (new Date(editedData.startDate) >= new Date(editedData.endDate)) {
      toast.error("End date must be after the start date.");
      return;
    }
    setSubmitting(true);
    const semRef = doc(
      db,
      "academic_years",
      academicYearId,
      "semesters",
      semester.id
    );
    try {
      await updateDoc(semRef, {
        semesterName: editedData.semesterName,
        startDate: format(editedData.startDate, "yyyy-MM-dd"),
        endDate: format(editedData.endDate, "yyyy-MM-dd"),
        updatedAt: serverTimestamp(),
      });
      toast.success("Semester updated successfully!");
      onDataRefresh();
      handleEditOpenChange(false);
    } catch (error) {
      toast.error("Failed to update semester.");
      console.error("Error updating semester: ", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    onDelete(semester);
    setDeleteOpen(false);
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{semester.semesterName}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isActivating}
              >
                {isActivating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {semester.status !== "Active" && (
                <DropdownMenuItem
                  onClick={() => onSetActive(semester)}
                  className="text-green-600 cursor-pointer focus:bg-green-50 focus:text-green-700"
                >
                  <Check className="mr-2 h-4 w-4" /> Set as Active
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleEditOpenChange(true)}
                className="text-blue-600 cursor-pointer focus:bg-blue-50 focus:text-blue-700"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                disabled={semester.status === "Active"}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          <Badge variant="default" className={statusConfig}>
            {semester.status}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start:</span>
            <span>{format(toDate(semester.startDate), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End:</span>
            <span>{format(toDate(semester.endDate), "MMM d, yyyy")}</span>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
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
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              {" "}
              <Trash2 className="mr-2 h-4 w-4" /> Delete{" "}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Semester Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="semesterName" className="text-right">
                Semester
              </Label>
              <Select
                value={editedData.semesterName}
                onValueChange={(value) =>
                  setEditedData((prev) => ({ ...prev, semesterName: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Semester">1st Semester</SelectItem>
                  <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                  <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`col-span-3 font-normal justify-start ${
                      !editedData.startDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedData.startDate ? (
                      format(editedData.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedData.startDate}
                    onSelect={(date) =>
                      setEditedData((prev) => ({ ...prev, startDate: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`col-span-3 font-normal justify-start ${
                      !editedData.endDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedData.endDate ? (
                      format(editedData.endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedData.endDate}
                    onSelect={(date) =>
                      setEditedData((prev) => ({ ...prev, endDate: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleEditOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle className="animate-spin mr-2" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
