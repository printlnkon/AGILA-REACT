// AddAcademicYearModal.jsx
import { useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, LoaderCircle } from "lucide-react";

export default function AddAcademicYearModal({
  open,
  onOpenChange,
  onAcademicYearAdded,
  existingYears,
}) {
  const [yearName, setYearName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearName) {
      toast.error("School Year name is required.");
      return;
    }

    const yearFormat = /^S\.Y - \d{4}-\d{4}$/;
    if (!yearFormat.test(yearName)) {
      toast.error("Invalid format. Please use 'S.Y - YYYY-YYYY'.");
      return;
    }

    if (existingYears.includes(yearName)) {
      toast.error("This school year already exists.");
      return;
    }

    setLoading(true);
    const success = await onAcademicYearAdded(yearName);
    setLoading(false);

    if (success) {
      setYearName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4" /> Add School Year
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New School Year</DialogTitle>
          <DialogDescription>Create a new school year.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="yearName">School Year</Label>
            <Input
              id="yearName"
              value={yearName}
              onChange={(e) => setYearName(e.target.value)}
              placeholder="e.g., S.Y - 2025-2026"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? (
                <>
                  <span className="animate-spin">
                    <LoaderCircle />
                  </span>
                  Adding...
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
