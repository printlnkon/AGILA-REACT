import { useState } from "react";
import { db } from "@/api/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, LoaderCircle} from "lucide-react";

export default function AddAcademicYearModal() {
  const [open, setOpen] = useState(false);
  const [yearName, setYearName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearName) {
      toast.error("Please enter an academic year name.");
      return;
    }

    const yearFormat = /^S\.Y - \d{4}-\d{4}$/;
    if (!yearFormat.test(yearName)) {
      toast.error("Invalid format. Please use the format 'S.Y - YYYY-YYYY'.");
      return;
    }

    const years = yearName.split(" - ")[1].split("-");
    const startYear = parseInt(years[0]);
    const endYear = parseInt(years[1]);

    if (endYear !== startYear + 1) {
      toast.error(
        "Invalid year range. The end year must be one year after the start year (e.g., S.Y - 2025-2026)."
      );
      return;
    }

    setLoading(true);

    // check if the academic year already exists
    const checkExistingYear = query(
      collection(db, "academic_years"),
      where("acadYear", "==", yearName)
    );
    const querySnapshot = await getDocs(checkExistingYear);
    if (!querySnapshot.empty) {
      toast.error("Academic year already exists.");
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "academic_years"), {
        acadYear: yearName,
        status: "Upcoming", // All new years start as 'upcoming'
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success("Academic Year added successfully!");
      setYearName("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Failed to add academic year.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer bg-blue-900 hover:bg-blue-700">
          <Plus />
          Add New Year
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            Add New Academic Year
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Create one session per academic year. This will be used to manage
          student enrollments, course offerings, and other academic activities.
        </DialogDescription>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yearName">Academic Year</Label>
              <Input
                id="yearName"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                placeholder="e.g., S.Y - 202X-202X"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer bg-blue-900 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
