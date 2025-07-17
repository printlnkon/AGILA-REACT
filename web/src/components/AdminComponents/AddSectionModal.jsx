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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, LoaderCircle } from "lucide-react";

// Update the props to receive the complete yearLevel object instead of just id and name
export default function AddSectionModal({
  activeSession,
  disabled,
  yearLevel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSectionName("");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    setIsOpen(isOpen);
  };

  const handleAddSection = async () => {
    if (!activeSession || !activeSession.id) {
      toast.error("Cannot add section without an active academic session.");
      return;
    }

    if (!yearLevel || !yearLevel.id) {
      toast.error("Year level must be selected to add a section.");
      return;
    }

    if (!sectionName.trim()) {
      toast.error("Section name cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const sectionsRef = collection(
        db,
        `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/year_levels/${yearLevel.id}/sections`
      );

      // Check if section with the same name already exists for this year level
      const q = query(
        sectionsRef,
        where("sectionName", "==", sectionName.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(
          `Section "${sectionName.trim()}" already exists for ${
            yearLevel.yearLevelName
          }.`
        );
        setIsSubmitting(false);
        return;
      }

      // Add section to year level
      await addDoc(sectionsRef, {
        sectionName: sectionName.trim(),
        yearLevelId: yearLevel.id,
        yearLevelName: yearLevel.yearLevelName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(
        `Section "${sectionName.trim()}" has been added to ${
          yearLevel.yearLevelName
        }.`
      );
      setSectionName("");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" disabled={disabled}>
          <Plus />
          Add Section
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add Section to {yearLevel?.yearLevelName || ""}
          </DialogTitle>
          <DialogDescription>
            Enter a name for the new section. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sectionName">Section Name</Label>
            <Input
              id="sectionName"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g., A, B, IT-1A"
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
            onClick={handleAddSection}
            disabled={isSubmitting}
            className="bg-primary cursor-pointer"
          >
            {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
