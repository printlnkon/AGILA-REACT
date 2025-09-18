import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  LoaderCircle,
  CalendarIcon,
  ChevronDown,
  Info,
} from "lucide-react";
import { YearCalendar } from "@/components/ui/year-calendar";

export default function AddAcademicYearModal({
  open,
  onOpenChange,
  onAcademicYearAdded,
  existingYears,
  academicYearsList = [],
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [disabledYears, setDisabledYears] = useState([]);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [enableCopy, setEnableCopy] = useState(false);
  const [copyFromYear, setCopyFromYear] = useState("");
  const canAddYear = !errorMessage;

  // set up the component based on existing academic years
  useEffect(() => {
    const currentYear = new Date().getFullYear();

    // extract start years from the "s.y - yyyy-yyyy" format
    const existingStartYears = existingYears
      ? existingYears
          .map((year) => parseInt(year.slice(6, 10), 10))
          .filter(Boolean)
      : [];

    setDisabledYears(existingStartYears);

    // find the first available year to suggest as a default.
    let defaultYear = currentYear;
    while (existingStartYears.includes(defaultYear)) {
      defaultYear++;
    }

    setSelectedDate(new Date(defaultYear, 0, 1));
    setErrorMessage("");
  }, [existingYears, open]); // Re-run when modal is opened

  // --- HANDLERS ---
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAddYear || !selectedDate) {
      toast.error(errorMessage || "No valid academic year to add.");
      return;
    }

    const academicYearFormat = `S.Y - ${selectedDate.getFullYear()}-${
      selectedDate.getFullYear() + 1
    }`;
    setLoading(true);

    const copyData =
      enableCopy && copyFromYear ? { copyFrom: copyFromYear } : null;
    const success = await onAcademicYearAdded(academicYearFormat, copyData);

    setLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setEnableCopy(false);
    setCopyFromYear("");
    setErrorMessage("");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto cursor-pointer">
          <Plus className="h-4 w-4" /> Add School Year
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New School Year</DialogTitle>
          <DialogDescription>
            Select a starting year. The end year will be set automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolYear">Select Starting Year</Label>
            <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="schoolYear"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "yyyy")
                    : "Select a year"}
                  <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <YearCalendar
                  selected={selectedDate}
                  onSelect={(date) => {
                    handleDateChange(date);
                    setCalendarOpen(false);
                  }}
                  disabledYears={disabledYears}
                  initialFromYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>

            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                This will create:{" "}
                <strong>{`S.Y - ${selectedDate.getFullYear()}-${
                  selectedDate.getFullYear() + 1
                }`}</strong>
              </p>
            )}
          </div>

          {/* copy settings section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableCopy"
                checked={enableCopy}
                onCheckedChange={setEnableCopy}
              />
              <Label
                htmlFor="enableCopy"
                className="font-medium cursor-pointer"
              >
                Copy settings from a previous year?
              </Label>
            </div>

            {enableCopy && (
              <div className="space-y-4 pl-2">
                <div>
                  <Label htmlFor="copyFromYear">Copy from:</Label>
                  <Select value={copyFromYear} onValueChange={setCopyFromYear}>
                    <SelectTrigger id="copyFromYear" className="w-full mt-1">
                      <SelectValue placeholder="Select a school year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsList.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.acadYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {copyFromYear && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>What will be copied?</AlertTitle>
                    <AlertDescription>
                      All configurations will be duplicated, including:
                      • Semesters <br />
                      • Departments <br />
                      • Courses <br />
                      • Subjects <br />
                      • Sections <br />• Year Levels
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={
                loading ||
                !canAddYear ||
                !selectedDate ||
                (enableCopy && !copyFromYear)
              }
            >
              {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {loading ? "Adding..." : "Add School Year"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
