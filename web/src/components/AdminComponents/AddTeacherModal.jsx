import { db, auth, storage } from "@/api/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
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
  TEACHER: "Teacher",
};

const INITIAL_FORM_DATA = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  gender: "",
  role: ROLES.TEACHER,
  department: "",
  departmentName: "",
  section: "",
  sectionName: "",
  yearLevel: "",
  yearLevelName: "",
  course: "",
  courseName: "",
};

const MIN_AGE = 25;
const MAX_AGE = 70;

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="text-sm text-destructive mt-1 flex items-center gap-1">
      <CircleAlert className="w-4 h-4" />
      {message}
    </div>
  );
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

const generateEmployeeNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
  if (!formData.department) errors.department = "Department is required";
  if (!formData.yearLevel) errors.yearLevel = "Year Level is required";
  if (!formData.course) errors.course = "Course is required";
  if (!formData.section) errors.section = "Section is required";
  return errors;
};

export default function AddTeacherModal({ onUserAdded }) {
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

  // Get the active session from context
  const { activeSession, loading: sessionLoading } = useActiveSession();

  // fetch departments when dialog opens and activeSession is available
  useEffect(() => {
    if (!dialogOpen || !activeSession) return;

    setIsLoading(true);
    const departmentsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
    const departmentsRef = collection(db, departmentsPath);

    const unsubscribe = onSnapshot(departmentsRef, (snapshot) => {
      const departmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        departmentName: doc.data().departmentName,
        ...doc.data(),
      }));

      setDepartments(departmentsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [dialogOpen, activeSession]);

  // fetch courses when department is selected
  useEffect(() => {
    if (!activeSession || !formData.department) {
      setCourses([]);
      return;
    }
    setIsLoading(true);
    const coursesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${formData.department}/courses`;
    const coursesRef = collection(db, coursesPath);

    const fetchCourses = async () => {
      try {
        const snapshot = await getDocs(coursesRef);
        const coursesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          courseName: doc.data().courseName,
          ...doc.data(),
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to fetch courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [activeSession, formData.department]);

  // fetch year levels
  useEffect(() => {
    if (!activeSession || !formData.department || !formData.course) {
      setYearLevels([]);
      return;
    }

    setIsLoading(true);
    const yearLevelsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${formData.department}/courses/${formData.course}/year_levels`;
    const yearLevelsRef = collection(db, yearLevelsPath);

    const fetchYearLevels = async () => {
      try {
        const snapshot = await getDocs(yearLevelsRef);

        const yearLevelsData = snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            yearLevelName: doc.data().yearLevelName,
            ...doc.data(),
          };
        });

        setYearLevels(yearLevelsData);
      } catch (error) {
        console.error("Error fetching year levels:", error);
        toast.error("Failed to fetch year levels");
      } finally {
        setIsLoading(false);
      }
    };

    fetchYearLevels();
  }, [activeSession, formData.department, formData.course]);

  // fetch sections when course is selected
  useEffect(() => {
    if (
      !activeSession ||
      !formData.department ||
      !formData.course ||
      !formData.yearLevel
    ) {
      setSections([]);
      return;
    }

    setIsLoading(true);
    const sectionsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${formData.department}/courses/${formData.course}/year_levels/${formData.yearLevel}/sections`;
    const sectionsRef = collection(db, sectionsPath);

    const fetchSections = async () => {
      try {
        const snapshot = await getDocs(sectionsRef);
        const sectionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          sectionName: doc.data().sectionName,
          ...doc.data(),
        }));
        setSections(sectionsData);
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast.error("Failed to fetch sections");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [activeSession, formData.department, formData.course, formData.yearLevel]);

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
    (id, value, name = "") => {
      const updates = { [id]: value };

      // Reset dependent fields when parent changes
      if (id === "department") {
        updates.course = "";
        updates.section = "";
        updates.departmentName = name;
      } else if (id === "course") {
        updates.section = "";
        updates.courseName = name;
      } else if (id === "yearLevel") {
        updates.section = "";
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;

      // upload photo in firebase storage
      let photoURL = "";
      if (photo) {
        const photoRef = ref(
          storage,
          `teachersPhoto/${employeeNumber}/${photo.name}`
        );
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

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
        department: formData.department,
        departmentName: formData.departmentName,
        course: formData.course,
        courseName: formData.courseName,
        yearLevel: formData.yearLevel,
        yearLevelName: formData.yearLevelName,
        section: formData.section,
        sectionName: formData.sectionName,
        academicYearId: activeSession ? activeSession.id : "",
        semesterId: activeSession ? activeSession.semesterId : "",
        status: "active",
        role: ROLES.TEACHER,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const rolePath = ROLES.TEACHER.toLowerCase().replace(" ", "_");
      await setDoc(doc(db, `users/${rolePath}/accounts`, userId), userData);

      toast.success(
        `Teacher ${formData.firstName} ${formData.lastName} created successfully!`,
        {
          description: `Added to the ${formData.departmentName}.`,
          duration: 5000,
        }
      );

      if (onUserAdded) onUserAdded({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: email,
        employeeNumber,
        id: userId
      });

      handleDialogChange(false);
    } catch (error) {
      console.error("Error creating user:", error);
      let errorMessage = "Failed to create teacher.";
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
        <Button className="cursor-pointer">
          <UserRoundPlus />
          Add Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-2xl xl:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Teacher</DialogTitle>
          <DialogDescription>
            Add a new teacher to the system. All fields marked with{" "}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        {!activeSession && !sessionLoading && (
          <Card>
            <CardContent className="flex items-start gap-3">
              <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
              <div>
                <p className="font-medium">No Active School Year</p>
                <p className="text-sm text-destructive">
                  Please set a school year and semester as active in the School
                  Year &amp; Semester module to add Teacher account.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {sessionLoading && (
          <div className="text-center py-3">
            <LoaderCircle className="animate-spin inline mr-2" />
            Loading school year...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <div className="flex items-center mb-2">
              <h3 className="font-medium">Teacher Information</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-1.5 h-3.5 w-3.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Enter the teacher's personal details.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* teacher information */}
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

          {/* academic information */}
          <div className="flex items-center mb-2">
            <h3 className="font-medium">Academic Information</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="ml-1.5 h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Provide the teacher's academic details.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* department */}
            <div className="space-y-1">
              <Label htmlFor="department">
                Assign to Department <span className="text-destructive">*</span>
              </Label>
              <Select
                required
                disabled={
                  !activeSession || isLoading || departments.length === 0
                }
                onValueChange={(value) => {
                  const dept = departments.find((d) => d.id === value);
                  handleSelectChange(
                    "department",
                    value,
                    dept?.departmentName || ""
                  );
                }}
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue
                    placeholder={
                      !activeSession
                        ? "No active session"
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
                Assign to Course <span className="text-destructive">*</span>
              </Label>
              <Select
                required
                disabled={
                  !formData.department || courses.length === 0 || isLoading
                }
                onValueChange={(value) => {
                  const course = courses.find((c) => c.id === value);
                  handleSelectChange("course", value, course?.courseName || "");
                }}
              >
                <SelectTrigger id="course" className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.department
                        ? "Select department first"
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
            {/* year level */}
            <div className="space-y-1">
              <Label htmlFor="yearLevel">
                Assign to Year Level <span className="text-destructive">*</span>
              </Label>
              <Select
                required
                disabled={
                  !formData.course || yearLevels.length === 0 || isLoading
                }
                onValueChange={(value) => {
                  const yearLevel = yearLevels.find((yl) => yl.id === value);
                  handleSelectChange(
                    "yearLevel",
                    value,
                    yearLevel?.yearLevelName || ""
                  );
                }}
              >
                <SelectTrigger id="yearLevel" className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.course
                        ? "Select course first"
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
                Assign to Section <span className="text-destructive">*</span>
              </Label>
              <Select
                required
                disabled={
                  !formData.course || sections.length === 0 || isLoading
                }
                onValueChange={(value) => {
                  const section = sections.find((s) => s.id === value);
                  handleSelectChange(
                    "section",
                    value,
                    section?.sectionName || ""
                  );
                }}
              >
                <SelectTrigger id="section" className="w-full">
                  <SelectValue
                    placeholder={
                      !formData.course
                        ? "Select year level first"
                        : sections.length === 0
                        ? "No sections available"
                        : "Select Section"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sections
                    .sort((a, b) => {
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
                      return (
                        getSectionNumber(a.sectionName) -
                        getSectionNumber(b.sectionName)
                      );
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
                disabled={isSubmitting || !activeSession}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">
                      <LoaderCircle />
                    </span>
                    Adding Teacher...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
