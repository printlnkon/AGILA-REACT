// AddSemesterModal.jsx
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { LoaderCircle, Calendar as CalendarIcon, Check } from "lucide-react";

export default function AddSemesterModal({
  open,
  onOpenChange,
  activeAcadYear,
  onSemesterAdded,
  existingSemesters = [],
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    semesterName: "",
    startDate: null,
    endDate: null,
  });

  const resetForm = useCallback(() => {
    setFormData({ semesterName: "", startDate: null, endDate: null });
    setIsSubmitting(false);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        resetForm();
      }
    },
    [onOpenChange, resetForm]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.semesterName || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all fields.");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after the start date.");
      return;
    }
    if (
      existingSemesters.some(
        (sem) => sem.semesterName === formData.semesterName
      )
    ) {
      toast.error("This semester already exists in this academic year.");
      return;
    }

    setIsSubmitting(true);
    const success = await onSemesterAdded({
      semesterName: formData.semesterName,
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      endDate: format(formData.endDate, "yyyy-MM-dd"),
    });
    setIsSubmitting(false);

    if (success) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
          <DialogDescription>
            Add a new semester for{" "}
            {activeAcadYear ? (
              <strong>{activeAcadYear.acadYear}</strong>
            ) : (
              "the active academic year"
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="semesterName" className="text-right">
              Semester
            </Label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, semesterName: value }))
              }
            >
              <SelectTrigger className="w-full col-span-3">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Semester">1st Semester</SelectItem>
                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* start date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Popover
              open={isStartDatePickerOpen}
              onOpenChange={setIsStartDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 font-normal justify-between ${
                    !formData.startDate && "text-muted-foreground"
                  }`}
                >
                  {formData.startDate ? (
                    format(formData.startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => {
                    setFormData((prev) => ({ ...prev, startDate: date }));
                    setIsStartDatePickerOpen(false);
                  }}
                  captionLayout="dropdown"
                  className="text-primary"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* end date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Popover
              open={isEndDatePickerOpen}
              onOpenChange={setIsEndDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 font-normal justify-between ${
                    !formData.endDate && "text-muted-foreground"
                  }`}
                >
                  {formData.endDate ? (
                    format(formData.endDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.endDate}
                  onSelect={(date) => {
                    setFormData((prev) => ({ ...prev, endDate: date }));
                    setIsEndDatePickerOpen(false);
                  }}
                  captionLayout="dropdown"
                  className="text-primary"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span>
                  <LoaderCircle className="animate-spin mr-2" />
                </span>
                Adding...
              </>
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
