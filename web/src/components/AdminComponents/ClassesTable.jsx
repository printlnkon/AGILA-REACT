import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info, BookText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/api/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { useClassList } from "@/context/ClassListContext";
import ClassesCard from "@/components/AdminComponents/ClassesCard";

// Helper function to get year level number for sorting
const getYearLevelNumber = (name) => {
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export default function ClassesTable() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const { filterState, setFilterState } = useClassList();
  const [selectedDeptId, setSelectedDeptId] = useState(
    filterState?.department || ""
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    filterState?.course || ""
  );
  const [selectedYearLevelId, setSelectedYearLevelId] = useState(
    filterState?.yearLevel || ""
  );

  // Update the context when filters change
  useEffect(() => {
    setFilterState({
      department: selectedDeptId,
      course: selectedCourseId,
      yearLevel: selectedYearLevelId,
      // Add any other filters you're using
    });
  }, [selectedDeptId, selectedCourseId, selectedYearLevelId, setFilterState]);

  // Effect to get departments for the active session
  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (!activeSession || !activeSession.semesterId) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    const deptPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
    const unsubscribe = onSnapshot(
      collection(db, deptPath),
      (snapshot) => {
        setDepartments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching departments:", err);
        toast.error("Failed to load departments.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [activeSession, sessionLoading]);

  // Effect to get courses when a department is selected
  useEffect(() => {
    if (!selectedDeptId || !activeSession || !activeSession.semesterId) {
      setCourses([]);
      setSelectedCourseId("");
      return;
    }
    const coursePath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses`;
    const unsubscribe = onSnapshot(
      collection(db, coursePath),
      (snapshot) => {
        setCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.error("Error fetching courses:", err);
        toast.error("Failed to load courses.");
      }
    );
    return () => unsubscribe();
  }, [selectedDeptId, activeSession]);

  // Effect to get year levels when a course is selected
  useEffect(() => {
    if (!selectedCourseId || !activeSession || !activeSession.semesterId) {
      setYearLevels([]);
      setSelectedYearLevelId("");
      return;
    }
    const yearLevelPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels`;
    const unsubscribe = onSnapshot(
      collection(db, yearLevelPath),
      (snapshot) => {
        const levels = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setYearLevels(levels);
      },
      (err) => {
        console.error("Error fetching year levels:", err);
        toast.error("Failed to load year levels.");
      }
    );
    return () => unsubscribe();
  }, [selectedCourseId, activeSession, selectedDeptId]);

  // Effect to fetch sections when a year level is selected
  useEffect(() => {
    if (!selectedYearLevelId || !activeSession || !activeSession.semesterId) {
      setSections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sectionsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels/${selectedYearLevelId}/sections`;
    const unsubscribe = onSnapshot(
      collection(db, sectionsPath),
      (snapshot) => {
        const fetchedSections = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          academicYearId: activeSession.id,
          semesterId: activeSession.semesterId,
          semesterName: activeSession.semesterName,
          departmentId: selectedDeptId,
          courseId: selectedCourseId,
          yearLevelId: selectedYearLevelId,
        }));
        setSections(fetchedSections);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching sections:", err);
        setLoading(false);
        toast.error("Failed to load sections.");
      }
    );
    return () => unsubscribe();
  }, [selectedYearLevelId, activeSession, selectedDeptId, selectedCourseId]);

  if (loading || sessionLoading) {
    return (
      // header loading
      <div className="w-full p-4 space-y-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div>
          <Skeleton className="h-18 w-full" />
        </div>

        {/* filter loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <Separator />
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center">
          <Skeleton className="h-8 w-16" />
        </div>
        {/* content loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 flex flex-col space-y-2"
              >
                <div className="flex flex-col">
                  <div>
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center w-full">
                  <div className="flex-1 mr-2">
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex-1 ml-2">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  const isNoActiveSession = !activeSession || !activeSession.id;
  const isNoActiveSemester = activeSession && !activeSession.semesterId;

  return (
    <div className="flex h-full w-full flex-col p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Classes</h1>
          <p className="text-muted-foreground">
            Manage classes available in the system.
          </p>
        </div>
      </div>

      {/* classes active session - display after loading completes */}
      <div className="mb-4">
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            {!isNoActiveSession ? (
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-ring" />
            ) : (
              <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
            )}
            <div>
              <p className="font-semibold">
                {!isNoActiveSession
                  ? "Classes for Active School Year and Semester"
                  : "No Active School Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear ||
                    activeSession.academicYearName ||
                    activeSession.name}{" "}
                  |{" "}
                  {!isNoActiveSemester
                    ? activeSession.semesterName
                    : "No Active Semester"}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the School Year module and set an active session
                  to manage classes.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!isNoActiveSession && !isNoActiveSemester ? (
        <>
          {/* filtering */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Classes</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent>
              {/* department filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="department" className="mb-1">Department</Label>
                  <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Select a department to filter courses.
                  </span>
                  <Select
                    value={selectedDeptId}
                    onValueChange={setSelectedDeptId}
                    disabled={departments.length === 0}
                  >
                    <SelectTrigger id="department" className="w-full sm:max-w-xs md:max-w-md lg:max-w-md xl:max-w-lg">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* course filter */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="course" className="mb-1">Course</Label>
                  <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Select a course to filter year levels.
                  </span>
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    disabled={!selectedDeptId || courses.length === 0}
                  >
                    <SelectTrigger id="course" className="w-full sm:max-w-xs md:max-w-md lg:max-w-md xl:max-w-lg">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* year level filter */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="year-level" className="mb-1">Year Level</Label>
                  <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Select a year level to filter classes.
                  </span>
                  <Select
                    value={selectedYearLevelId}
                    onValueChange={setSelectedYearLevelId}
                    disabled={!selectedCourseId || yearLevels.length === 0}
                  >
                    <SelectTrigger id="year-level" className="w-full sm:max-w-xs md:max-w-md lg:max-w-md xl:max-w-lg">
                      <SelectValue placeholder="Select Year Level" />
                    </SelectTrigger>
                    <SelectContent>
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
              </div>
            </CardContent>
          </Card>

          {/* display sections */}
          {selectedYearLevelId ? (
            sections.length > 0 ? (
              <ClassesCard sections={sections} />
            ) : (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-2">
                  <BookText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No sections found.</p>
                  <p className="text-center text-muted-foreground">
                    No sections are available for the selected criteria.
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2">
                <BookText className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">
                  No filters selected.
                </p>
                <p className="text-center text-muted-foreground">
                  Please select a department, course, and year level to see
                  classes.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : isNoActiveSemester && !isNoActiveSession ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-2">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">No Active Semester</p>
            <p className="text-center text-muted-foreground">
              Please set an active semester in the School Year module to
              manage classes.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
