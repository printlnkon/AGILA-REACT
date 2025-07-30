import { useState } from "react";
import { db } from "@/api/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, LoaderCircle, Check } from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AddCourseModal({
  activeSession,
  disabled,
  department,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCourseName("");
    setCourseCode("");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    setIsOpen(isOpen);
  };

  const handleAddCourse = async () => {
    if (
      !department ||
      !department.id ||
      !department.academicYearId ||
      !department.semesterId
    ) {
      toast.error("Cannot add course without complete department information.");
      return;
    }

    if (!activeSession || !activeSession.id) {
      toast.error("Cannot add course without an active academic session.");
      return;
    }

    if (!department || !department.id) {
      toast.error("Department must be selected to add a course.");
      return;
    }

    if (!courseName.trim() || !courseCode.trim()) {
      toast.error("Course name and code cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const coursesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${department.id}/courses`;
      const coursesRef = collection(db, coursesPath);

      // Check if course with the same name or code already exists
      const qName = query(
        coursesRef,
        where("courseName", "==", courseName.trim())
      );
      const qCode = query(
        coursesRef,
        where("courseCode", "==", courseCode.trim())
      );

      const [nameSnapshot, codeSnapshot] = await Promise.all([
        getDocs(qName),
        getDocs(qCode),
      ]);

      if (!nameSnapshot.empty) {
        toast.error(
          `Course "${courseName.trim()}" already exists in this department.`
        );
        setIsSubmitting(false);
        return;
      }

      if (!codeSnapshot.empty) {
        toast.error(
          `Course code "${courseCode.trim()}" already exists in this department.`
        );
        setIsSubmitting(false);
        return;
      }

      // Add course to the department
      await addDoc(coursesRef, {
        courseName: courseName.trim(),
        courseCode: courseCode.trim(),
        departmentId: department.id,
        departmentName: department.departmentName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(
        `Course "${courseName.trim()}" has been added to ${
          department.departmentName
        }.`
      );
      resetForm();
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="cursor-pointer pt-2 mt-auto flex"
          disabled={disabled}
        >
          <Plus />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            Add Course to {department?.departmentName || ""}
          </DialogTitle>
          <DialogDescription>
            Enter a name and code for the new course. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., Bachelor of Science in Information Technology"
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="courseCode">Course Code</Label>
            <Input
              id="courseCode"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g., BSIT-1"
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCourse}
            disabled={isSubmitting}
            className="bg-primary cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">
                  <LoaderCircle />
                </span>
                Adding...
              </>
            ) : (
              <>Add</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
