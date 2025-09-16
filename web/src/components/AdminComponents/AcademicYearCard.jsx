// AcademicYearCard.jsx
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Check,
  Trash2,
  CalendarDays,
  LoaderCircle,
  Edit,
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import SemesterCard from "@/components/AdminComponents/SemesterCard";

// Year Calendar Component
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

  // Show 9 years at once (3 rows of 3)
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
          disabled={viewStartYear <= currentYear}
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

const toDate = (timestamp) => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date;
};

const getStatusConfig = (status) => {
  const config = {
    Active: "bg-green-600 text-white hover:bg-green-700",
    Archived: "bg-red-600 text-white hover:bg-red-700",
    Upcoming: "bg-blue-600 text-white hover:bg-blue-700",
  };
  return config[status] || "bg-gray-500 text-white";
};

export default function AcademicYearCard({
  acadYear,
  onSetActive,
  onDelete,
  onUpdate,
  onAddSemesterClick,
  isActivating,
  handleSetActiveSemester,
  handleDeleteSemester,
  actionLoading,
  onDataRefresh,
  existingYears,
}) {
  const statusConfig = getStatusConfig(acadYear.status);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [disabledYears, setDisabledYears] = useState([]);
  const [canUpdateYear, setCanUpdateYear] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Parse the current academic year to get the starting year
  useEffect(() => {
    const match = acadYear.acadYear.match(/S\.Y - (\d{4})-\d{4}/);
    if (match && match[1]) {
      const startYear = parseInt(match[1]);
      setSelectedDate(new Date(startYear, 0, 1));
    }

    // Extract existing years for validation
    const existingStartYears = [];
    if (existingYears && existingYears.length > 0) {
      existingYears.forEach((year) => {
        if (year !== acadYear.acadYear) {
          // Skip the current year
          const match = year.match(/S\.Y - (\d{4})-\d{4}/);
          if (match && match[1]) {
            existingStartYears.push(parseInt(match[1]));
          }
        }
      });
    }
    setDisabledYears(existingStartYears);
  }, [acadYear.acadYear, existingYears]);

  const handleDateChange = (date) => {
    setSelectedDate(date);

    // Check if the selected year is already in use
    const selectedYear = date.getFullYear();
    const formattedYear = formatAcademicYear(date);

    if (formattedYear === acadYear.acadYear) {
      // If it's the same as the current year, it's valid
      setCanUpdateYear(true);
      setErrorMessage("");
    } else if (existingYears.includes(formattedYear)) {
      setCanUpdateYear(false);
      setErrorMessage(`Academic year ${formattedYear} already exists.`);
    } else {
      setCanUpdateYear(true);
      setErrorMessage("");
    }
  };

  const formatAcademicYear = (date) => {
    if (!date) return "";
    const startYear = date.getFullYear();
    const endYear = startYear + 1;
    return `S.Y - ${startYear}-${endYear}`;
  };

  const handleDeleteClick = () => {
    onDelete(acadYear);
    setDeleteOpen(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error("Please select a valid year.");
      return;
    }

    if (!canUpdateYear) {
      toast.error(errorMessage || "Cannot update to this academic year.");
      return;
    }

    const formattedYear = formatAcademicYear(selectedDate);

    setLoading(true);
    // prop function passed from the parent
    await onUpdate(acadYear.id, formattedYear);
    setLoading(false);
    setEditOpen(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{acadYear.acadYear}</CardTitle>
          <Badge className={statusConfig}>{acadYear.status}</Badge>
        </div>
        <CardDescription className="flex justify-between items-center">
          <span>
            Date Created:{" "}
            {acadYear.createdAt
              ? format(toDate(acadYear.createdAt), "MMMM d, yyyy")
              : "N/A"}
          </span>

          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 cursor-pointer"
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">View More Actions</TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                {acadYear.status !== "Active" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onSetActive(acadYear)}
                      className="text-green-600 cursor-pointer focus:bg-green-50 focus:text-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" /> Set as Active
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="cursor-pointer text-destructive"
                  disabled={acadYear.status === "Active"}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <Button onClick={onAddSemesterClick} className="mb-4 cursor-pointer">
          <Plus className="h-4 w-4" /> Add Semester
        </Button>
        {acadYear.semesters.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {acadYear.semesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                onSetActive={(sem) => handleSetActiveSemester(sem, acadYear.id)}
                onDelete={(sem) => handleDeleteSemester(sem, acadYear.id)}
                isActivating={actionLoading === semester.id}
                academicYearId={acadYear.id}
                onDataRefresh={onDataRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg mt-4">
            <CalendarDays className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 font-semibold">No semesters found.</p>
            <p>Click "Add Semester" to get started.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the academic year "
              <strong>{acadYear.acadYear}</strong>"? This will also delete all
              its semesters. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit dialog  */}
      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Select a new year for the academic year.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <Label htmlFor="yearPicker">School Year</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="yearPicker"
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
                    initialFromYear={
                      selectedDate
                        ? selectedDate.getFullYear()
                        : new Date().getFullYear()
                    }
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <div className="mt-2 text-sm">
                  School Year will be changed to:{" "}
                  <strong>{formatAcademicYear(selectedDate)}</strong>
                </div>
              )}

              {!canUpdateYear && (
                <div className="mt-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading || !canUpdateYear || !selectedDate}
                className="cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <LoaderCircle />
                    </span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
