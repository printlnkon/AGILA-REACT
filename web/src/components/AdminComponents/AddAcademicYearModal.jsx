// AddAcademicYearModal.jsx
import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Plus, LoaderCircle, CalendarCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AddAcademicYearModal({
  open,
  onOpenChange,
  onAcademicYearAdded,
  existingYears,
}) {
  const [nextAcademicYear, setNextAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [canAddYear, setCanAddYear] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // calculate the next academic year when component mounts or when existingyears changes
  useEffect(() => {
    calculateNextAcademicYear();
  }, [existingYears]);

  const calculateNextAcademicYear = () => {
    if (!existingYears || existingYears.length === 0) {
      // if no years exist yet, start with the current year
      const currentYear = new Date().getFullYear();
      setNextAcademicYear(`S.Y - ${currentYear}-${currentYear + 1}`);
      setCanAddYear(true);
      setErrorMessage("");
      return;
    }

    // sort existing years to find the most recent one
    const sortedYears = [...existingYears].sort((a, b) => {
      const yearA = parseInt(a.split("-")[1]);
      const yearB = parseInt(b.split("-")[1]);
      return yearB - yearA;
    });

    const latestYear = sortedYears[0];

    // extract the end year from the latest academic year
    const match = latestYear.match(/(\d{4})-(\d{4})/);

    if (!match) {
      setCanAddYear(false);
      setErrorMessage(
        "Unable to determine the next academic year due to invalid format."
      );
      return;
    }

    const endYear = parseInt(match[2]);
    const nextStartYear = endYear;
    const nextEndYear = endYear + 1;

    const proposedNextYear = `S.Y - ${nextStartYear}-${nextEndYear}`;

    if (existingYears.includes(proposedNextYear)) {
      setCanAddYear(false);
      setErrorMessage("The next sequential academic year already exists.");
    } else {
      setNextAcademicYear(proposedNextYear);
      setCanAddYear(true);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAddYear) {
      toast.error(errorMessage || "Cannot add this academic year.");
      return;
    }

    if (!nextAcademicYear) {
      toast.error("No valid academic year to add.");
      return;
    }

    setLoading(true);
    const success = await onAcademicYearAdded(nextAcademicYear);
    setLoading(false);

    if (success) {
      toast.success(
        `Academic year ${nextAcademicYear} has been added successfully.`
      );
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" /> Add School Year
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add School Year</DialogTitle>
          <DialogDescription>
            Add <strong>{nextAcademicYear}</strong> school year to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="nextYear">Next School Year</Label>
            <div className="flex items-center p-3 border rounded-md bg-muted/20">
              <CalendarCheck className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">
                {nextAcademicYear || "No available academic year"}
              </span>
            </div>

            {!canAddYear && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  {errorMessage ||
                    "Cannot add the next academic year at this time."}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading || !canAddYear || !nextAcademicYear}
              className="cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">
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
