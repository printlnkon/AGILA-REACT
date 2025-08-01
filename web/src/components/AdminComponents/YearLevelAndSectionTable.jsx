import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  where,
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, Layers, Building2, BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import AddYearLevelModal from "@/components/AdminComponents/AddYearLevelModal";
import YearLevelCard from "@/components/AdminComponents/YearLevelCard";

const getYearLevelNumber = (name) => {
  // Match leading digits (e.g., "1" from "1st Year")
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

export default function YearLevelAndSectionTable() {
  const [activeSession, setActiveSession] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [yearLevels, setYearLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Effect to get the active academic session
  useEffect(() => {
    const q = query(
      collection(db, "academic_years"),
      where("status", "==", "Active")
    );
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const semQuery = query(
          collection(sessionDoc.ref, "semesters"),
          where("status", "==", "Active")
        );
        const semSnapshot = await getDocs(semQuery);
        if (!semSnapshot.empty) {
          const semesterDoc = semSnapshot.docs[0];
          setActiveSession({
            id: sessionDoc.id,
            ...sessionDoc.data(),
            semesterId: semesterDoc.id,
            ...semesterDoc.data(),
          });
        } else {
          setActiveSession({
            id: sessionDoc.id,
            ...sessionDoc.data(),
            semesterId: null,
            semesterName: null,
          });
          toast.error(
            `No active semester found for the academic year ${
              sessionDoc.data().acadYear
            }.`
          );
          setLoading(false);
        }
      } else {
        setActiveSession(null);
        toast.error("No active academic year found. Please set one.");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to get departments for the active session
  useEffect(() => {
    if (!activeSession) {
      // if no active session, it doesn't load departments
      setDepartments([]);
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
  }, [activeSession]);

  // Effect to get courses when a department is selected
  useEffect(() => {
    if (!selectedDeptId || !activeSession) {
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
    if (!selectedCourseId) {
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

  if (loading) {
    return (
      <div className="w-full">
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

  const isNoActiveSession = activeSession && !activeSession.id;

  return (
    <div className="flex h-full w-full flex-col">
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
                  ? "Year Levels and Sections for Active Academic Year and Semester"
                  : "No Active Academic Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} |{" "}
                  {activeSession.semesterName
                    ? ` ${activeSession.semesterName}`
                    : "No Active Semester"}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the Academic Year module and set an active
                  session to manage year levels and sections.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* only show the add year level button and filter if there's an active active academic year and semester */}
      {!isNoActiveSession ? (
        <>
          {/* department filter */}
          <div className="flex flex-col gap-4 py-4">
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
                      disabled={!activeSession || departments.length === 0}
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
                !loading && (
                  <Card className="py-12">
                    <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
                      <Layers className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium">
                        No year levels found.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click "Add Year Level" to get started.
                      </p>
                    </CardContent>
                  </Card>
                )
              )
            ) : (
              // empty state when no department and course is selected
              <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
                  <Layers className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    No department and course selected.
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
      ) : null}
    </div>
  );
}
