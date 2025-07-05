import { db, auth } from "@/api/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoundPlus, Info, CircleAlert, CalendarIcon, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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

// Validation utility functions
const validateName = (name, fieldName) => {
  if (!name || name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  if (!/^[a-zA-Z\s.-]+$/.test(name)) {
    return `${fieldName} can only contain letters, spaces, periods, and hyphens`;
  }
  if (name.length > 50) {
    return `${fieldName} must be less than 50 characters`;
  }
  return null;
};

const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return "Email address is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  if (!email.endsWith("@caloocan.sti.edu.ph")) {
    return "Email must be an institutional address (@caloocan.sti.edu.ph)";
  }

  return null;
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/(?=.*\d)/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return "Password must contain at least one special character (@$!%*?&)";
  }
  return null;
};

const validateDateOfBirth = (date) => {
  if (!date) {
    return "Date of birth is required";
  }

  const today = new Date();
  const minAge = 15; // Minimum age for students
  const maxAge = 70; // Maximum reasonable age

  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  if (age < minAge) {
    return `User must be at least ${minAge} years old`;
  }
  if (age > maxAge) {
    return `Please enter a valid date of birth`;
  }

  return null;
};

const validateForm = (formData, date) => {
  const errors = {};

  // Name validations
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

  // Email validation
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Password validation
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  // Date validation
  const dateError = validateDateOfBirth(date);
  if (dateError) errors.dateOfBirth = dateError;

  // Required field validations
  if (!formData.gender) errors.gender = "Gender is required";
  if (!formData.role) errors.role = "Role is required";
  if (!formData.department) errors.department = "Department is required";

  return errors;
};

