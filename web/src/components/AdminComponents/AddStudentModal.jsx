import { db, auth, storage } from "@/api/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  onSnapshot,
} from "firebase/firestore";
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
import { useActiveSession } from "@/context/ActiveSessionContext";

const ROLES = {
  STUDENT: "Student",
};

const INITIAL_FORM_DATA = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  gender: "",
  role: ROLES.STUDENT, // Set default role to STUDENT
  department: "",
  departmentName: "",
  course: "",
  courseName: "",
  yearLevel: "",
  yearLevelName: "",
  section: "",
  sectionName: "",
};

const MIN_AGE = 15;
const MAX_AGE = 70;

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center text-red-500 text-sm mt-1">
      <CircleAlert className="h-3 w-3 mr-1" />
      {message}
    </div>
  );
};

const generateStudentNumber = () => {
  const prefix = "02000";
  const uniquePart = Math.random().toString().slice(2, 8); // 6 random digits
  return `${prefix}${uniquePart}`;
};

// validation functions
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

const validateDateOfBirth = (date) => {
  if (!date) return "Date of birth is required";

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

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
  if (!formData.role) errors.role = "Role is required";
  if (!formData.department) errors.department = "Department is required";
  if (!formData.course) errors.course = "Course is required";
  if (!formData.yearLevel) errors.yearLevel = "Year level is required";
  if (!formData.section) errors.section = "Section is required";

  return errors;
};

