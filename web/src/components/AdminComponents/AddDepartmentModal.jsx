import { useState } from "react";
import { db } from "@/api/firebase";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Plus } from "lucide-react";

export default function AddDepartmentModal({ activeSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNewDepartmentName("");
  };

  // Reset form when modal opens
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    setIsOpen(isOpen);
  };

  // adding a new department
  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error("Department name cannot be empty.");
      return;
    }

    if (!activeSession || !activeSession.id || !activeSession.semesterId) {
      toast.error(
        `No active semester found for academic year ${
          activeSession?.academicYear || "Unknown"
        }.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const departmentsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
      const departmentsRef = collection(db, departmentsPath);

      // Check if department already exists
      const q = query(
        departmentsRef,
        where("departmentName", "==", newDepartmentName.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(`Department "${newDepartmentName.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      // Add the department
      await addDoc(departmentsRef, {
        departmentName: newDepartmentName.trim(),
        academicYearId: activeSession.id,
        semesterId: activeSession.semesterId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`"${newDepartmentName.trim()}" added successfully.`);

      setNewDepartmentName("");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding department:", error);
      toast.error("Failed to add department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer mr-2">
          <Plus />
          Add Department
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Enter a name for the new department. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departmentName">Department Name</Label>
            <Input
              id="departmentName"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="e.g., Department of Information Technology"
              className="col-span-3 w-full"
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
            onClick={handleAddDepartment}
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
