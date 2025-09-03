import { db } from "@/api/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  getDoc,
  deleteDoc,
  doc,
  query,
  where,
  collectionGroup,
} from "firebase/firestore";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { AlertTriangle, Info, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveSession } from "@/context/ActiveSessionContext";
import AddScheduleModal from "@/components/AdminComponents/AddScheduleModal";
import ScheduleCalendar from "@/components/AdminComponents/ScheduleCalendar";

// helper function to extract year level number for sorting
const getYearLevelNumber = (name) => {
  const match = name && name.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

// helper function for year suffixes
const getYearLevelSuffix = (num) => {
  const n = parseInt(num);
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
};

export default function ScheduleTable() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [yearLevels, setYearLevels] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);

  const isNoActiveSession = !activeSession || !activeSession.id;
  const isNoActiveSemester = activeSession && !activeSession.semesterId;
  const canAddSchedule =
    selectedDepartment &&
    selectedCourse &&
    selectedYearLevel &&
    selectedSection &&
    !isNoActiveSession;

  // effect to get departments for the active session
  useEffect(() => {
    if (sessionLoading || !activeSession?.semesterId) {
      setDepartments([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const deptPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
    const unsubscribe = onSnapshot(
      collection(db, deptPath),
      (snapshot) => {
        const depts = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().departmentName,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setDepartments(depts);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching departments:", error);
        toast.error("Failed to fetch departments.");
        setDepartments([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeSession, sessionLoading]);
  // effect to get courses when a department is selected
  useEffect(() => {
    if (!selectedDepartment || !activeSession?.semesterId) {
      setCourses([]);
      setSelectedCourse("");
      return () => {};
    }

    setLoading(true);
    const coursePath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses`;

    const unsubscribe = onSnapshot(
      collection(db, coursePath),
      (snapshot) => {
        const coursesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().courseName,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCourses(coursesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courses:", error);
        toast.error("Failed to fetch courses.");
        setCourses([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDepartment, activeSession]);
  // effect to get year levels when a course is selected
  useEffect(() => {
    if (!selectedCourse || !activeSession?.semesterId || !selectedDepartment) {
      setYearLevels([]);
      setSelectedYearLevel("");
      return () => {};
    }

    setLoading(true);
    const yearLevelPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/year_levels`;

    const unsubscribe = onSnapshot(
      collection(db, yearLevelPath),
      (snapshot) => {
        const levels = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const suffix = getYearLevelSuffix(doc.id);
            const defaultName = `${doc.id}${suffix} Year`;

            return {
              id: doc.id,
              name: data.yearLevelName || defaultName,
              yearLevelName: data.yearLevelName || defaultName,
            };
          })
          .sort(
            (a, b) =>
              getYearLevelNumber(a.yearLevelName) -
              getYearLevelNumber(b.yearLevelName)
          );

        setYearLevels(levels);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching year levels:", error);
        toast.error("Failed to fetch year levels.");
        setYearLevels([]); // Return empty array on error
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCourse, activeSession, selectedDepartment]);
  // effect to get sections when year level is selected
  useEffect(() => {
    if (
      !selectedYearLevel ||
      !activeSession?.semesterId ||
      !selectedDepartment ||
      !selectedCourse
    ) {
      setSections([]);
      setSelectedSection("");
      return () => {};
    }

    setLoading(true);
    const sectionsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/year_levels/${selectedYearLevel}/sections`;

    const unsubscribe = onSnapshot(
      collection(db, sectionsPath),
      (snapshot) => {
        const sectionsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().sectionName || `Section ${doc.id}`,
          }))
          .sort((a, b) => a.id.localeCompare(b.id));

        setSections(sectionsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sections:", error);
        toast.error("Failed to fetch sections.");
        setSections([]); // Return empty array on error
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedYearLevel, activeSession, selectedDepartment, selectedCourse]);

  // effect to fetch schedules when all filters are selected
  useEffect(() => {
    if (canAddSchedule) {
      fetchSchedules();
    } else {
      setScheduleData([]);
    }
  }, [
    selectedDepartment,
    selectedCourse,
    selectedYearLevel,
    selectedSection,
    canAddSchedule,
  ]);

  // fetch schedules
  const fetchSchedules = async () => {
    if (!canAddSchedule) {
      setScheduleData([]);
      return;
    }

    try {
      setLoading(true);
      const schedulesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/year_levels/${selectedYearLevel}/sections/${selectedSection}/schedules`;
      const snapshot = await getDocs(collection(db, schedulesPath));

      const schedules = snapshot.empty
        ? []
        : snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              subjectName: data.subjectName || "Unknown Subject",
              roomName: data.roomName || "No Room Assigned",
              instructorName: data.instructorName || "No Instructor Assigned",
              startTime: data.startTime || "8:00 AM",
              endTime: data.endTime || "9:00 AM",
              days: data.days || [],
              scheduleType: data.scheduleType || "LECTURE",
              color: data.color || "blue",
            };
          });

      setScheduleData(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to fetch schedules.");
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = (newSchedule) => {
    setScheduleData((prev) => [...prev, newSchedule]);
  };

  // function to check if a room is used in other schedules
  const isRoomUsedElsewhere = async (roomId, excludeScheduleId) => {
    try {
      // Query all schedules for this room across all departments/courses
      const allSchedulesQuery = query(
        collectionGroup(db, "schedules"),
        where("roomId", "==", roomId)
      );

      const schedulesSnapshot = await getDocs(allSchedulesQuery);

      // Check if there are any schedules using this room apart from the one being deleted/updated
      return schedulesSnapshot.docs.some(
        (doc) => doc.id !== excludeScheduleId && doc.data().roomId === roomId
      );
    } catch (error) {
      console.error("Error checking if room is used elsewhere:", error);
      return false; // Assume it's not used elsewhere to be safe
    }
  };

  const handleScheduleUpdated = async (updatedSchedule) => {
    try {
      const schedulePath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/year_levels/${selectedYearLevel}/sections/${selectedSection}/schedules/${updatedSchedule.id}`;

      // Get the original schedule to check if room has changed
      const originalDoc = await getDoc(doc(db, schedulePath));
      if (originalDoc.exists()) {
        const originalData = originalDoc.data();

        // If room changed, update the old room's status
        if (
          originalData.roomId &&
          originalData.roomId !== updatedSchedule.roomId
        ) {
          const oldRoomRef = doc(db, "rooms", originalData.roomId);
          await updateDoc(oldRoomRef, {
            status: "available",
            roomType: "",
            updatedAt: new Date(),
          });
        }

        // Update the new room's status
        if (updatedSchedule.roomId) {
          const newRoomRef = doc(db, "rooms", updatedSchedule.roomId);
          await updateDoc(newRoomRef, {
            status: "scheduled",
            roomType: updatedSchedule.scheduleType || "lecture",
            updatedAt: new Date(),
          });
        }
      }

      // Prepare the data to update in Firestore
      const scheduleData = {
        subjectName: updatedSchedule.subjectName,
        roomName: updatedSchedule.roomName,
        roomId: updatedSchedule.roomId,
        instructorName: updatedSchedule.instructorName,
        instructorId: updatedSchedule.instructorId,
        startTime: updatedSchedule.startTime,
        endTime: updatedSchedule.endTime,
        days: updatedSchedule.days,
        color: updatedSchedule.color || "blue",
        scheduleType: updatedSchedule.scheduleType || "lecture",
      };

      // Add date fields if they exist in the updated schedule
      if (updatedSchedule.startDate) {
        scheduleData.startDate = updatedSchedule.startDate;
      }

      if (updatedSchedule.endDate) {
        scheduleData.endDate = updatedSchedule.endDate;
      }

      // Update the document in Firestore
      await updateDoc(doc(db, schedulePath), scheduleData);

      // Update the local state
      setScheduleData((prev) =>
        prev.map((schedule) =>
          schedule.id === updatedSchedule.id ? updatedSchedule : schedule
        )
      );

      toast.success("Schedule updated successfully");
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const schedulePath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/year_levels/${selectedYearLevel}/sections/${selectedSection}/schedules/${scheduleId}`;
      const scheduleDoc = await getDoc(doc(db, schedulePath));

      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        const roomId = scheduleData.roomId;

        if (roomId) {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
            roomType: "",
            status: "available",
            updatedAt: new Date(),
          });

          // check if the room is used in other schedules
          const isUsedElsewhere = await isRoomUsedElsewhere(roomId, scheduleId);
          if (!isUsedElsewhere) {
            const roomRef = doc(db, "rooms", roomId);
            await updateDoc(roomRef, {
              roomType: "",
              status: "available",
              updatedAt: new Date(),
            });
          }
        }
      }

      // delete schedule from Firestore
      await deleteDoc(doc(db, schedulePath));
      // schedule deleted successfully is implemented in the ScheduleCalendar.jsx
      setScheduleData((prevData) =>
        prevData.filter((schedule) => schedule.id !== scheduleId)
      );
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Failed to delete schedule.");
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="w-full p-4 space-y-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div>
          <Skeleton className="h-18 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <Separator />
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(4)
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
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Skeleton className="h-10 w-full sm:w-[300px]" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="bg-muted/40 rounded-md p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Schedule</h1>
          <p className="text-muted-foreground">
            Manage the schedule for classes, including time slots and room
            assignments.
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
                  ? "Schedules for Active School Year and Semester"
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
                  to manage schedules.
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
              <AddScheduleModal
                onScheduleAdded={handleAddSchedule}
                departmentId={selectedDepartment}
                courseId={selectedCourse}
                yearLevel={selectedYearLevel}
                sectionId={selectedSection}
                activeSession={activeSession}
                canAddSchedule={canAddSchedule}
                existingSchedules={scheduleData}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Filter Schedule</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                  {/* department filter */}
                  <div className="flex flex-col flex-1">
                    <Label
                      className="mb-1 text-sm sm:text-base"
                      htmlFor="department"
                    >
                      Department
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a department to filter courses.
                    </span>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      disabled={isNoActiveSession}
                    >
                      <SelectTrigger
                        id="department"
                        className="w-full sm:max-w-xs md:max-w-md lg:max-w-md xl:max-w-lg"
                      >
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* course filter */}
                  <div className="flex flex-col flex-1">
                    <Label
                      className="mb-1 text-sm sm:text-base"
                      htmlFor="course"
                    >
                      Course
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a course to filter year levels.
                    </span>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                      disabled={!selectedDepartment || isNoActiveSession}
                    >
                      <SelectTrigger
                        className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg"
                        id="course"
                      >
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* year level filter */}
                  <div className="flex flex-col flex-1">
                    <Label
                      className="mb-1 text-sm sm:text-base"
                      htmlFor="yearLevel"
                    >
                      Year Level
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a year level to filter sections.
                    </span>
                    <Select
                      value={selectedYearLevel}
                      onValueChange={setSelectedYearLevel}
                      disabled={!selectedCourse || isNoActiveSession}
                    >
                      <SelectTrigger
                        className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg"
                        id="yearLevel"
                      >
                        <SelectValue placeholder="Select Year Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearLevels.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* section filter */}
                  <div className="flex flex-col flex-1">
                    <Label
                      className="mb-1 text-sm sm:text-base"
                      htmlFor="section"
                    >
                      Section
                    </Label>
                    <span className="text-xs sm:text-sm text-muted-foreground mb-2">
                      Select a section to view schedules.
                    </span>
                    <Select
                      value={selectedSection}
                      onValueChange={setSelectedSection}
                      disabled={!selectedYearLevel || isNoActiveSession}
                    >
                      <SelectTrigger
                        className="w-full sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg"
                        id="section"
                      >
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Schedule button and calendar or Empty State */}
          {canAddSchedule ? (
            <>
              {scheduleData.length > 0 ? (
                <ScheduleCalendar
                  activeSession={activeSession}
                  canAddSchedule={canAddSchedule}
                  scheduleData={scheduleData}
                  loading={loading}
                  departments={departments}
                  courses={courses}
                  yearLevels={yearLevels}
                  sections={sections}
                  selectedDepartment={selectedDepartment}
                  selectedCourse={selectedCourse}
                  selectedYearLevel={selectedYearLevel}
                  selectedSection={selectedSection}
                  onAddSchedule={handleAddSchedule}
                  onEditSchedule={handleScheduleUpdated}
                  onDeleteSchedule={handleDeleteSchedule}
                />
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <CalendarDays className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-lg font-medium">No schedules found.</p>
                      <p className="text-muted-foreground">
                        Click "Add Schedule" to get started.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No filters selected.</p>
                <p className="text-center text-muted-foreground">
                  Please select a department, course, year level, and section to
                  view and manage schedules.
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
              Please set an active semester in the School Year module to manage
              schedules.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
