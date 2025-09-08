import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { db } from "@/api/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Calendar, Clock, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useActiveSession } from "@/context/ActiveSessionContext";

export default function ViewRoomSchedule({ open, onOpenChange, room }) {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchTriggered, setFetchTriggered] = useState(false);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const TIME_SLOTS = [
    "7:00 AM - 7:30 AM",
    "8:00 AM - 8:30 AM",
    "9:00 AM - 9:30 AM",
    "10:00 AM - 10:30 AM",
    "11:00 AM - 11:30 AM",
    "12:00 PM - 12:30 PM",
    "1:00 PM - 1:30 PM",
    "2:00 PM - 2:30 PM",
    "3:00 PM - 3:30 PM",
    "4:00 PM - 4:30 PM",
    "5:00 PM - 5:30 PM",
    "6:00 PM - 6:30 PM",
    "7:00 PM - 7:30 PM",
    "8:00 PM - 8:30 PM",
  ];

  const renderCalendar = () => {
    return (
      <div className="border rounded-lg mt-4 overflow-hidden">
        <div className="grid grid-cols-8 relative">
          {/* Time column */}
          <div className="border-r relative">
            <div className="h-12 border-b flex items-center justify-center font-semibold">
              Time
            </div>
            {TIME_SLOTS.map((time, index) => (
              <div
                key={index}
                className={cn(
                  "h-[60px] px-2 text-xs flex items-center justify-center text-muted-foreground",
                  index !== 0 && "border-t"
                )}
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day) => {
            const daySchedules = schedules.filter((schedule) =>
              schedule.days.map(d => d.toLowerCase()).includes(day.toLowerCase())
            );

            return (
              <div key={day} className="relative border-r min-h-full">
                {/* Day header */}
                <div className="h-12 border-b flex items-center justify-center font-semibold">
                  {day}
                </div>

                {/* Time slot gridlines */}
                {TIME_SLOTS.map((_, index) => (
                  <div
                    key={index}
                    className={cn("h-[60px]", index !== 0 && "border-t")}
                  />
                ))}

                {/* Schedule items */}
                {daySchedules.map((schedule) => (
                  <div
                    key={`${day}-${schedule.id}`}
                    style={getSchedulePosition(schedule)}
                    className={cn(
                      "absolute left-0 right-0 mx-1 p-1 rounded border",
                      "bg-secondary hover:bg-secondary/80",
                      "text-sm overflow-hidden flex flex-col justify-center"
                    )}
                  >
                    <div className="space-y-0.5 flex justify-center items-center">
                      {/* subject code */}
                      <div className="text-lg font-semibold truncate text-center">
                        {schedule.subjectCode}
                      </div>
                    </div>
                    {/* section name */}
                    <div className="truncate text-md text-center">
                      {schedule.sectionName}
                      {/* start and end time */}
                      <div className="flex items-center justify-center gap-1 text-[12px] text-muted-foreground/90">
                        <Clock className="h-3 w-3" />
                        <span>
                          {schedule.startTime} - {schedule.endTime}
                          <span className="ml-1">
                            ({calculateTotalHours(schedule.startTime, schedule.endTime)} hours)
                          </span>
                        </span>
                      </div>
                      {/* instructor/teacher name */}
                      <div className="truncate text-md text-muted-foreground text-center">
                        {schedule.instructorName}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {daySchedules.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center mt-12">
                    <span className="text-xs text-muted-foreground">
                      No classes
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getSchedulePosition = (schedule) => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      const minute = parseInt(minutes.split(' ')[0]);
      const period = time.includes('PM');

      if (period && hour !== 12) hour += 12;
      if (!period && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);

    const startOfDay = timeToMinutes('7:00 AM'); // First time slot
    const top = ((startMinutes - startOfDay) / 30) * 30; // 30px per 30 minutes
    const height = ((endMinutes - startMinutes) / 30) * 30;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`, // Minimum height of 30px
    };
  };

  const calculateTotalHours = (startTime, endTime) => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      const minute = parseInt(minutes.split(' ')[0]);
      const period = time.includes('PM');

      if (period && hour !== 12) hour += 12;
      if (!period && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const diffMinutes = endMinutes - startMinutes;
    const hours = (diffMinutes / 60).toFixed(1);

    return hours.endsWith('.0') ? hours.slice(0, -2) : hours;
  };

  // use callBack - implement later
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

  // fetch room schedules
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
                // const days = {
                //   monday: scheduleData.monday || "false",
                //   tuesday: scheduleData.tuesday || "false",
                //   wednesday: scheduleData.wednesday || "false",
                //   thursday: scheduleData.thursday || "false",
                //   friday: scheduleData.friday || "false",
                //   saturday: scheduleData.saturday || "false",
                //   sunday: scheduleData.sunday || "false",
                // };

                // Add to schedules array with all necessary information
                allSchedules.push({
                  id: scheduleDoc.id,
                  ...scheduleData,
                  days: scheduleData.days || [], // days is now an array of strings
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

  // get days array from schedule
  const getDays = (days) => {
    if (!Array.isArray(days) || days.length === 0) return ["N/A"];
    return days.map(day =>
      day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
    );
  };;

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
        <DialogContent className="sm:max-w-4xl">
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
      <DialogContent className="sm:max-w-[85vw] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
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

        <div className="mt-4 flex-1">
          {loading ? (
            // Loading skeletons
            <div className="space-y-4">
              {Array(3).fill(0).map((_, index) => (
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
            // Calendar View
            <ScrollArea className="h-[60vh]">
              {renderCalendar()}
            </ScrollArea>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <DialogClose asChild>
            <Button className="cursor-pointer">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
