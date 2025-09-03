import { useState } from "react";
import { db } from "@/api/firebase";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function AddYearLevelModal({ course, session, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [yearLevelName, setYearLevelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddYearLevel = async () => {
    if (!course || !session) {
      toast.error("Course and active session must be selected.");
      return;
    }
    if (!yearLevelName.trim()) {
      toast.error("Year level name cannot be empty.");
      return;
    }
    setIsSubmitting(true);

    const yearLevelsRef = collection(
      db,
      `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.departmentId}/courses/${course.id}/year_levels`
    );

    try {
      const q = query(
        yearLevelsRef,
        where("yearLevelName", "==", yearLevelName.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(
          `Year level "${yearLevelName.trim()}" already exists for this course.`
        );
        setIsSubmitting(false);
        return;
      }

      await addDoc(yearLevelsRef, {
        yearLevelName: yearLevelName.trim(),
        courseId: course.id,
        departmentId: session.departmentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(
        `Year level "${yearLevelName.trim()}" added to ${course.courseName}.`
      );
      setYearLevelName("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding year level:", error);
      toast.error("Failed to add year level.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" disabled={disabled}>
          <Plus className="h-4 w-4" />
          Add Year Level
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Year Level to {course?.courseName}</DialogTitle>
          <DialogDescription>
            Select a year level to add to this course. All fields marked with{" "}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>
        {/* year level selection */}
        <div className="py-4">
          <Label className="mb-2">
            Year Level <span className="text-destructive">*</span>
          </Label>
          <Select
            value={yearLevelName}
            onValueChange={setYearLevelName}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a year level" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            onClick={handleAddYearLevel}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">
                  <LoaderCircle />
                </span>
                Adding year level...
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
