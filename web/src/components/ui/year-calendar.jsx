import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function YearCalendar({
  selected,
  onSelect,
  disabledYears = [],
  initialFromYear,
}) {
  const currentYear = new Date().getFullYear();
  const [viewStartYear, setViewStartYear] = useState(
    initialFromYear || currentYear
  );

  const yearsPerPage = 9; // Display years in a 3x3 grid

  // Generate an array of years for the current view
  const years = Array.from(
    { length: yearsPerPage },
    (_, i) => viewStartYear + i
  );

  // Group years into rows of 3 for the grid layout
  const yearRows = [];
  for (let i = 0; i < years.length; i += 3) {
    yearRows.push(years.slice(i, i + 3));
  }

  const goToPreviousYears = () =>
    setViewStartYear((prev) => prev - yearsPerPage);
  const goToNextYears = () => setViewStartYear((prev) => prev + yearsPerPage);

  const isSelectedYear = (year) => selected?.getFullYear() === year;
  const isDisabledYear = (year) =>
    year < currentYear || disabledYears.includes(year);
  const isCurrentYear = (year) => year === currentYear;

  return (
    <div className="p-3 w-[280px]">
      <div className="flex items-center justify-between mb-4">
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

      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => (
          <Button
            key={year}
            variant={isSelectedYear(year) ? "default" : "outline"}
            className={cn(
              "h-9 text-sm",
              isCurrentYear(year) && !isSelectedYear(year) && "border-primary",
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

      {currentYear !== viewStartYear && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            className="text-xs h-auto cursor-pointer"
            onClick={() => setViewStartYear(currentYear)}
          >
            Go to Current Year
          </Button>
        </div>
      )}
    </div>
  );
}
