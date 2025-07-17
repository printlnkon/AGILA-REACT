import { useState } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, LoaderCircle } from "lucide-react";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function AddYearLevelModal({ activeSession, disabled, onYearLevelAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [yearLevelName, setYearLevelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setYearLevelName("");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    setIsOpen(isOpen);
  };

  const handleAddYearLevel = async () => {
    if (!activeSession || !activeSession.id) {
      toast.error("Cannot add year level without an active academic session.");
      return;
    }
    if (!yearLevelName.trim()) {
      toast.error("Year level name cannot be empty.");
      return;
    }
    setIsSubmitting(true);

    try {
      // Extract academic year and semester from activeSession
      const academicYear = activeSession.acadYear;
      const semester = activeSession.semesterName;

      if (!academicYear || !semester) {
        console.error("Active session data:", activeSession);
        toast.error("Academic year or semester information is missing.");
        setIsSubmitting(false);
        return;
      }

      // Create hierarchical path: academic_years/{academicYearId}/semesters/{semesterId}/year_levels
      const academicYearRef = doc(db, "academic_years", activeSession.id);
      const semestersRef = collection(academicYearRef, "semesters");
      const semesterQuery = query(semestersRef, where("semesterName", "==", semester));
      const semesterSnapshot = await getDocs(semesterQuery);

      let semesterId;

      if (semesterSnapshot.empty) {
        // Create the semester if it doesn't exist
        const newSemesterRef = await addDoc(semestersRef, {
          semesterName: semester,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        semesterId = newSemesterRef.id;
      } else {
        semesterId = semesterSnapshot.docs[0].id;
      }

      // Reference to the year_levels collection under this specific semester
      const yearLevelsRef = collection(
        db,
        `academic_years/${activeSession.id}/semesters/${semesterId}/year_levels`
      );

      // Check if year level already exists in this semester
      const q = query(
        yearLevelsRef,
        where("yearLevelName", "==", yearLevelName.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(
          `Year level "${yearLevelName.trim()}" already exists in this semester.`
        );
        setIsSubmitting(false);
        return;
      }

      // Add the year level to the nested collection
      await addDoc(yearLevelsRef, {
        academicYearId: activeSession.id,
        semesterId: semesterId,
        yearLevelName: yearLevelName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      toast.success(
        `Year level "${yearLevelName.trim()}" has been added to ${academicYear}, ${semester}.`
      );

      if (onYearLevelAdded) {
        onYearLevelAdded();
      }

      setYearLevelName("");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding year level:", error);
      toast.error("Failed to add year level. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer mr-2" disabled={disabled}>
          <Plus />
          Add Year Level
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Year Level</DialogTitle>
          <DialogDescription>
            Enter the name for the new year level. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Year Name
            </Label>
            <Select
              value={yearLevelName}
              onValueChange={(value) => {
                setYearLevelName(value);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="yearLevelSelect" className="col-span-3 w-full">
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
            className="bg-primary cursor-pointer"
          >
            {isSubmitting ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
