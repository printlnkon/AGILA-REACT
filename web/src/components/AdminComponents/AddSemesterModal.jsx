import { useState, useCallback } from "react";
import { db } from "@/api/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LoaderCircle,
  Calendar as CalendarIcon,
  CircleAlert,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Validation function
const validateForm = (formData, activeAcadYear) => {
  const errors = {};

  if (!formData.semesterName) {
    errors.semesterName = "Semester is required.";
  }
  if (!formData.startDate) {
    errors.startDate = "Start date is required.";
  }
  if (!formData.endDate) {
    errors.endDate = "End date is required.";
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }

  if (!activeAcadYear) {
    errors.general = "No active academic year found to add a semester to.";
    return errors;
  }

  const startDate = new Date(formData.startDate);
  const endDate = new Date(formData.endDate);
  const acadStartDate = new Date(activeAcadYear.startDate);
  const acadEndDate = new Date(activeAcadYear.endDate);

  if (startDate >= endDate) {
    errors.endDate = "End date must be after the start date.";
  }

  if (startDate < acadStartDate || endDate > acadEndDate) {
    errors.general = `Semester dates must be within the academic year (${activeAcadYear.year}).`;
  }

  return errors;
};

export default function AddSemesterModal({
  activeAcadYear,
  onSemesterAdded,
  loading,
}) {
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    semesterName: "",
    startDate: null,
    endDate: null,
  });

  const resetForm = useCallback(() => {
    setFormData({ semesterName: "", startDate: null, endDate: null });
    setFormErrors({});
    setIsSubmitting(false);
  }, []);

  const handleDialogClose = useCallback(
    (isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      setDialogOpen(isOpen);
    },
    [resetForm]
  );

  const handleSelectChange = useCallback(
    (id, value) => {
      setFormData((prev) => ({ ...prev, [id]: value }));
      if (formErrors[id]) {
        setFormErrors((prev) => ({ ...prev, [id]: null }));
      }
    },
    [formErrors]
  );

  const handleDateChange = useCallback(
    (date, field) => {
      setFormData((prev) => ({ ...prev, [field]: date }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: null }));
      }
      if (field === "startDate") {
        setStartDatePopoverOpen(false);
      } else if (field === "endDate") {
        setEndDatePopoverOpen(false);
      }
    },
    [formErrors]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm(formData, activeAcadYear);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(errors.general || "Please fix the errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        activeAcadYear.id,
        "semesters"
      );
      await addDoc(semestersColRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        semesterName: formData.semesterName,
        startDate: format(formData.startDate, "yyyy-MM-dd"),
        endDate: format(formData.endDate, "yyyy-MM-dd"),
        status: "Upcoming",
      });

      toast.success(`Semester "${formData.semesterName}" added successfully.`);
      handleDialogClose(false);
      onSemesterAdded();
    } catch (error) {
      console.error("Error adding semester: ", error);
      toast.error("Failed to add semester.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          className="cursor-pointer mr-2"
          disabled={loading}
          onClick={() => setDialogOpen(true)}
        >
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

        {/* form */}
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* semester */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="semesterName" className="flex items-center pt-2">
              Semester 
            </Label>
            <div className="col-span-3">
              <Select
                onValueChange={(value) =>
                  handleSelectChange("semesterName", value)
                }
                value={formData.semesterName}
              >
                <SelectTrigger
                  id="semesterName"
                  className={`w-full justify-between ${
                    formErrors.semesterName ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Semester">1st Semester</SelectItem>
                  <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.semesterName && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <CircleAlert className="h-3 w-3 mr-1" />
                  {formErrors.semesterName}
                </div>
              )}
            </div>
          </div>

          {/* start date */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="startDate" className="flex items-center gap-1 pt-2">
              Start Date 
            </Label>
            <div className="col-span-3">
              <Popover
                open={startDatePopoverOpen}
                onOpenChange={setStartDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="startDate"
                    className={`w-full justify-between 
                      ${!formData.startDate ? "text-muted-foreground" : ""} ${
                      formErrors.startDate ? "border-red-500" : ""
                    }`}
                  >
                    {formData.startDate ? (
                      format(formData.startDate, "PPP")
                    ) : (
                      <span>Start date</span>
                    )}
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    className="text-primary"
                    captionLayout="dropdown"
                    onSelect={(date) => handleDateChange(date, "startDate")}
                  />
                </PopoverContent>
              </Popover>
              {formErrors.startDate && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <CircleAlert className="h-3 w-3 mr-1" />
                  {formErrors.startDate}
                </div>
              )}
            </div>
          </div>

          {/* end date */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="endDate" className="flex items-center gap-1 pt-2">
              End Date 
            </Label>
            <div className="col-span-3">
              <Popover
                open={endDatePopoverOpen}
                onOpenChange={setEndDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="endDate"
                    className={`w-full justify-between 
                      ${!formData.endDate ? "text-muted-foreground" : ""} ${
                      formErrors.endDate ? "border-red-500" : ""
                    }`}
                  >
                    {formData.endDate ? (
                      format(formData.endDate, "PPP")
                    ) : (
                      <span>End date</span>
                    )}
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    className="text-primary"
                    captionLayout="dropdown"
                    onSelect={(date) => handleDateChange(date, "endDate")}
                  />
                </PopoverContent>
              </Popover>
              {formErrors.endDate && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <CircleAlert className="h-3 w-3 mr-1" />
                  {formErrors.endDate}
                </div>
              )}
            </div>
          </div>
          {formErrors.general && (
            <div className="col-span-4 flex items-center text-red-500 text-sm">
              <CircleAlert className="h-3 w-3 mr-1" />
              {formErrors.general}
            </div>
          )}
        </form>

        {/* footer */}
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              className=" cursor-pointer"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary bg-primary:hover cursor-pointer"
          >
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
