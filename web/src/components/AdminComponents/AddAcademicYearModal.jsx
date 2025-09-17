import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Plus,
  LoaderCircle,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
} from "lucide-react";
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

function YearCalendar({
  selected,
  onSelect,
  disabledYears = [],
  initialFromYear,
}) {
  // Use the current year as default starting point
  const currentYear = new Date().getFullYear();
  const [viewStartYear, setViewStartYear] = useState(
    initialFromYear || currentYear
  );

  // Show 12 years at once (4 rows of 3)
  const yearsPerPage = 9;

  // Create array of years for current view
  const years = [];
  for (let i = 0; i < yearsPerPage; i++) {
    years.push(viewStartYear + i);
  }

  // Group years into rows of 3
  const yearRows = [];
  for (let i = 0; i < years.length; i += 3) {
    yearRows.push(years.slice(i, i + 3));
  }

  // Navigate to previous set of years
  const goToPreviousYears = () => {
    setViewStartYear((prevYears) => prevYears - yearsPerPage);
  };

  // Navigate to next set of years
  const goToNextYears = () => {
    setViewStartYear((prevYears) => prevYears + yearsPerPage);
  };

  // Check if a year is the selected year
  const isSelectedYear = (year) => {
    if (!selected) return false;
    return selected.getFullYear() === year;
  };

  // Check if a year is disabled
  const isDisabledYear = (year) => {
    return year < currentYear || disabledYears.includes(year);
  };

  return (
    <div className="p-3 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        {/* left button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToPreviousYears}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous years</span>
        </Button>

        <div className="text-sm font-medium">
          {viewStartYear} - {viewStartYear + yearsPerPage - 1}
        </div>

        {/* right button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToNextYears}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next years</span>
        </Button>
      </div>

      <div className="space-y-2">
        {yearRows.map((row, i) => (
          <div key={i} className="flex gap-2 justify-center">
            {row.map((year) => (
              <Button
                key={year}
                variant={isSelectedYear(year) ? "default" : "outline"}
                className={cn(
                  "h-9 flex-1 text-sm",
                  isDisabledYear(year) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isDisabledYear(year)}
                onClick={() => {
                  if (!isDisabledYear(year)) {
                    const date = new Date(year, 0, 1);
                    onSelect(date);
                  }
                }}
              >
                {year}
              </Button>
            ))}
          </div>
        ))}
      </div>

      {currentYear !== viewStartYear && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs cursor-pointer"
            onClick={() => setViewStartYear(currentYear)}
          >
            Go to Current Year
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AddAcademicYearModal({
  open,
  onOpenChange,
  onAcademicYearAdded,
  existingYears,
  academicYearsList = [],
}) {
  const [selectedDate, setSelectedDate] = useState();
  const [loading, setLoading] = useState(false);
  const [canAddYear, setCanAddYear] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [disabledYears, setDisabledYears] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // copy settings states
  const [enableCopy, setEnableCopy] = useState(false);
  const [copyFromYear, setCopyFromYear] = useState("");

  // extract existing years and create disabled years
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const existingStartYears = [];

    // extract start years from existing academic years
    if (existingYears && existingYears.length > 0) {
      existingYears.forEach((year) => {
        const match = year.match(/S\.Y - (\d{4})-\d{4}/);
        if (match && match[1]) {
          existingStartYears.push(parseInt(match[1]));
        }
      });
    }

    setDisabledYears(existingStartYears);

    // Set default selected year to first available starting from current year
    let defaultYear = currentYear;
    while (
      existingStartYears.includes(defaultYear) &&
      defaultYear < currentYear + 20
    ) {
      defaultYear++;
    }

    if (defaultYear < currentYear + 100) {
      // Arbitrary large number to ensure we find something
      setSelectedDate(new Date(defaultYear, 0, 1));
      setCanAddYear(true);
      setErrorMessage("");
    } else {
      setCanAddYear(false);
      setErrorMessage("No available academic years to add.");
    }
  }, [existingYears]);

  const handleDateChange = (date) => {
    setSelectedDate(date);

    // Check if the selected year is disabled
    const selectedYear = date.getFullYear();
    const isDisabledYear = disabledYears.includes(selectedYear);

    if (isDisabledYear) {
      setCanAddYear(false);
      setErrorMessage(
        `Academic year starting in ${selectedYear} already exists.`
      );
    } else {
      setCanAddYear(true);
      setErrorMessage("");
    }
  };

  const formatAcademicYear = (date) => {
    if (!date) return "";
    const startYear = date.getFullYear();
    const endYear = startYear + 1;
    return `S.Y - ${startYear}-${endYear}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAddYear) {
      toast.error(errorMessage || "Cannot add this academic year.");
      return;
    }

    if (!selectedDate) {
      toast.error("No valid academic year to add.");
      return;
    }

    const academicYearFormat = formatAcademicYear(selectedDate);
    setLoading(true);

    // copy settings if enabled
    const copyData =
      enableCopy && copyFromYear ? { copyFrom: copyFromYear } : null;

    const success = await onAcademicYearAdded(academicYearFormat, copyData);
    setLoading(false);

    if (success) {
      onOpenChange(false);
    }
  };

   const resetFormState = () => {
    setEnableCopy(false);
    setCopyFromYear("");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // reset the form state when the dialog is closed.
      resetFormState();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4" /> Add School Year
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add School Year</DialogTitle>
          <DialogDescription>
            Select a starting year for the new school year.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-4">
            <Label htmlFor="schoolYear">Select Starting Year</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
              <div className="mt-2 text-sm">
                School Year <strong>{formatAcademicYear(selectedDate)}</strong>{" "}
                will be created
              </div>
            )}

            {/* copy settings */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="enableCopy"
                  checked={enableCopy}
                  onCheckedChange={setEnableCopy}
                />
                <Label
                  htmlFor="enableCopy"
                  className="flex items-center cursor-pointer"
                >
                  Copy configurations from previous school year
                </Label>
              </div>

              {enableCopy && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="copyFromYear" className="mb-2">
                      Copy from:
                    </Label>
                    <Select
                      value={copyFromYear}
                      onValueChange={setCopyFromYear}
                      disabled={!enableCopy}
                    >
                      <SelectTrigger id="copyFromYear" className="w-full mt-1">
                        <SelectValue placeholder="Select school year" />
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

                  {copyFromYear !== "" && (
                    <Card className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1.5">
                          <Info />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            All configuration collections will be copied,
                            including:
                          </p>
                          <ul className="mt-2 grid grid-cols-1 gap-y-1 text-sm text-muted-foreground list-disc list-inside sm:grid-cols-1 sm:gap-x-6">
                            <li>Semesters</li>
                            <li>Departments & Courses</li>
                            <li>Year Levels & Sections</li>
                            <li>Subjects</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
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
              disabled={
                loading ||
                !canAddYear ||
                !selectedDate ||
                (enableCopy && !copyFromYear)
              }
              className="cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">
                    <LoaderCircle />
                  </span>
                  Adding school year...
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
