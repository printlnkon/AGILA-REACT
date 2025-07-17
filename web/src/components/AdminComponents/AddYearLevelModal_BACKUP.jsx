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

export default function AddYearLevelModal({ activeSession, disabled }) {
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
      const yearLevelsRef = collection(db, "year_levels");

      const q = query(
        yearLevelsRef,
        where("yearLevelName", "==", yearLevelName.trim()),
        where("academicYearId", "==", activeSession.id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(`Year level "${yearLevelName.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, "year_levels"), {
        yearLevelName: yearLevelName.trim(),
        academicYearId: activeSession.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      });

      toast.success(`Year level "${yearLevelName.trim()}" has been added.`);
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
