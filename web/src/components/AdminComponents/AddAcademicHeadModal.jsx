import { db, auth, storage } from "@/api/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  UserRoundPlus,
  Info,
  CircleAlert,
  CalendarIcon,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { useActiveSession } from "@/context/ActiveSessionContext";

const ROLES = {
  ACADEMIC_HEAD: "Academic Head",
};

const INITIAL_FORM_DATA = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  gender: "",
  role: ROLES.ACADEMIC_HEAD, // Set default role to ACADEMIC HEAD
};

const MIN_AGE = 25;
const MAX_AGE = 70;

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center text-destructive text-sm mt-1">
      <CircleAlert className="h-3 w-3 mr-1" />
      {message}
    </div>
  );
};

const generateEmployeeNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validateName = (name, fieldName) => {
  if (!name || name.trim().length < 2)
    return `${fieldName} must be at least 2 characters long`;
  if (!/^[a-zA-Z\s.-]+$/.test(name))
    return `${fieldName} can only contain letters, spaces, periods, and hyphens`;
  if (name.length > 50) return `${fieldName} must be less than 50 characters`;
  return null;
};

const validateDateOfBirth = (date) => {
  if (!date) return "Date of birth is required";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();

  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()))
    age--;
  if (age < MIN_AGE) return `User must be at least ${MIN_AGE} years old`;
  if (age > MAX_AGE) return `Please enter a valid date of birth`;

  return null;
};

const validateForm = (formData, date) => {
  const errors = {};
  const firstNameError = validateName(formData.firstName, "First name");
  if (firstNameError) errors.firstName = firstNameError;
  const lastNameError = validateName(formData.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;
  if (formData.middleName) {
    const middleNameError = validateName(formData.middleName, "Middle name");
    if (middleNameError) errors.middleName = middleNameError;
  }
  if (formData.suffix && formData.suffix.length > 10) {
    errors.suffix = "Suffix must be less than 10 characters";
  }
  const dateError = validateDateOfBirth(date);
  if (dateError) errors.dateOfBirth = dateError;
  if (!formData.gender) errors.gender = "Gender is required";
  return errors;
};

export default function AddAcademicHeadModal({ onUserAdded }) {
  const today = new Date();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [date, setDate] = useState(undefined);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [photo, setPhoto] = useState(null);

  const { activeSession, loading: sessionLoading } = useActiveSession();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    clearFieldError("photo");
  };

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setDate(undefined);
    setFormErrors({});
    setIsSubmitting(false);
  }, []);

  const handleDialogChange = useCallback(
    (isOpen) => {
      setDialogOpen(isOpen);
      if (!isOpen) resetForm();
      else setFormErrors({});
    },
    [resetForm]
  );

  const clearFieldError = useCallback(
    (field) => {
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  const handleChange = useCallback(
    (e) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
      clearFieldError(id);
    },
    [clearFieldError]
  );

  const handleSelectChange = useCallback(
    (id, value) => {
      setFormData((prev) => ({ ...prev, [id]: value }));
      clearFieldError(id);
    },
    [clearFieldError]
  );

  const handleDateSelect = useCallback(
    (selectedDate) => {
      setDate(selectedDate);
      setPopoverOpen(false);
      clearFieldError("dateOfBirth");
    },
    [clearFieldError]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!activeSession) {
      toast.error("No Active School Year", {
        description:
          "Please set a school year and semester as active in the School Year & Semester module.",
      });
      return;
    }

    setIsSubmitting(true);

    const errors = validateForm(formData, date);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      toast.error("Please fix the errors in the form", {
        description:
          "Check all required fields and correct any validation errors.",
        duration: 5000,
      });
      return;
    }

    try {
      const employeeNumber = generateEmployeeNumber();
      const email = `${formData.lastName
        .toLowerCase()
        .replace(/\s+/g, "")}.${employeeNumber}@caloocan.sti.edu.ph`;
      const password = `@${formData.lastName
        .charAt(0)
        .toUpperCase()}${formData.lastName.slice(1)}.${format(
        date,
        "yyyyddMM"
      )}`;

      // upload photo in firebase storage
      let photoURL = "";
      if (photo) {
        const photoRef = ref(
          storage,
          `academicHeadsPhoto/${employeeNumber}/${photo.name}`
        );
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userId = userCredential.user.uid;

      const userData = {
        employeeNumber,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || "",
        lastName: formData.lastName.trim(),
        suffix: formData.suffix.trim() || "",
        photoURL,
        gender: formData.gender,
        dateOfBirth: date.toISOString().split("T")[0],
        email,
        password,
        status: "active",
        role: ROLES.ACADEMIC_HEAD,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const rolePath = ROLES.ACADEMIC_HEAD.toLowerCase().replace(" ", "_");
      await setDoc(doc(db, `users/${rolePath}/accounts`, userId), userData);

      toast.success(
        `Academic Head ${formData.firstName} ${formData.lastName} created successfully!`
      );

      if (onUserAdded) onUserAdded();
      handleDialogChange(false);
    } catch (error) {
      console.error("Error creating user:", error);
      let errorMessage = "Failed to create user.";
      let errorDescription = error.message;

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already exists.";
        errorDescription = "This email address is already registered.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak.";
        errorDescription = "Please choose a stronger password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
        errorDescription = "Please enter a valid institutional email address.";
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button
          className="cursor-pointer"
          disabled={!activeSession && !sessionLoading}
          onClick={(e) => {
            if (!activeSession) {
              e.preventDefault();
              toast.error("No Active School Year", {
                description:
                  "Please set a school year and semester as active in the School Year & Semester module.",
              });
            }
          }}
        >
          <UserRoundPlus />
          Add Academic Head
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-2xl xl:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Academic Head</DialogTitle>
          <DialogDescription>
            Add a new academic head to the system. All fields marked with{" "}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        {!activeSession ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center space-y-2">
              <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
              <h3 className="font-semibold text-lg">No Active School Year</h3>
              <p className="text-destructive">
                Please set a school year and semester as active in the School
                Year & Semester module to add Academic Head account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <div className="flex items-center mb-2">
                <h3 className="font-medium">Academic Head Information</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1.5 h-3.5 w-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Enter the academic head's personal details.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/* academic head information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* first name */}
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <FormError message={formErrors.firstName} />
                </div>
                {/* middle name */}
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Middle Name"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                  <FormError message={formErrors.middleName} />
                </div>
                {/* last name */}
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  <FormError message={formErrors.lastName} />
                </div>
                {/* suffix */}
                <div className="space-y-1 md:col-span-1">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    placeholder="e.g., Jr., Sr., III"
                    value={formData.suffix}
                    onChange={handleChange}
                  />
                  <FormError message={formErrors.suffix} />
                </div>
                {/* photo upload */}
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="photo">Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <FormError message={formErrors.photo} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* gender */}
              <div className="space-y-1">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormError message={formErrors.gender} />
              </div>
              {/* date of birth */}
              <div className="space-y-1">
                <Label htmlFor="date">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className={`w-full justify-between ${
                        !date ? "text-muted-foreground" : ""
                      }`}
                    >
                      {date ? format(date, "PPP") : "Select a date"}
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      captionLayout="dropdown"
                      className="text-primary"
                      fromYear={1950}
                      toYear={today.getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormError message={formErrors.dateOfBirth} />
              </div>
            </div>

            <DialogFooter>
              <div className="flex justify-end gap-3">
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">
                        <LoaderCircle />
                      </span>
                      Adding Academic Head...
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