export default function AddUserModal({ onUserAdded }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    gender: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
  });

  // Reset form and close dialog
  const resetForm = useCallback(() => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      gender: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      department: "",
    });
    setDate(undefined);
    setFormErrors({});
    setIsSubmitting(false);
  }, []);

  // Handle dialog close
  const handleDialogClose = useCallback(
    (isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      setDialogOpen(isOpen);
    },
    [resetForm]
  );

  // Clear all errors when opening dialog
  const handleDialogOpen = useCallback(() => {
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  // Handle form field changes
  const handleChange = useCallback(
    (e) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));

      // Clear specific field error when user starts typing
      if (formErrors[id]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  // Handle select field changes
  const handleSelectChange = useCallback(
    (id, value) => {
      setFormData((prev) => ({ ...prev, [id]: value }));

      // Clear specific field error when user makes selection
      if (formErrors[id]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  // Handle date selection
  const handleDateSelect = useCallback(
    (selectedDate) => {
      setDate(selectedDate);
      setOpen(false);

      // Clear date error when user selects a date
      if (formErrors.dateOfBirth) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.dateOfBirth;
          return newErrors;
        });
      }
    },
    [formErrors.dateOfBirth]
  );
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form data
    const errors = validateForm(formData, date);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      toast.error("Please fix the errors in the form", {
        description:
          "Check all required fields and correct any validation errors",
        duration: 5000,
      });
      return;
    }

    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get user ID from the created auth account
      const userId = userCredential.user.uid;

      // Prepare user data for Firestore
      const userData = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || "",
        lastName: formData.lastName.trim(),
        suffix: formData.suffix.trim() || "",
        gender: formData.gender,
        dateOfBirth: date ? date.toISOString().split("T")[0] : null,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        department: formData.department.trim().toUpperCase(),
        status: "active",
        role: formData.role.toLowerCase(),
        createdAt: serverTimestamp(),
      };

      // Add user to the appropriate collection based on role
      const rolePath = formData.role.toLowerCase().replace(" ", "_");
      await setDoc(doc(db, `users/${rolePath}/accounts`, userId), userData);

      // Show success message and reset form
      toast.success(
        `User ${formData.firstName} ${formData.lastName} created successfully!`,
        {
          description: `Added as ${formData.role} in ${formData.department} department`,
          duration: 5000,
        }
      );

      // Reset form and close dialog
      resetForm();
      setDialogOpen(false);

      // Refresh the users table
      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle specific Firebase Auth errors
      let errorMessage = "Failed to create user";
      let errorDescription = error.message;

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already exists";
        errorDescription =
          "This email address is already registered in the system";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Please choose a stronger password";
        errorDescription =
          "Password must include uppercase, lowercase, numbers and special characters";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
        errorDescription = "Email must be a valid institutional address";
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
    <>
      {" "}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          {/* add user button */}
          <Button
            className="bg-blue-900 text-white hover:bg-blue-700 cursor-pointer"
            onClick={handleDialogOpen}
          >
            <UserRoundPlus className="h-4 w-4" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
          {/* header */}
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl">
              Add User
            </DialogTitle>
            <DialogDescription className="mb-4">
              Add new user to the system. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>

          {/* form */}
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="flex items-center justify between mr-2">
                <h3 className="font-medium text-gray-700 mr-2">
                  Personal Information
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="max-w-xs">
                        Please enter your name, gender, and date of birth.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="min-w-[200px] space-y-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                {" "}
                {/* first name */}
                <div className="space-y-2 md:col-span-1 mt-3.5">
                  <Label htmlFor="firstName" className="mb-2 flex items-center">
                    First Name <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="firstName"
                    type="text"
                    className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                      formErrors.firstName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                    placeholder="First Name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    aria-label="Input first name"
                  />
                  {formErrors.firstName && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.firstName}
                    </div>
                  )}
                </div>{" "}
                {/* middle name */}
                <div className="space-y-2 md:col-span-1">
                  <Label
                    htmlFor="middleName"
                    className="mb-2 flex items-center"
                  >
                    Middle Name{" "}
                    <span className="text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id="middleName"
                    type="text"
                    className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                      formErrors.middleName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                    placeholder="Middle name"
                    value={formData.middleName}
                    onChange={handleChange}
                    aria-label="Input middle name"
                  />
                  {formErrors.middleName && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.middleName}
                    </div>
                  )}
                </div>{" "}
                {/* last name */}
                <div className="space-y-2 md:col-span-1 mt-3.5">
                  <Label htmlFor="lastName" className="mb-2 flex items-center">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                      formErrors.lastName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                    placeholder="Last Name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    aria-label="Input last name"
                  />
                  {formErrors.lastName && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.lastName}
                    </div>
                  )}
                </div>{" "}
                {/* suffix name */}
                <div className="space-y-2 md:col-span-1 mt-3.5">
                  <Label htmlFor="suffix" className="mb-2 flex items-center">
                    Suffix <span className="text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id="suffix"
                    type="text"
                    className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                      formErrors.suffix
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                    placeholder="Jr., Sr., III"
                    value={formData.suffix}
                    onChange={handleChange}
                    aria-label="Input suffix"
                  />
                  {formErrors.suffix && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.suffix}
                    </div>
                  )}
                </div>
              </div>
            </div>{" "}
            {/* gender and date of birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-1">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger
                    id="gender"
                    className={`w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                      formErrors.gender
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.gender && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <CircleAlert className="h-3 w-3 mr-1" />
                    {formErrors.gender}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-1">
                  Date of birth <span className="text-red-500">*</span>
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className={`w-full justify-between font-normal ${
                        formErrors.dateOfBirth
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : ""
                      }`}
                    >
                      {date ? date.toLocaleDateString() : "Select date"}
                      <CalendarIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      captionLayout="dropdown"
                      onSelect={handleDateSelect}
                    />
                  </PopoverContent>
                </Popover>
                {formErrors.dateOfBirth && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <CircleAlert className="h-3 w-3 mr-1" />
                    {formErrors.dateOfBirth}
                  </div>
                )}
              </div>
            </div>
            {/* Account Information */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Account Information</h3>{" "}
              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  Email Address <span className="text-red-500">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="max-w-xs">
                          It must be a valid institutional email address with a
                          format of "@caloocan.sti.edu.ph".
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@caloocan.sti.edu.ph"
                  className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    formErrors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : ""
                  }`}
                  required
                  value={formData.email}
                  onChange={handleChange}
                  aria-label="Input email address"
                />
                {formErrors.email && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <CircleAlert className="h-3 w-3 mr-1" />
                    {formErrors.email}
                  </div>
                )}
              </div>{" "}
              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1">
                    Password <span className="text-red-500">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs">
                            Must be at least 8 characters with letters, numbers
                            & symbols.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                        formErrors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : ""
                      }`}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      aria-label="Input password"
                    />
                  </div>
                  {formErrors.password && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.password}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-1"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                        formErrors.confirmPassword
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : ""
                      }`}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      aria-label="Input confirm password"
                    />
                  </div>
                  {formErrors.confirmPassword && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* role and department */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">System Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {" "}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-1">
                    Role <span className="text-red-500">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs">
                            Choose the users' permissions in the system.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    required
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger
                      id="role"
                      className={`w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                        formErrors.role
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>{" "}
                    <SelectContent>
                      <SelectItem value="Academic Head">
                        Academic Head
                      </SelectItem>
                      <SelectItem value="Program Head">Program Head</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.role}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="department"
                    className="flex items-center gap-1"
                  >
                    Department <span className="text-red-500">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs">
                            Department to which the user belongs.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>{" "}
                  <Select
                    required
                    onValueChange={(value) =>
                      handleSelectChange("department", value)
                    }
                  >
                    <SelectTrigger
                      id="department"
                      className={`w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                        formErrors.department
                          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I.T">
                        Information Technology
                      </SelectItem>
                      <SelectItem value="CS">Computer Science</SelectItem>
                      <SelectItem value="CPE">Computer Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <CircleAlert className="h-3 w-3 mr-1" />
                      {formErrors.department}
                    </div>
                  )}
                </div>
              </div>
            </div>{" "}
            <div className="flex justify-end gap-3 pt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-blue-900 text-white hover:bg-blue-700 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="animate-spin "/>
                    Adding user...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
