import { db } from "@/api/firebase";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { collection, getDocs } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// helper for sorting year levels numerically
const getYearLevelNumber = (name) => {
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export default function DuplicateSubjectForm({
  session,
  onSubjectSelected,
  onCompletionStateChange,
}) {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedYearLevelId, setSelectedYearLevelId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState({
    departments: false,
    courses: false,
    yearLevels: false,
    subjects: false,
  });

  // fetch departments
  useEffect(() => {
    if (!session?.id || !session?.semesterId) return;
    const fetchDepartments = async () => {
      setLoading((prev) => ({ ...prev, departments: true }));
      const path = `academic_years/${session.id}/semesters/${session.semesterId}/departments`;
      try {
        const snapshot = await getDocs(collection(db, path));
        setDepartments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        toast.error("Failed to load departments for duplication.");
      } finally {
        setLoading((prev) => ({ ...prev, departments: false }));
      }
    };
    fetchDepartments();
  }, [session]);

  // fetch courses when department changes
  useEffect(() => {
    setCourses([]);
    setSelectedCourseId("");
    if (!selectedDeptId) return;
    const fetchCourses = async () => {
      setLoading((prev) => ({ ...prev, courses: true }));
      const path = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${selectedDeptId}/courses`;
      try {
        const snapshot = await getDocs(collection(db, path));
        setCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        toast.error("Failed to load courses for duplication.");
      } finally {
        setLoading((prev) => ({ ...prev, courses: false }));
      }
    };
    fetchCourses();
  }, [selectedDeptId, session]);

  // fetch year levels when course changes
  useEffect(() => {
    setYearLevels([]);
    setSelectedYearLevelId("");
    if (!selectedCourseId) return;
    const fetchYearLevels = async () => {
      setLoading((prev) => ({ ...prev, yearLevels: true }));
      const path = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels`;
      try {
        const snapshot = await getDocs(collection(db, path));
        setYearLevels(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        toast.error("Failed to load year levels for duplication.");
      } finally {
        setLoading((prev) => ({ ...prev, yearLevels: false }));
      }
    };
    fetchYearLevels();
  }, [selectedCourseId, selectedDeptId, session]);

  // fetch subjects when year level changes
  useEffect(() => {
    setSubjects([]);
    setSelectedSubjectId("");
    if (!selectedYearLevelId) return;
    const fetchSubjects = async () => {
      setLoading((prev) => ({ ...prev, subjects: true }));
      const path = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels/${selectedYearLevelId}/subjects`;
      try {
        const snapshot = await getDocs(collection(db, path));
        setSubjects(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        toast.error("Failed to load subjects for duplication.");
      } finally {
        setLoading((prev) => ({ ...prev, subjects: false }));
      }
    };
    fetchSubjects();
  }, [selectedYearLevelId, selectedCourseId, selectedDeptId, session]);

  // notify parent component when a subject is selected or deselected
  useEffect(() => {
    const subjectToCopy = subjects.find((s) => s.id === selectedSubjectId);
    if (subjectToCopy) {
      onSubjectSelected(subjectToCopy); // Send subject data to parent
      onCompletionStateChange(true); // Notify parent that selection is complete
    } else {
      onCompletionStateChange(false); // Notify parent that selection is incomplete
    }
  }, [selectedSubjectId, subjects, onSubjectSelected, onCompletionStateChange]);

  return (
    <div className="pt-2 space-y-4">
      <p className="text-sm text-muted-foreground">
        Select an existing subject to use its details as a template. The subject
        will be added to the currently selected location. All fields marked with{" "}
        <span className="text-destructive">*</span> are required.
      </p>
      {/* department dropdown */}
      <div className="space-y-1">
        <Label>
          Source Department <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedDeptId}
          onValueChange={setSelectedDeptId}
          disabled={loading.departments}
        >
          <SelectTrigger className="w-full">
            {loading.departments ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <SelectValue placeholder="Select Department" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {[...departments]
              .sort((a, b) => a.departmentName.localeCompare(b.departmentName))
              .map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* course dropdown */}
      <div className="space-y-1">
        <Label>
          Source Course <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedCourseId}
          onValueChange={setSelectedCourseId}
          disabled={!selectedDeptId || loading.courses}
        >
          <SelectTrigger className="w-full">
            {loading.courses ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <SelectValue placeholder="Select Course" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {[...courses]
              .sort((a, b) => a.courseName.localeCompare(b.courseName))
              .map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.courseName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* year level dropdown */}
      <div className="space-y-1">
        <Label>
          Source Year Level <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedYearLevelId}
          onValueChange={setSelectedYearLevelId}
          disabled={!selectedCourseId || loading.yearLevels}
        >
          <SelectTrigger className="w-full">
            {loading.yearLevels ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <SelectValue placeholder="Select Year Level" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {yearLevels
              .slice()
              .sort(
                (a, b) =>
                  getYearLevelNumber(a.yearLevelName) -
                  getYearLevelNumber(b.yearLevelName)
              )
              .map((yl) => (
                <SelectItem key={yl.id} value={yl.id}>
                  {yl.yearLevelName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* subject dropdown */}
      <div className="space-y-1">
        <Label>
          Source Subject <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedSubjectId}
          onValueChange={setSelectedSubjectId}
          disabled={!selectedYearLevelId || loading.subjects}
        >
          <SelectTrigger className="w-full">
            {loading.subjects ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <SelectValue placeholder="Select Subject to Duplicate" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {subjects.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.subjectCode} - {sub.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
