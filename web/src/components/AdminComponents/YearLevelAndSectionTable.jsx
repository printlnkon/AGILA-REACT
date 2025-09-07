import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, Layers } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useActiveSession } from "@/context/ActiveSessionContext";
import AddYearLevelModal from "@/components/AdminComponents/AddYearLevelModal";
import YearLevelCard from "@/components/AdminComponents/YearLevelCard";

const getYearLevelNumber = (name) => {
  // Match leading digits (e.g., "1" from "1st Year")
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export default function YearLevelAndSectionTable() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [yearLevels, setYearLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Effect to get departments for the active session
  useEffect(() => {
    if (sessionLoading) {
      return; // Wait until session loading completes
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
      return;
    }
    setLoading(true);
    const yearLevelPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels`;
    const unsubscribe = onSnapshot(
      collection(db, yearLevelPath),
      (snapshot) => {
        const levels = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setYearLevels(levels);
        setLoading(false);
      },
      (error) => {
        toast.error("Failed to load year levels.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedCourseId, activeSession, selectedDeptId]);

  const handleEditYearLevel = async (yearLevel, newName) => {
    const path = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels/${yearLevel.id}`;
    try {
      await updateDoc(doc(db, path), {
        yearLevelName: newName,
        updatedAt: serverTimestamp(),
      });
      toast.success("Year level updated successfully.");
    } catch (error) {
      toast.error("Failed to update year level.");
    }
  };

  const handleDeleteYearLevel = async (yearLevel) => {
    const path = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDeptId}/courses/${selectedCourseId}/year_levels/${yearLevel.id}`;
    const sectionsRef = collection(db, `${path}/sections`);
    try {
      // check if there are any sections
      const sectionsSnapshot = await getDocs(sectionsRef);
      if (!sectionsSnapshot.empty) {
        toast.error(
          "Cannot delete year level: Please delete all sections first."
        );
        return;
      }
      await deleteDoc(doc(db, path));
      toast.success("Year level deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete year level.");
    }
  };

  const getSelectedCourse = () =>
    courses.find((c) => c.id === selectedCourseId);

  if (loading || sessionLoading) {
    return (
      <div className="w-full p-4 space-y-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        {/* skeleton for department active session */}
        <div>
          <Skeleton className="h-18 w-full" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add year level button */}
          <Skeleton className="h-9 w-28" />
        </div>
        {/* skeleton for department and course filters */}
        <div>
          <Skeleton className="h-24 w-full mb-4 rounded-md" />
        </div>

        {/* skeleton for year level grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 flex flex-col space-y-2"
              >
                {/* cardheader skeleton */}
                <div className="flex justify-between items-start pb-2">
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
                {/* skeleton for section text */}
                <div className="flex justify-start">
                  <Skeleton className="h-6 w-32" />
                </div>
                {/* skeleton for number of sections */}
                <div className="flex justify-end">
                  <Skeleton className="h-6 w-8" />
                </div>
                {/* skeleton cardcontent (SectionList) */}
                <div className="flex-grow pb-2">
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-8 w-full mb-2" />
                </div>
                {/* skeleton cardfooter (AddSectionModal) */}
                <div>
                  <Skeleton className="h-9 w-32" />
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
          <h1 className="text-2xl font-bold">Manage Year Level and Section</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete year levels and sections available in the
            system.
          </p>
        </div>
      </div>

      {/* year levels and sections active session - display after loading completes */}
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
                  ? "Year Levels and Sections for Active School Year and Semester"
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
                  to manage year levels and sections.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* only show the add year level button and filter if there's an active academic year and semester */}
      {!isNoActiveSession && !isNoActiveSemester ? (
        <>
          {/* department filter */}
          <div className="flex flex-col gap-4">
            {/* add year level btn */}
            <div>
              <AddYearLevelModal
                course={getSelectedCourse()}
                session={{ ...activeSession, departmentId: selectedDeptId }}
                disabled={!selectedCourseId}
              />
            </div>
            {/* department and course filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Year Level and Section</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* department filter */}
                  <div className="flex flex-col flex-1">
                    <Label className="mb-1">Department</Label>
                    <span className="text-sm text-muted-foreground mb-2">
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
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.departmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* course filter */}
                  <div className="flex flex-col flex-1">
                    <Label className="mb-1">Course</Label>
                    <span className="text-sm text-muted-foreground mb-2">
                      Select a course to filter year levels.
                    </span>
                    <Select
                      value={selectedCourseId}
                      onValueChange={setSelectedCourseId}
                      disabled={!selectedDeptId}
                    >
                      <SelectTrigger className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* content display */}
          <div>
            {selectedCourseId ? (
              yearLevels.length > 0 ? (
                // if yearlevels exist, render the grid
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
                  {yearLevels
                    .slice()
                    .sort(
                      (a, b) =>
                        getYearLevelNumber(a.yearLevelName) -
                        getYearLevelNumber(b.yearLevelName)
                    )
                    .map((yl) => (
                      <YearLevelCard
                        key={yl.id}
                        yearLevel={yl}
                        course={getSelectedCourse()}
                        session={{
                          ...activeSession,
                          departmentId: selectedDeptId,
                        }}
                        onEdit={handleEditYearLevel}
                        onDelete={handleDeleteYearLevel}
                      />
                    ))}
                </div>
              ) : (
                // if yearlevels is empty and not loading, render the empty state card
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No year levels found.</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Add Year Level" to get started.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              // empty state when no department and course is selected
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-2">
                  <Layers className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    No filters selected.
                  </p>
                  <p className="text-center text-muted-foreground">
                    Please select a department and course to see the year levels
                    and sections.
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
              year levels and sections.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
