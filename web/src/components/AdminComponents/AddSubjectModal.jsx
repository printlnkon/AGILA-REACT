// AddSubjectModal.jsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, BookText } from "lucide-react";
import { useActiveSession } from "@/context/ActiveSessionContext";

const INITIAL_SUBJECT_DATA = {
  subjectCode: "",
  subjectName: "",
  description: "",
  units: 0,
  department: "",
  departmentName: "",
  isActive: true,
};

// Form Error component
const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="text-sm text-red-500 mt-1 flex items-center gap-1">
      <X className="w-4 h-4" />
      {message}
    </div>
  );
};

export default function AddSubjectModal({
  isOpen,
  onOpenChange,
  onSubjectAdded,
}) {
  const [subjectFormData, setSubjectFormData] = useState(INITIAL_SUBJECT_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Get the active session from context
  const { activeSession } = useActiveSession();

  useEffect(() => {
    if (isOpen) {
      setSubjectFormData(INITIAL_SUBJECT_DATA);
      setFormErrors({});
      fetchDepartments();
    }
  }, [isOpen]);

  // Mock function to fetch departments - replace with actual API call
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      // Replace with actual API call
      // Example: const response = await fetch('/api/departments');
      // const data = await response.json();

      // Mock data for testing
      const data = [
        { id: "1", departmentName: "Computer Science" },
        { id: "2", departmentName: "Mathematics" },
        { id: "3", departmentName: "English" },
        { id: "4", departmentName: "Physics" },
      ];

      setDepartments(data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to load departments");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setSubjectFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (id, value, name = "") => {
    setSubjectFormData((prev) => ({
      ...prev,
      [id]: value,
      ...(id === "department" ? { departmentName: name } : {}),
    }));
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (data) => {
    const errors = {};

    if (!data.subjectCode || data.subjectCode.trim() === "") {
      errors.subjectCode = "Subject code is required";
    } else if (data.subjectCode.length < 2) {
      errors.subjectCode = "Subject code must be at least 2 characters";
    }

    if (!data.subjectName || data.subjectName.trim() === "") {
      errors.subjectName = "Subject name is required";
    } else if (data.subjectName.length < 3) {
      errors.subjectName = "Subject name must be at least 3 characters";
    }

    if (!data.department) {
      errors.department = "Department is required";
    }

    if (data.units === "" || isNaN(data.units)) {
      errors.units = "Valid unit value is required";
    } else if (Number(data.units) < 1 || Number(data.units) > 6) {
      errors.units = "Units must be between 1 and 6";
    }

    return errors;
  };

  // Handle add subject form submission
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm(subjectFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      toast.error("Please fix the form errors", {
        description:
          "Check all required fields and correct any validation errors.",
      });
      return;
    }

    try {
      // Replace with actual API call
      // Example:
      // const response = await fetch('/api/subjects', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subjectFormData)
      // });
      // if (!response.ok) throw new Error('Failed to add subject');

      // Mock successful submission
      console.log("Subject added:", subjectFormData);

      // Add the new subject to the local state with a mock ID
      const newSubject = {
        ...subjectFormData,
        id: Date.now().toString(), // Mock ID generation
      };

      onSubjectAdded(newSubject);
      toast.success("Subject added successfully");
      onOpenChange(false);
      setSubjectFormData(INITIAL_SUBJECT_DATA);
    } catch (err) {
      console.error("Error adding subject:", err);
      toast.error("Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <BookText className="h-4 w-4" /> Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Subject</DialogTitle>
          <DialogDescription>
            Add a new subject to the system. All fields marked with{" "}
            <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleAddSubject}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* subject code */}
            <div className="space-y-1">
              <Label htmlFor="subjectCode">
                Subject Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subjectCode"
                placeholder="e.g. CS101"
                required
                value={subjectFormData.subjectCode}
                onChange={handleChange}
              />
              <FormError message={formErrors.subjectCode} />
            </div>

            {/* subject name */}
            <div className="space-y-1">
              <Label htmlFor="subjectName">
                Subject Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subjectName"
                placeholder="e.g. Introduction to Programming"
                required
                value={subjectFormData.subjectName}
                onChange={handleChange}
              />
              <FormError message={formErrors.subjectName} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* units */}
            <div className="space-y-1">
              <Label htmlFor="units">
                Units <span className="text-red-500">*</span>
              </Label>
              <Input
                id="units"
                type="number"
                min="1"
                max="6"
                placeholder="e.g. 3"
                required
                value={subjectFormData.units}
                onChange={handleChange}
              />
              <FormError message={formErrors.units} />
            </div>

            {/* department */}
            <div className="space-y-1">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={
                  !activeSession ||
                  isLoadingDepartments ||
                  departments.length === 0
                }
                onValueChange={(value) => {
                  const dept = departments.find((d) => d.id === value);
                  handleSelectChange(
                    "department",
                    value,
                    dept?.departmentName || ""
                  );
                }}
                value={subjectFormData.department}
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue
                    placeholder={
                      !activeSession
                        ? "No active session"
                        : isLoadingDepartments
                        ? "Loading departments..."
                        : departments.length === 0
                        ? "No departments available"
                        : "Select Department"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError message={formErrors.department} />
            </div>
          </div>

          {/* description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter a brief description of the subject"
              value={subjectFormData.description}
              onChange={handleChange}
            />
          </div>

          {/* active status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={subjectFormData.isActive}
              onCheckedChange={(checked) => {
                setSubjectFormData((prev) => ({
                  ...prev,
                  isActive: checked,
                }));
              }}
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Active
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
