import { db } from "@/api/firebase";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
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

const INITIAL_SUBJECT_DATA = {
  subjectCode: "",
  subjectName: "",
  description: "",
  units: 0,
};

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="text-sm text-red-500 mt-1 flex items-center gap-1">
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
  const [subjectFormData, setSubjectFormData] = useState(INITIAL_SUBJECT_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The modal will be opened based on the `session` prop,
  // so no need to fetch anything inside the modal itself.

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
    if (!session.selectedYearLevelId) {
      toast.error("Please select a year level to add a subject.");
      setIsSubmitting(false);
      return;
    }

    try {
      const subjectPath = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.selectedDeptId}/courses/${session.selectedCourseId}/year_levels/${session.selectedYearLevelId}/subjects`;
      const newSubjectData = {
        ...subjectFormData,
        units: Number(subjectFormData.units),
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, subjectPath), newSubjectData);
      onSubjectAdded({ ...newSubjectData, id: docRef.id });
      toast.success("Subject added successfully");
      onOpenChange(false);
      setSubjectFormData(INITIAL_SUBJECT_DATA);
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
            <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleAddSubject}>
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
              {isSubmitting ? "Adding..." : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
