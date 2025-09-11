import { db } from "@/api/firebase";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogTrigger,
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
import { useAuth } from "@/context/AuthContext";

const INITIAL_SUBJECT_DATA = {
  subjectCode: "",
  subjectName: "",
  description: "",
  units: "",
  withLaboratory: false,
};

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="text-sm text-destructive mt-1 flex items-center gap-1">
      <X className="w-4 h-4" />
      {message}
    </div>
  );
};

export default function AddSubjectModal({
  isOpen,
  onOpenChange,
  onSubjectAdded,
  session,
}) {
  const { currentUser } = useAuth();
  const [subjectFormData, setSubjectFormData] = useState(INITIAL_SUBJECT_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reset form
  useEffect(() => {
    if (!isOpen) {
      setSubjectFormData(INITIAL_SUBJECT_DATA);
      setFormErrors({});
    }
  }, [isOpen]);

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

  const handleSelectChange = (value) => {
    setSubjectFormData((prev) => ({ ...prev, units: value }));
    if (formErrors.units) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.units;
        return newErrors;
      });
    }
  };

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

    if (!data.units || data.units.trim() === "") {
      errors.units = "Select a unit value";
    }

    return errors;
  };

  const handleAddSubject = async (e) => {
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

    if (!currentUser) {
      toast.error(
        "Authentication error: You must be logged in to add subjects."
      );
      setIsSubmitting(false);
      return;
    }

    if (!session.selectedYearLevelId) {
      toast.error("Please select a year level to add a subject.");
      setIsSubmitting(false);
      return;
    }

    try {
      const subjectPath = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.selectedDeptId}/courses/${session.selectedCourseId}/year_levels/${session.selectedYearLevelId}/subjects`;
      const newSubjectData = {
        ...subjectFormData,
        status: "Pending",
        units: parseFloat(subjectFormData.units),
        withLaboratory: subjectFormData.withLaboratory || false,
        createdAt: serverTimestamp(),
        academicYearId: session.id,
        semesterId: session.semesterId,
        departmentId: session.selectedDeptId,
        courseId: session.selectedCourseId,
        yearLevelId: session.selectedYearLevelId,
        departmentName: session.selectedDeptName || null,
        courseName: session.selectedCourseName || null,
        yearLevelName: session.selectedYearLevelName || null,
        createdBy: {
          userId: currentUser.uid,
          userName: currentUser.firstName || currentUser.name || currentUser.email,
          userRole: currentUser.role
        }
      };

      const docRef = await addDoc(collection(db, subjectPath), newSubjectData);
      onSubjectAdded({ ...newSubjectData, id: docRef.id });
      toast.success("Subject added successfully");

      onOpenChange(false);
    } catch (err) {
      console.error("Error adding subject:", err);
      toast.error("Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="cursor-pointer"
          disabled={!session || !session.selectedYearLevelId}
        >
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Subject</DialogTitle>
          <DialogDescription>
            Add a new subject. All fields marked with{" "}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleAddSubject}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* subject code */}
            <div className="space-y-1">
              <Label htmlFor="subjectCode">
                Subject Code <span className="text-destructive">*</span>
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
                Subject Name <span className="text-destructive">*</span>
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
                Units <span className="text-destructive">*</span>
              </Label>
              <Select
                value={subjectFormData.units}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="1.5">1.5</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
              <FormError message={formErrors.units} />
            </div>
            {/* w/ laboratory checkbox */}
            <div className="space-y-1 flex items-center gap-2 mt-2">
              <Label htmlFor="withLaboratory">W/ Laboratory</Label>
              <Checkbox
                id="withLaboratory"
                checked={subjectFormData.withLaboratory}
                onCheckedChange={(checked) => {
                  setSubjectFormData((prev) => ({
                    ...prev,
                    withLaboratory: checked,
                  }));
                }}
              />
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
              onClick={() => onOpenChange(false)}
              disabled={isDisabled}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isDisabled}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
