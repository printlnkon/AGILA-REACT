// AcademicYearCard.jsx
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Check,
  Trash2,
  CalendarDays,
  LoaderCircle,
  Edit,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SemesterCard from "@/components/AdminComponents/SemesterCard";

const toDate = (timestamp) => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date;
};

const getStatusConfig = (status) => {
  const config = {
    Active: "bg-green-600 text-white hover:bg-green-700",
    Archived: "bg-red-600 text-white hover:bg-red-700",
    Upcoming: "bg-blue-600 text-white hover:bg-blue-700",
  };
  return config[status] || "bg-gray-500 text-white";
};

export default function AcademicYearCard({
  acadYear,
  onSetActive,
  onDelete,
  onUpdate,
  onAddSemesterClick,
  isActivating,
  handleSetActiveSemester,
  handleDeleteSemester,
  actionLoading,
  onDataRefresh,
  existingYears,
}) {
  const statusConfig = getStatusConfig(acadYear.status);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editedYearName, setEditedYearName] = useState(acadYear.acadYear);
  const [loading, setLoading] = useState(false);

  const handleDeleteClick = () => {
    onDelete(acadYear);
    setDeleteOpen(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editedYearName) {
      toast.error("School Year name is required.");
      return;
    }

    const yearFormat = /^S\.Y - \d{4}-\d{4}$/;
    if (!yearFormat.test(editedYearName)) {
      toast.error("Invalid format. Please use 'S.Y - YYYY-YYYY'.");
      return;
    }

    if (
      editedYearName !== acadYear.acadYear &&
      existingYears.includes(editedYearName)
    ) {
      toast.error("This school year already exists.");
      return;
    }

    setLoading(true);
    // prop function passed from the parent
    await onUpdate(acadYear.id, editedYearName);
    setLoading(false);
    setEditOpen(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{acadYear.acadYear}</CardTitle>
          <Badge className={statusConfig}>{acadYear.status}</Badge>
        </div>
        <CardDescription className="flex justify-between items-center">
          <span>
            Date Created:{" "}
            {acadYear.createdAt
              ? format(toDate(acadYear.createdAt), "MMMM d, yyyy")
              : "N/A"}
          </span>

          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 cursor-pointer"
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">View More Actions</TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                {acadYear.status !== "Active" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onSetActive(acadYear)}
                      className="text-green-600 cursor-pointer focus:bg-green-50 focus:text-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" /> Set as Active
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="cursor-pointer text-destructive"
                  disabled={acadYear.status === "Active"}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <Button onClick={onAddSemesterClick} className="mb-4 cursor-pointer">
          <Plus className="h-4 w-4" /> Add Semester
        </Button>
        {acadYear.semesters.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {acadYear.semesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                onSetActive={(sem) => handleSetActiveSemester(sem, acadYear.id)}
                onDelete={(sem) => handleDeleteSemester(sem, acadYear.id)}
                isActivating={actionLoading === semester.id}
                academicYearId={acadYear.id}
                onDataRefresh={onDataRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg mt-4">
            <CalendarDays className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 font-semibold">No semesters found.</p>
            <p>Click "Add Semester" to get started.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the academic year "
              <strong>{acadYear.acadYear}</strong>"? This will also delete all
              its semesters. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Make changes to the academic year.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <Label htmlFor="yearName">School Year</Label>
              <Input
                id="yearName"
                value={editedYearName}
                onChange={(e) => setEditedYearName(e.target.value)}
                placeholder="e.g., S.Y - 2025-2026"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading}
                className="cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">
                      <LoaderCircle />
                    </span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
