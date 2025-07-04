import { useState } from "react";
import { db } from "@/api/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AddSemesterModal({
  activeAcadYear,
  onSemesterAdded,
  loading,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSemester, setNewSemester] = useState({
    semesterName: "",
    startDate: "",
    endDate: "",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewSemester((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddSemester = async () => {
    if (!newSemester.semesterName || !newSemester.startDate || !newSemester.endDate) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (!activeAcadYear) {
      toast.error("No active academic year found to add a semester to.");
      return;
    }

    setIsSubmitting(true);
    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        activeAcadYear.id,
        "semesters"
      );
      await addDoc(semestersColRef, {
        ...newSemester,
        status: "Inactive", // New semesters are inactive by default
      });
      toast.success(`Semester "${newSemester.semesterName}" added successfully.`);
      setNewSemester({ semesterName: "", startDate: "", endDate: "" });
      setIsModalOpen(false);
      onSemesterAdded(); // Call the callback to refresh the list
    } catch (error) {
      console.error("Error adding semester: ", error);
      toast.error("Failed to add semester.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-blue-900 hover:bg-blue-700">
          <Plus />
          Add Semester
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
          <DialogDescription>
            Add a new semester for the active academic year.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="semesterName" className="text-right">
              Semester
            </Label>
            <Input
              id="semesterName"
              value={newSemester.semesterName}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="e.g., 1st Semester"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={newSemester.startDate}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={newSemester.endDate}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting} className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleAddSemester} disabled={isSubmitting} className="bg-blue-900 hover:bg-blue-700 cursor-pointer">
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
