import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";

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

  if (!data.department) {
    errors.department = "Department is required";
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
  departments,
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

  // Handle select changes for edit dialog
  const handleSelectChange = (id, value) => {
    const dept = departments.find((d) => d.id === value);
    setSubjectFormData((prev) => ({
      ...prev,
      [id]: value,
      ...(id === "department"
        ? { departmentName: dept?.departmentName || "" }
        : {}),
    }));
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Handle edit subject form submission
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
      // Mock successful update
      console.log("Subject updated:", subjectFormData);

      // Call the parent component's update handler
      onSubjectUpdated(subjectFormData);

      toast.success("Subject updated successfully");
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating subject:", err);
      toast.error("Failed to update subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete subject confirmation
  const handleDeleteSubject = async () => {
    try {
      // Mock successful deletion
      console.log("Subject deleted:", subject.id);

      // Call the parent component's delete handler
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
            <div>
              <CardTitle className="text-lg font-bold">
                {/* subj name */}
                {subject.subjectName}
              </CardTitle>
              <CardDescription className="text-sm font-mono mt-1">
                {/* subj code */}
                {subject.subjectCode}
                {/* subj description */}
                {subject.description && (
                  <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </div>
                )}
              </CardDescription>
            </div>
            <span className="font-medium text-muted-foreground">Units:</span>
            <span>{subject.units}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1">
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">
                Department:
              </span>{" "}
              <span>{subject.departmentName}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-1 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="cursor-pointer"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardFooter>
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

              {/* department */}
              <div className="space-y-1">
                <Label htmlFor="department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  onValueChange={(value) =>
                    handleSelectChange("department", value)
                  }
                  value={subjectFormData.department}
                >
                  <SelectTrigger id="department" className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={formErrors.department} />
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

            {/* active status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={subjectFormData.isActive}
                onCheckedChange={(checked) => {
                  setSubjectFormData((prev) => ({
                    ...prev,
                    isActive: checked,
                  }));
                }}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Active
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
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
              Are you sure you want to delete **{subject.subjectName} (
              {subject.subjectCode})**? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
