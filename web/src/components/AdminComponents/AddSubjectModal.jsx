import { db } from "@/api/firebase";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Plus, LoaderCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
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
import DuplicateSubjectForm from "@/components/AdminComponents/DuplicateSubjectForm";

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

// send notification to program head(s)
const sendProgramHeadNotification = async (subject) => {
  try {
    const programHeadsQuery = query(
      collection(db, "users/program_head/accounts"),
      where("departmentName", "==", subject.departmentName)
    );

    const programHeadsSnapshot = await getDocs(programHeadsQuery);

    if (programHeadsSnapshot.empty) {
      console.log("No program head found for this department");
      return false;
    }

    // create notifications for each program head
    const notificationPromises = programHeadsSnapshot.docs.map(
      async (phDoc) => {
        const programHeadId = phDoc.id;
        return addDoc(collection(db, "notifications"), {
          userId: programHeadId,
          userType: "program_head",
          title: "New Subject Added",
          message: `A new subject "${subject.subjectCode} - ${subject.subjectName}" has been added and requires your approval.`,
          subjectId: subject.id,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          createdAt: serverTimestamp(),
          read: false,
        });
      }
    );

    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error("Error sending program head notification:", error);
    return false;
  }
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
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDuplicationComplete, setIsDuplicationComplete] = useState(false);
  const [sourceSubject, setSourceSubject] = useState(null);

  // reset form
  useEffect(() => {
    if (!isOpen) {
      setSubjectFormData(INITIAL_SUBJECT_DATA);
      setFormErrors({});
      setIsDuplicating(false);
      setIsDuplicationComplete(false);
      setSourceSubject(null);
    }
  }, [isOpen]);

  const handleSubjectSelectedForDuplication = useCallback((subjectData) => {
    setSubjectFormData({
      subjectCode: subjectData.subjectCode,
      subjectName: subjectData.subjectName,
      description: subjectData.description || "",
      units: subjectData.units.toString(),
      withLaboratory: subjectData.withLaboratory || false,
    });
    setFormErrors({});
    setSourceSubject(subjectData);
  }, []);

  const handleDuplicationCompletion = useCallback((isComplete) => {
    setIsDuplicationComplete(isComplete);
  }, []);

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

    if (isDuplicating && !isDuplicationComplete) {
      toast.error("Please select a subject to duplicate", {
        description:
          "You must complete the duplication selection process before adding.",
      });
      return;
    }

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
      const newStatus =
        isDuplicating && sourceSubject?.status
          ? sourceSubject.status
          : "Pending";

      const subjectPath = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.selectedDeptId}/courses/${session.selectedCourseId}/year_levels/${session.selectedYearLevelId}/subjects`;
      const newSubjectData = {
        ...subjectFormData,
        status: newStatus,
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
          userName:
            currentUser.firstName || currentUser.name || currentUser.email,
          userRole: currentUser.role,
        },
      };

      const docRef = await addDoc(collection(db, subjectPath), newSubjectData);
      const newSubject = { ...newSubjectData, id: docRef.id };

      // send notification if the subject needs approval "Pending"
      if (newStatus === "Pending") {
        await sendProgramHeadNotification(newSubject);
      }

      onSubjectAdded(newSubject);
      toast.success("Subject added successfully");

      onOpenChange(false);
    } catch (err) {
      console.error("Error adding subject:", err);
      toast.error("Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || (isDuplicating && !isDuplicationComplete);

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
          <div className="space-y-2 border p-4 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDuplicating"
                checked={isDuplicating}
                onCheckedChange={(checked) => {
                  setIsDuplicating(checked);
                  if (!checked) {
                    setSubjectFormData(INITIAL_SUBJECT_DATA);
                    setFormErrors({});
                    setSourceSubject(null);
                  }
                }}
              />
              <Label htmlFor="isDuplicating" className="font-semibold">
                Duplicate subject from another department/course
              </Label>
            </div>

            {isDuplicating && (
              <DuplicateSubjectForm
                session={session}
                onSubjectSelected={handleSubjectSelectedForDuplication}
                onCompletionStateChange={handleDuplicationCompletion}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={isDuplicating}
              />
              <FormError message={formErrors.subjectCode} />
            </div>
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
                disabled={isDuplicating}
              />
              <FormError message={formErrors.subjectName} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="units">
                Units <span className="text-destructive">*</span>
              </Label>
              <Select
                value={subjectFormData.units}
                onValueChange={handleSelectChange}
                disabled={isDuplicating}
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
                disabled={isDuplicating}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter a brief description of the subject"
              value={subjectFormData.description}
              onChange={handleChange}
              disabled={isDuplicating}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isDisabled}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">
                    <LoaderCircle />
                  </span>
                  Adding Subject...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
