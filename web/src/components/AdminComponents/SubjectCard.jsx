import { db } from "@/api/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, X, LoaderCircle, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Form Error component for edit dialog
const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="text-sm text-red-500 mt-1 flex items-center gap-1">
      <X className="w-4 h-4" />
      {message}
    </div>
  );
};

// Form validation function
const validateForm = (data) => {
  const errors = {};

  if (!data.subjectCode || data.subjectCode.trim() === "") {
    errors.subjectCode = "Subject code is required";
  } else if (data.subjectCode.length < 2) {
    errors.subjectCode = "Subject code must be at least 2 characters";
  }

  if (!data.subjectName || data.subjectName.trim() === "") {
    errors.subjectName = "Subject name is required";
  } else if (data.subjectName.length < 3) {
    errors.subjectName = "Subject name must be at least 3 characters";
  }

  if (data.units === "" || isNaN(data.units)) {
    errors.units = "Valid unit value is required";
  } else if (Number(data.units) < 1 || Number(data.units) > 6) {
    errors.units = "Units must be between 1 and 6";
  }

  return errors;
};

export default function SubjectCard({
  subject,
  onSubjectUpdated,
  onSubjectDeleted,
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState(subject);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes for edit dialog
  const handleChange = (e) => {
    const { id, value } = e.target;
    setSubjectFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // handle edit subject form submission
  const handleEditSubject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm(subjectFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      toast.error("Please fix the form errors", {
        description:
          "Check all required fields and correct any validation errors.",
      });
      return;
    }

    try {
      const {
        // Remove metadata fields that shouldn't be updated
        id,
        academicYearId,
        semesterId,
        departmentId,
        courseId,
        yearLevelId,
        departmentName,
        courseName,
        yearLevelName, 
        createdAt,
        updatedAt, 
        ...updateData
      } = subjectFormData;

      // Convert units to number if it exists
      if (updateData.units) {
        updateData.units = Number(updateData.units);
      }

      // Remove any undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(
        doc(
          db,
          `academic_years/${subject.academicYearId}/semesters/${subject.semesterId}/departments/${subject.departmentId}/courses/${subject.courseId}/year_levels/${subject.yearLevelId}/subjects/${subject.id}`
        ),
        updateData
      );

      // Include the ID for the parent component
      onSubjectUpdated({ ...updateData, id: subject.id });

      toast.success("Subject updated successfully");
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating subject:", err);
      toast.error("Failed to update subject", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete subject confirmation
  const handleDeleteSubject = async () => {
    try {
      await deleteDoc(
        doc(
          db,
          `academic_years/${subject.academicYearId}/semesters/${subject.semesterId}/departments/${subject.departmentId}/courses/${subject.courseId}/year_levels/${subject.yearLevelId}/subjects/${subject.id}`
        )
      );
      onSubjectDeleted(subject.id);

      toast.success("Subject deleted successfully");
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Error deleting subject:", err);
      toast.error("Failed to delete subject");
    }
  };

  return (
    <>
      <Card className="w-full transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold">
              {/* subj name */}
              {subject.subjectName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="font-medium">Units: {subject.units}</Badge>
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      View More Actions
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditDialogOpen(true)}
                      className="text-primary cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4 text-primary" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>
          <CardDescription className="flex justify-between items-center">
            <span>
              {subject.subjectCode}
              <br />
              {subject.description}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* edit subject dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full sm:max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information. All fields marked with{" "}
              <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubject}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* subject code */}
              <div className="space-y-1">
                <Label htmlFor="subjectCode">
                  Subject Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subjectCode"
                  placeholder="e.g. CS101"
                  required
                  value={subjectFormData.subjectCode}
                  onChange={handleChange}
                />
                <FormError message={formErrors.subjectCode} />
              </div>

              {/* subject name */}
              <div className="space-y-1">
                <Label htmlFor="subjectName">
                  Subject Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subjectName"
                  placeholder="e.g. Introduction to Programming"
                  required
                  value={subjectFormData.subjectName}
                  onChange={handleChange}
                />
                <FormError message={formErrors.subjectName} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* units */}
              <div className="space-y-1">
                <Label htmlFor="units">
                  Units <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  max="6"
                  placeholder="e.g. 3"
                  required
                  value={subjectFormData.units}
                  onChange={handleChange}
                />
                <FormError message={formErrors.units} />
              </div>
            </div>

            {/* description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter a brief description of the subject"
                value={subjectFormData.description}
                onChange={handleChange}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? (
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

      {/* delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {subject.subjectName} ({subject.subjectCode})
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteSubject}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
