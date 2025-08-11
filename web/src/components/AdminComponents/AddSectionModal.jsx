import { useState } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
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

export default function AddSectionModal({ course, yearLevel, session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSection = async () => {
    if (
      !session?.id ||
      !session?.semesterId ||
      !session?.departmentId ||
      !course?.id ||
      !yearLevel?.id
    ) {
      toast.error(
        "Cannot add section: Required information is missing. Please refresh and try again."
      );
      console.error("Missing props in AddSectionModal:", {
        session,
        course,
        yearLevel,
      });
      return;
    }

    if (!sectionName.trim()) {
      toast.error("Section name cannot be empty.");
      return;
    }
    setIsSubmitting(true);

    const sectionsRef = collection(
      db,
      `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.departmentId}/courses/${course.id}/year_levels/${yearLevel.id}/sections`
    );

    try {
      const q = query(
        sectionsRef,
        where("sectionName", "==", sectionName.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(`Section "${sectionName.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      await addDoc(sectionsRef, {
        sectionName: sectionName.trim(),
        yearLevelId: yearLevel.id,
        courseId: course.id,
        departmentId: session.departmentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(
        `Section "${sectionName.trim()}" added to ${yearLevel.yearLevelName}.`
      );
      setSectionName("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to add section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus />
          Add Section
        </Button>
      </DialogTrigger>

      {/* add section dialog */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Section to {yearLevel?.yearLevelName}</DialogTitle>
          <DialogDescription>
            Enter the name for the new section.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="mb-2">Section Name</Label>
          <Input
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="e.g., BSIT-1101"
            disabled={isSubmitting}
          />
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
            className="cursor-pointer"
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
