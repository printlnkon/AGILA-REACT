import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, BookText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveSession } from "@/context/ActiveSessionContext";
import AddSubjectModal from "@/components/AdminComponents/AddSubjectModal";
import SubjectCard from "@/components/AdminComponents/SubjectCard";

// Helper function to get year level number for sorting
const getYearLevelNumber = (name) => {
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export default function SubjectTable() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedYearLevelId, setSelectedYearLevelId] = useState("");

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
    const unsubscribe = onSnapshot(collection(db, deptPath), (snapshot) => {
      setDepartments(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });
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
    const unsubscribe = onSnapshot(collection(db, coursePath), (snapshot) => {
      setCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
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
      }
    );
    return () => unsubscribe();
  }, [selectedCourseId, activeSession, selectedDeptId]);

  // Effect to fetch subjects when a year level is selected
  useEffect(() => {
    if (!selectedYearLevelId || !activeSession || !activeSession.semesterId) {
      setSubjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const subjectPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels/${selectedYearLevelId}/subjects`;

    // Find the selected department name
    const selectedDept = departments.find((dept) => dept.id === selectedDeptId);
    const departmentName = selectedDept ? selectedDept.departmentName : "";

    // Find the selected course name
    const selectedCourse = courses.find(
      (course) => course.id === selectedCourseId
    );
    const courseName = selectedCourse ? selectedCourse.courseName : "";

    // Find the selected year level name
    const selectedYearLevel = yearLevels.find(
      (yl) => yl.id === selectedYearLevelId
    );
    const yearLevelName = selectedYearLevel
      ? selectedYearLevel.yearLevelName
      : "";

    const unsubscribe = onSnapshot(
      collection(db, subjectPath),
      (snapshot) => {
        const fetchedSubjects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          academicYearId: activeSession.id,
          semesterId: activeSession.semesterId,
          semesterName: activeSession.semesterName,
          departmentId: selectedDeptId,
          departmentName: departmentName,
          courseId: selectedCourseId,
          courseName: courseName,
          yearLevelId: selectedYearLevelId,
          yearLevelName: yearLevelName,
        }));
        setSubjects(fetchedSubjects);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching subjects:", err);
        setLoading(false);
        toast.error("Failed to load subjects.");
      }
    );
    return () => unsubscribe();
  }, [
    selectedYearLevelId,
    activeSession,
    selectedDeptId,
    selectedCourseId,
    departments,
    courses,
    yearLevels,
  ]);

  const handleSubjectUpdated = (updatedSubject) => {
    setSubjects(
      subjects.map((subject) => {
        if (subject.id === updatedSubject.id) {
          return {
            ...subject,
            subjectCode: updatedSubject.subjectCode,
            subjectName: updatedSubject.subjectName,
            description: updatedSubject.description,
            units: updatedSubject.units,
            withLaboratory: updatedSubject.withLaboratory,
            status: updatedSubject.status,
          };
        }
        return subject;
      })
    );
  };

  const handleSubjectDeleted = (deletedId) => {
    setSubjects(subjects.filter((subject) => subject.id !== deletedId));
  };

  const isNoActiveSession = !activeSession || !activeSession.id;
  const isNoActiveSemester = activeSession && !activeSession.semesterId;

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
        <div className="flex items-center gap-2 py-4">
          <Skeleton className="h-9 w-28" />
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
        {/* content loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 flex flex-col space-y-2"
              >
                <div className="flex justify-between items-start pb-2">
                  <div>
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-4 w-46" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Subjects</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete subjects available in the system.
          </p>
        </div>
      </div>

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
                  ? "Subjects for Active School Year and Semester"
                  : "No Active School Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} |{" "}
                  {!isNoActiveSemester
                    ? activeSession.semesterName
                    : "No Active Semester"}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the School Year module and set an active session
                  to manage subjects.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!isNoActiveSession && !isNoActiveSemester ? (
        <>
          <div className="flex flex-col gap-4">
            <div>
              {(() => {
                const selectedDept = departments.find(
                  (d) => d.id === selectedDeptId
                );
                const selectedCourse = courses.find(
                  (c) => c.id === selectedCourseId
                );
                const selectedYearLevel = yearLevels.find(
                  (yl) => yl.id === selectedYearLevelId
                );

                return (
                  <AddSubjectModal
                    isOpen={addDialogOpen}
                    onOpenChange={setAddDialogOpen}
                    onSubjectAdded={(newSubject) =>
                      setSubjects([...subjects, newSubject])
                    }
                    session={{
                      ...activeSession,
                      selectedDeptId,
                      selectedCourseId,
                      selectedYearLevelId,
                      selectedDeptName: selectedDept
                        ? selectedDept.departmentName
                        : null,
                      selectedCourseName: selectedCourse
                        ? selectedCourse.courseName
                        : null,
                      selectedYearLevelName: selectedYearLevel
                        ? selectedYearLevel.yearLevelName
                        : null,
                    }}
                  />
                );
              })()}
            </div>
            {/* department, year level, and course filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Subjects</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {/* department filter */}
                  <div className="flex flex-col flex-1">
                    <Label className="mb-1 text-sm sm:text-base">
                      Department
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a department to filter courses.
                    </span>
                    <Select
                      value={selectedDeptId}
                      onValueChange={setSelectedDeptId}
                      disabled={departments.length === 0}
                    >
                      <SelectTrigger className="w-full sm:max-w-xs md:max-w-md lg:max-w-md xl:max-w-lg">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...departments]
                          .sort((a, b) =>
                            a.departmentName.localeCompare(b.departmentName)
                          )
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.departmentName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* course filter */}
                  <div className="flex flex-col flex-1">
                    <Label className="mb-1 text-sm sm:text-base">Course</Label>{" "}
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a course to filter year levels.
                    </span>
                    <Select
                      value={selectedCourseId}
                      onValueChange={setSelectedCourseId}
                      disabled={!selectedDeptId || courses.length === 0}
                    >
                      <SelectTrigger className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...courses]
                          .sort((a, b) =>
                            a.courseName.localeCompare(b.courseName)
                          )
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.courseName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* year level filter */}
                  <div className="flex flex-col flex-1">
                    <Label className="mb-1 text-sm sm:text-base">
                      Year Level
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a year level to filter subjects.
                    </span>
                    <Select
                      value={selectedYearLevelId}
                      onValueChange={setSelectedYearLevelId}
                      disabled={!selectedCourseId || yearLevels.length === 0}
                    >
                      <SelectTrigger className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
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
          </div>

          <div>
            {selectedYearLevelId ? (
              subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      onSubjectUpdated={handleSubjectUpdated}
                      onSubjectDeleted={handleSubjectDeleted}
                    />
                  ))}
                </div>
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center space-y-2">
                    <BookText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No subjects found.</p>
                    <p className="text-center text-muted-foreground">
                      Click "Add Subject" to get started.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-2">
                  <BookText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No filters selected.</p>
                  <p className="text-center text-muted-foreground">
                    Please select a department, course, and year level to see
                    subjects.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : isNoActiveSemester && !isNoActiveSession ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-2">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">No Active Semester</p>
            <p className="text-center text-muted-foreground">
              Please set an active semester in the School Year module to manage
              subjects.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}