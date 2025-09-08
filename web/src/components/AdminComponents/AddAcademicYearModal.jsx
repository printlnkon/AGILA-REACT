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
import { Plus, LoaderCircle, CalendarCheck, } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [availableYears, setAvailableYears] = useState([]);

  // Generate available years when component mounts or when existingYears changes
  useEffect(() => {
    generateAvailableYears();
  }, [existingYears]);

  const generateAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const yearOptions = [];

    // Generate 10 years options (current year and 9 future years)
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      const yearOption = `S.Y - ${startYear}-${endYear}`;

      // Check if this year already exists in existingYears
      const isDisabled = existingYears && existingYears.includes(yearOption);

      yearOptions.push({
        value: yearOption,
        label: yearOption,
        disabled: isDisabled,
      });
    }

    setAvailableYears(yearOptions);

    // Select the first non-disabled year as default
    const firstAvailableYear = yearOptions.find((year) => !year.disabled);
    if (firstAvailableYear) {
      setNextAcademicYear(firstAvailableYear.value);
      setCanAddYear(true);
      setErrorMessage("");
    } else {
      setCanAddYear(false);
      setErrorMessage("No available academic years to add.");
    }
  };

  const handleYearChange = (value) => {
    setNextAcademicYear(value);
    setCanAddYear(true);
    setErrorMessage("");
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
          <DialogTitle>Add School Year</DialogTitle>
          <DialogDescription>
            Select a school year to add to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-4">
            <Label htmlFor="schoolYear">Select School Year</Label>
            <Select
              value={nextAcademicYear}
              onValueChange={handleYearChange}
              disabled={availableYears.length === 0}
            >
              <SelectTrigger className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  <SelectValue placeholder="Select a school year" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem
                    key={year.value}
                    value={year.value}
                    disabled={year.disabled}
                  >
                    {year.disabled ? `${year.label}` : year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