export default function AddStudentModal({ onUserAdded }) {
  const today = new Date();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [date, setDate] = useState(undefined);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use the active session context
  const { activeSession, loading: sessionLoading } = useActiveSession();

  // Fetch departments when dialog opens and activeSession is available
  useEffect(() => {
    if (!dialogOpen || !activeSession) {
      return () => { };
    }

    setIsLoading(true);
    const departmentsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
    const departmentsRef = collection(db, departmentsPath);

    const unsubscribe = onSnapshot(
      departmentsRef,
      (snapshot) => {
        const depts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          academicYearId: activeSession.id,
          semesterId: activeSession.semesterId,
        }));
        depts.sort((a, b) => a.departmentName.localeCompare(b.departmentName));
        setDepartments(depts);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error in departments listener:", error);
        toast.error("Failed to listen for department updates.");
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [dialogOpen, activeSession]);

  // Fetch courses when department changes
  useEffect(() => {
    if (!formData.department || !activeSession) {
      setCourses([]);
      return () => { };
    }

    setIsLoading(true);
    const coursesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${formData.department}/courses`;
    const coursesRef = collection(db, coursesPath);

    const unsubscribe = onSnapshot(
      coursesRef,
      (snapshot) => {
        const courseList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(courseList);
        setIsLoading(false);
      },
      (error) => {
        setCourses([]);
        toast.error("Failed to load courses for department: " + error.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [formData.department, activeSession]);

  // Fetch year levels when department or course changes
  useEffect(() => {
    if (!formData.department || !formData.course || !activeSession) {
      setYearLevels([]);
      return () => { };
    }

    setIsLoading(true);
    const yearLevelsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${formData.department}/courses/${formData.course}/year_levels`;
    const yearLevelsRef = collection(db, yearLevelsPath);

    const unsubscribe = onSnapshot(
      yearLevelsRef,
      (snapshot) => {
        const yearLevelList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setYearLevels(yearLevelList);
        setIsLoading(false);
      },
      (error) => {
        setYearLevels([]);
        toast.error("Failed to load year levels for course: " + error.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [formData.department, formData.course, activeSession]);

  // Fetch sections when department, course, or year level changes
  useEffect(() => {
    if (
      !formData.department ||
      !formData.course ||
      !formData.yearLevel ||
      !activeSession
    ) {
      setSections([]);
      return () => { };
    }

    setIsLoading(true);
    const sectionsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${formData.department}/courses/${formData.course}/year_levels/${formData.yearLevel}/sections`;
    const sectionsRef = collection(db, sectionsPath);

    const unsubscribe = onSnapshot(
      sectionsRef,
      (snapshot) => {
        const sectionList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSections(sectionList);
        setIsLoading(false);
      },
      (error) => {
        setSections([]);
        toast.error("Failed to load sections for year level: " + error.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [formData.department, formData.course, formData.yearLevel, activeSession]);

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
    setPhoto(null);
  }, []);

  const handleDialogChange = useCallback(
    (isOpen) => {
      setDialogOpen(isOpen);
      if (!isOpen) {
        resetForm();
      } else {
        setFormErrors({});
      }
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
    (id, value, name = "") => {
      const updates = { [id]: value };

      // Reset dependent fields when parent changes
      if (id === "department") {
        updates.course = "";
        updates.courseName = "";
        updates.yearLevel = "";
        updates.yearLevelName = "";
        updates.section = "";
        updates.sectionName = "";
        updates.departmentName = name;
      } else if (id === "course") {
        updates.yearLevel = "";
        updates.yearLevelName = "";
        updates.section = "";
        updates.sectionName = "";
        updates.courseName = name;
      } else if (id === "yearLevel") {
        updates.section = "";
        updates.sectionName = "";
        updates.yearLevelName = name;
      } else if (id === "section") {
        updates.sectionName = name;
      }

      setFormData((prev) => ({ ...prev, ...updates }));
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

    if (!activeSession) {
      toast.error("Active academic session not found. Cannot add student.", {
        description:
          "Please ensure an active academic year and semester are set.",
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const studentNumber = generateStudentNumber();
      const email = `${formData.lastName
        .toLowerCase()
        .replace(/\s+/g, "")}.${studentNumber.slice(-6)}@caloocan.sti.edu.ph`;
      const password = `@${formData.lastName
        .charAt(0)
        .toUpperCase()}${formData.lastName.slice(1)}.${format(
          date,
          "yyyyddMM"
        )}`;

      let photoURL = "";
      if (photo) {
        const photoRef = ref(
          storage,
          `studentsPhoto/${studentNumber}/${photo.name}`
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
        studentNumber,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || "",
        lastName: formData.lastName.trim(),
        suffix: formData.suffix.trim() || "",
        photoURL,
        gender: formData.gender,
        dateOfBirth: date.toISOString().split("T")[0],
        email,
        password,
        department: formData.department,
        departmentName: formData.departmentName,
        course: formData.course,
        courseName: formData.courseName,
        yearLevel: formData.yearLevel,
        yearLevelName: formData.yearLevelName,
        section: formData.section,
        sectionName: formData.sectionName,
        status: "active",
        role: formData.role,
        academicYearId: activeSession.id,
        semesterId: activeSession.semesterId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const rolePath = formData.role.toLowerCase().replace(" ", "_");
      await setDoc(doc(db, `users/${rolePath}/accounts`, userId), userData);

      toast.success(
        `User ${formData.firstName} ${formData.lastName} created successfully!`,
        {
          description: `Added as ${formData.role} in the ${formData.departmentName}.`,
          duration: 5000,
        }
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

  const isDepartmentSelectDisabled =
    !activeSession || sessionLoading || departments.length === 0 || isLoading;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <UserRoundPlus />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-2xl xl:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. All fields marked with{" "}
            <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        {!activeSession && !sessionLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800">
            <p className="font-medium">No active academic session found</p>
            <p className="text-sm mt-1">
              Please set an academic year and semester as active in the Academic
              Year &amp; Semester section.
            </p>
          </div>
        )}

        {sessionLoading && (
          <div className="text-center py-3">
            <LoaderCircle className="animate-spin inline mr-2" />
            Loading academic session...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <div className="flex items-center mb-2">
              <h3 className="font-medium">Student Information</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-1.5 h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Enter the student's personal details.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* student information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* first name */}
              <div className="space-y-1 md:col-span-1">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
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
                  Last Name <span className="text-red-500">*</span>
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
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                value={formData.gender}
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
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className={`w-full justify-between ${!date ? "text-muted-foreground" : ""
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

          {/* academic information */}
          <div className="flex items-center mb-2">
            <h3 className="font-medium">Academic Information</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="ml-1.5 h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Provide the student's academic details.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* department and course */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* department */}
            <div className="space-y-1">
              <Label htmlFor="department">
                Assign to Department <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={isDepartmentSelectDisabled}
                onValueChange={(value) => {
                  const dept = departments.find((d) => d.id === value);
                  handleSelectChange(
                    "department",
                    value,
                    dept?.departmentName || ""
                  );
                }}
                value={formData.department}
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue
                    placeholder={
                      !activeSession
                        ? "No active session"
                        : isLoading
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
            {/* course */}
            <div className="space-y-1">
              <Label htmlFor="course">
                Assign to Course <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={!formData.department || isLoading}
                onValueChange={(value) => {
                  const course = courses.find((c) => c.id === value);
                  handleSelectChange("course", value, course?.courseName || "");
                }}
                value={formData.course}
              >
                <SelectTrigger id="course" className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.department
                        ? "Select department first"
                        : isLoading
                          ? "Loading courses..."
                          : courses.length === 0
                            ? "No courses available"
                            : "Select Course"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError message={formErrors.course} />
            </div>
          </div>

          {/* year level and section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* year level */}
            <div className="space-y-1">
              <Label htmlFor="yearLevel">
                Assign to Year Level <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={!formData.course || isLoading}
                onValueChange={(value) => {
                  const yearLevel = yearLevels.find((yl) => yl.id === value);
                  handleSelectChange(
                    "yearLevel",
                    value,
                    yearLevel?.yearLevelName || ""
                  );
                }}
                value={formData.yearLevel}
              >
                <SelectTrigger id="yearLevel" className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.course
                        ? "Select course first"
                        : isLoading
                          ? "Loading year levels..."
                          : yearLevels.length === 0
                            ? "No year levels available"
                            : "Select Year Level"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels
                    .sort((a, b) => {
                      const getYearLevel = (name) => {
                        const match = name.match(/^(\d+)/);
                        return match ? parseInt(match[0], 10) : 0;
                      };
                      return (
                        getYearLevel(a.yearLevelName) -
                        getYearLevel(b.yearLevelName)
                      );
                    })
                    .map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.yearLevelName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormError message={formErrors.yearLevel} />
            </div>
            {/* section */}
            <div className="space-y-1">
              <Label htmlFor="section">
                Assign to Section <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={!formData.yearLevel || isLoading}
                onValueChange={(value) => {
                  const section = sections.find((s) => s.id === value);
                  handleSelectChange(
                    "section",
                    value,
                    section?.sectionName || ""
                  );
                }}
                value={formData.section}
              >
                <SelectTrigger id="section" className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.yearLevel
                        ? "Select year level first"
                        : isLoading
                          ? "Loading sections..."
                          : sections.length === 0
                            ? "No sections available"
                            : "Select Section"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sections.sort((a, b) => {
                    // extract number from section names (e.g., "BT-101" => 101)
                    const getSectionNumber = (name) => {
                      const match = name.match(/\d+/);
                      return match ? parseInt(match[0], 10) : 0;
                    };
                    // sort section prefix (e.g, "BT")
                    const prefixA = a.sectionName.split("-")[0];
                    const prefixB = b.sectionName.split("-")[0];
                    if (prefixA !== prefixB) {
                      return prefixA.localeCompare(prefixB);
                    }

                    // sort by section number
                    return getSectionNumber(a.sectionName) - getSectionNumber(b.sectionName)
                  })
                    .map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.sectionName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormError message={formErrors.section} />
            </div>
          </div>

          {/* system access */}
          <div className="flex items-center mb-2">
            <h3 className="font-medium">System Access</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="ml-1.5 h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Choose access to the system.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.STUDENT}>Student</SelectItem>
                </SelectContent>
              </Select>
              <FormError message={formErrors.role} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              disabled={isSubmitting || !activeSession || isLoading}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">
                    <LoaderCircle />
                  </span>
                  Adding User...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
