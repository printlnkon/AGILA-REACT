
import { db } from "@/api/firebase";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Plus, } from "lucide-react";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Helper function to get year level number for sorting
const getYearLevelNumber = (name) => {
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export default function AddSubjectModal({
  isOpen,
  onOpenChange,
  onSubjectAdded,
  session,
}) {
  const [subjectFormData, setSubjectFormData] = useState(INITIAL_SUBJECT_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingYearLevels, setIsLoadingYearLevels] = useState(false);

  const { activeSession } = useActiveSession();

  useEffect(() => {
    if (isOpen) {
      setSubjectFormData(INITIAL_SUBJECT_DATA);
      setFormErrors({});
      fetchDepartments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (session.selectedDeptId && isOpen) {
      fetchCourses(session.selectedDeptId);
    } else {
      setCourses([]);
    }
  }, [session.selectedDeptId, isOpen]);

  useEffect(() => {
    if (session.selectedCourseId && isOpen) {
      fetchYearLevels(session.selectedDeptId, session.selectedCourseId);
    } else {
      setYearLevels([]);
    }
  }, [session.selectedCourseId, isOpen]);

  const fetchDepartments = async () => {
    if (!activeSession || !activeSession.semesterId) return;
    setIsLoadingDepartments(true);
    try {
      const deptPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
      const querySnapshot = await getDocs(collection(db, deptPath));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDepartments(data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to load departments");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchCourses = async (deptId) => {
    if (!activeSession || !activeSession.semesterId || !deptId) return;
    setIsLoadingCourses(true);
    try {
      const coursePath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${deptId}/courses`;
      const querySnapshot = await getDocs(collection(db, coursePath));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      toast.error("Failed to load courses");
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const fetchYearLevels = async (deptId, courseId) => {
    if (!activeSession || !activeSession.semesterId || !deptId || !courseId) return;
    setIsLoadingYearLevels(true);
    try {
      const yearLevelPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${deptId}/courses/${courseId}/year_levels`;
      const querySnapshot = await getDocs(collection(db, yearLevelPath));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setYearLevels(data);
    } catch (err) {
      console.error("Error fetching year levels:", err);
      toast.error("Failed to load year levels");
    } finally {
      setIsLoadingYearLevels(false);
    }
  };

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

  const handleSelectChange = (id, value) => {
    setSubjectFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

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

    if (!session.selectedCourseId) {
      errors.course = "Course is required";
    }

    if (!session.selectedYearLevelId) {
      errors.yearLevel = "Year Level is required";
    }

    return errors;
  };

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

    if (!session.selectedYearLevelId) {
      toast.error("Please select a year level to add a subject.");
      setIsSubmitting(false);
      return;
    }

    try {
      const subjectPath = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.selectedDeptId}/courses/${session.selectedCourseId}/year_levels/${session.selectedYearLevelId}/subjects`;

      const newSubjectData = {
        ...subjectFormData,
        units: Number(subjectFormData.units),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, subjectPath), newSubjectData);

      onSubjectAdded({ ...newSubjectData, id: docRef.id });
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

  const isDisabled = !activeSession || isLoadingDepartments || departments.length === 0 || !session.selectedYearLevelId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" disabled={!session || !session.selectedYearLevelId}>
          <Plus className="h-4 w-4" /> Add Subject
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
                disabled={isDisabled}
                onValueChange={(value) => {
                  handleSelectChange("department", value);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* course */}
            <div className="space-y-1">
              <Label htmlFor="course">
                Course <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={!session.selectedDeptId || isLoadingCourses}
                onValueChange={(value) => handleSelectChange("course", value)}
                value={subjectFormData.course}
              >
                <SelectTrigger id="course" className="w-full">
                  <SelectValue placeholder="Select Course" />
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
                Year Level <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                disabled={!session.selectedCourseId || isLoadingYearLevels}
                onValueChange={(value) => handleSelectChange("yearLevel", value)}
                value={subjectFormData.yearLevel}
              >
                <SelectTrigger id="yearLevel" className="w-full">
                  <SelectValue placeholder="Select Year Level" />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels
                    .slice()
                    .sort((a, b) => getYearLevelNumber(a.yearLevelName) - getYearLevelNumber(b.yearLevelName))
                    .map((yl) => (
                      <SelectItem key={yl.id} value={yl.id}>
                        {yl.yearLevelName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormError message={formErrors.yearLevel} />
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

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={isSubmitting || isDisabled}>
              {isSubmitting ? "Adding..." : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}