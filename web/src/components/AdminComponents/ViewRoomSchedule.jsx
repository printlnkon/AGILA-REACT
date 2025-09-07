import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Calendar, Clock, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveSession } from "@/context/ActiveSessionContext";

export default function ViewRoomSchedule({ open, onOpenChange, room }) {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchTriggered, setFetchTriggered] = useState(false);

  useEffect(() => {
    // Reset fetch trigger when modal closes
    if (!open) {
      setFetchTriggered(false);
      return;
    }

    // Only fetch once when the modal opens
    if (
      open &&
      !fetchTriggered &&
      room &&
      activeSession?.id &&
      activeSession?.semesterId
    ) {
      setFetchTriggered(true);
      fetchRoomSchedules();
    }
  }, [open, room, activeSession]);

  const fetchRoomSchedules = async () => {
    setLoading(true);
    try {
      // Get all departments
      const departmentsRef = collection(
        db,
        `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`
      );
      const departmentsSnapshot = await getDocs(departmentsRef);

      const allSchedules = [];

      // For each department
      for (const deptDoc of departmentsSnapshot.docs) {
        const departmentId = deptDoc.id;
        const departmentName = deptDoc.data().name || "Unknown Department";

        // Get all courses in this department
        const coursesRef = collection(
          db,
          `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses`
        );
        const coursesSnapshot = await getDocs(coursesRef);

        // For each course
        for (const courseDoc of coursesSnapshot.docs) {
          const courseId = courseDoc.id;
          const courseName = courseDoc.data().courseName || "Unknown Course";

          // Get all year levels in this course
          const yearLevelsRef = collection(
            db,
            `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses/${courseId}/year_levels`
          );
          const yearLevelsSnapshot = await getDocs(yearLevelsRef);

          // For each year level
          for (const yearLevelDoc of yearLevelsSnapshot.docs) {
            const yearLevel = yearLevelDoc.id;
            const yearLevelName =
              yearLevelDoc.data().yearLevelName || `Year ${yearLevel}`;

            // Get all sections in this year level
            const sectionsRef = collection(
              db,
              `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses/${courseId}/year_levels/${yearLevel}/sections`
            );
            const sectionsSnapshot = await getDocs(sectionsRef);

            // For each section
            for (const sectionDoc of sectionsSnapshot.docs) {
              const sectionId = sectionDoc.id;
              const sectionData = sectionDoc.data();
              const sectionName =
                sectionData.sectionName || `Section ${sectionId}`;

              // Get schedules for this section that use the current room
              const schedulesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses/${courseId}/year_levels/${yearLevel}/sections/${sectionId}/schedules`;
              const schedulesRef = collection(db, schedulesPath);
              const q = query(schedulesRef, where("roomId", "==", room.id));
              const schedulesSnapshot = await getDocs(q);

              // Process each schedule
              for (const scheduleDoc of schedulesSnapshot.docs) {
                const scheduleData = scheduleDoc.data();

                // Extract days from the schedule data
                const days = {
                  monday: scheduleData.monday || false,
                  tuesday: scheduleData.tuesday || false,
                  wednesday: scheduleData.wednesday || false,
                  thursday: scheduleData.thursday || false,
                  friday: scheduleData.friday || false,
                  saturday: scheduleData.saturday || false,
                  sunday: scheduleData.sunday || false,
                };

                // Add to schedules array with all necessary information
                allSchedules.push({
                  id: scheduleDoc.id,
                  ...scheduleData,
                  days: days,
                  subjectName: scheduleData.subjectName || "Unknown Subject",
                  subjectCode: scheduleData.subjectCode || "",
                  sectionName: sectionName,
                  courseName: courseName,
                  yearLevelName: yearLevelName,
                  departmentName: departmentName,
                  instructorName: scheduleData.instructorName || "Unassigned",
                });
              }
            }
          }
        }
      }

      setSchedules(allSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  // function to format time
  const formatTime = (time) => {
    if (!time) return "N/A";
    return time;
  };

  // to get days array from schedule
  const getDays = (scheduleDays) => {
    if (!scheduleDays) return ["N/A"];

    const days = [];
    if (scheduleDays.monday) days.push("Monday");
    if (scheduleDays.tuesday) days.push("Tuesday");
    if (scheduleDays.wednesday) days.push("Wednesday");
    if (scheduleDays.thursday) days.push("Thursday");
    if (scheduleDays.friday) days.push("Friday");
    if (scheduleDays.saturday) days.push("Saturday");
    if (scheduleDays.sunday) days.push("Sunday");

    return days.length > 0 ? days : ["N/A"];
  };

  // Show loading while fetching active session
  if (sessionLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Room Schedules - {room?.roomNo}
            </DialogTitle>
            <DialogDescription>
              Loading active session information...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex flex-col space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Separator />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if there's no active session
  if (
    !sessionLoading &&
    (!activeSession || !activeSession.id || !activeSession.semesterId)
  ) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Room Schedules - {room?.roomNo}
            </DialogTitle>
            <DialogDescription>
              Cannot display schedules: No active academic session found.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-10">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Active Session</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There is currently no active academic year or semester. Please
              activate an academic session to view schedules.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button className="cursor-pointer">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Room Schedules - {room?.roomNo}
          </DialogTitle>
          <DialogDescription>
            View all schedules assigned to {room?.roomNo} for{" "}
            {activeSession?.acadYear || "Current School Year"},{" "}
            {activeSession?.semesterName || "Current Semester"}.
          </DialogDescription>
        </DialogHeader>

        {/* loading skeleton state */}
        <div className="mt-4">
          {loading ? (
            // Loading skeletons
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Separator />
                  </div>
                ))}
            </div>
          ) : schedules.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No schedules found.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This room currently has no schedules assigned to it.
              </p>
            </div>
          ) : (
            // Schedule list
            <ScrollArea className="h-[60vh] pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Instructor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      {/* subject code & name */}
                      <TableCell>
                        <div className="text-md">
                          {schedule.subjectName || "Unknown Subject"}
                        </div>
                        <div className="text-md text-muted-foreground">
                          {schedule.subjectCode || "No code"}
                        </div>
                      </TableCell>
                      {/* schedule time & day */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getDays(schedule.days || schedule).map((day) => (
                            <Badge
                              key={day}
                              className="text-md"
                            >
                              {day}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-md">
                            {formatTime(schedule.startTime)} -{" "}
                            {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </TableCell>
                      {/* section, course, and year level name */}
                      <TableCell>
                        <div>
                          <Badge className="text-md">{schedule.sectionName || "No Section"}</Badge>
                        </div>
                        <div className="text-md text-muted-foreground mt-1">
                          {schedule.yearLevelName}
                        </div>
                      </TableCell>
                      {/* instructor/teacher */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.instructorName || "Unassigned"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <Button className="cursor-pointer">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
