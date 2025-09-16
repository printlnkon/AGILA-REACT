import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { db } from "@/api/firebase";
import {
  collection,
  collectionGroup,
  query,
  where,
  getDoc,
  getDocs,
} from "firebase/firestore";
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

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const TIME_SLOTS = [
    "7:00 AM - 7:30 AM",
    "7:30 AM - 8:00 AM",
    "8:00 AM - 8:30 AM",
    "8:30 AM - 9:00 AM",
    "9:00 AM - 9:30 AM",
    "9:30 AM - 10:00 AM",
    "10:00 AM - 10:30 AM",
    "10:30 AM - 11:00 AM",
    "11:00 AM - 11:30 AM",
    "11:30 AM - 12:00 PM",
    "12:00 PM - 12:30 PM",
    "12:30 PM - 1:00 PM",
    "1:00 PM - 1:30 PM",
    "1:30 PM - 2:00 PM",
    "2:00 PM - 2:30 PM",
    "2:30 PM - 3:00 PM",
    "3:00 PM - 3:30 PM",
    "3:30 PM - 4:00 PM",
    "4:00 PM - 4:30 PM",
    "4:30 PM - 5:00 PM",
    "5:00 PM - 5:30 PM",
    "5:30 PM - 6:00 PM",
    "6:00 PM - 6:30 PM",
    "6:30 PM - 7:00 PM",
    "7:00 PM - 7:30 PM",
    "7:30 PM - 8:00 PM",
    "8:00 PM - 8:30 PM",
  ];

  const renderCalendar = () => {
    return (
      <div className="border rounded-lg mt-4 overflow-hidden">
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r">
            <div className="h-12 border-b flex items-center justify-center font-semibold">
              Time
            </div>
            {TIME_SLOTS.map((time, index) => (
              <div
                key={index}
                className={cn(
                  "h-[90px] px-2 text-xs flex items-center justify-center text-muted-foreground",
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
              schedule.days
                .map((d) => d.toLowerCase())
                .includes(day.toLowerCase())
            );

            return (
              <div key={day} className="border-r min-h-full">
                {/* Day header */}
                <div className="h-12 border-b flex items-center justify-center font-semibold">
                  {day}
                </div>

                <div className="relative">
                  {/* Time slot gridlines */}
                  {TIME_SLOTS.map((_, index) => (
                    <div
                      key={index}
                      className={cn("h-[90px]", index !== 0 && "border-t")}
                    />
                  ))}

                  {/* Schedule items */}
                  {daySchedules.map((schedule) => {
                    const { top, height } = getSchedulePosition(schedule);
                    const totalHours = calculateTotalHours(
                      schedule.startTime,
                      schedule.endTime
                    );
                    const { bg, hoverBg, text } =
                      getScheduleColorClasses(schedule);

                    return (
                      <div
                        key={`${day}-${schedule.id}`}
                        className={`absolute w-full px-2 py-1 rounded-md overflow-hidden text-center
                      transition-colors cursor-pointer flex flex-col justify-center
                      ${bg} ${hoverBg} ${text}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          zIndex: 1,
                        }}
                      >
                        {/* section name with schedule type */}
                        <div className="text-xs font-medium opacity-80 mb-0.5 truncate">
                          {schedule.sectionName || "Section"} •{" "}
                          {getScheduleTypeName(schedule)}
                        </div>

                        {/* subject code with subject name */}
                        <div className="font-semibold text-xs leading-tight truncate">
                          {schedule.subjectCode} - {schedule.subjectName}
                        </div>

                        {/* room information */}
                        <div className="text-xs mt-0.5 truncate">
                          {schedule.roomName || room?.roomNo}
                        </div>

                        {/* time information and total hours */}
                        {height >= 75 && (
                          <div className="flex justify-center items-center gap-1 mt-1 text-xs">
                            <Clock className="h-2.5 w-2.5" />
                            <span className="truncate">{totalHours}</span>
                          </div>
                        )}

                        {/* instructor name - only show if we have enough space */}
                        <div className="truncate text-xs italic">
                          {schedule.instructorName}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  {daySchedules.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        No classes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // function to determine schedule type name
  const getScheduleTypeName = (schedule) => {
    if (
      schedule.isLabComponent === true ||
      schedule.scheduleType === "LABORATORY" ||
      schedule.scheduleType?.toLowerCase() === "laboratory" ||
      schedule.roomType === "laboratory"
    ) {
      return "Laboratory";
    }
    return "Lecture";
  };

  // function to get schedule color classes
  const getScheduleColorClasses = (schedule) => {
    // default colors if no color is specified
    const defaultBg = "bg-secondary";
    const defaultHoverBg = "hover:bg-secondary/80";
    const defaultText = "";

    // return early with defaults if no color specified
    if (!schedule.color)
      return { bg: defaultBg, hoverBg: defaultHoverBg, text: defaultText };

    // map of color values to tailwind classes
    const colorMap = {
      blue: {
        bg: "bg-blue-500",
        hoverBg: "hover:bg-blue-600",
        text: "text-white",
      },
      green: {
        bg: "bg-green-500",
        hoverBg: "hover:bg-green-600",
        text: "text-white",
      },
      red: {
        bg: "bg-red-500",
        hoverBg: "hover:bg-red-600",
        text: "text-white",
      },
      purple: {
        bg: "bg-purple-500",
        hoverBg: "hover:bg-purple-600",
        text: "text-white",
      },
      orange: {
        bg: "bg-orange-500",
        hoverBg: "hover:bg-orange-600",
        text: "text-white",
      },
      pink: {
        bg: "bg-pink-500",
        hoverBg: "hover:bg-pink-600",
        text: "text-white",
      },
      cyan: {
        bg: "bg-cyan-500",
        hoverBg: "hover:bg-cyan-600",
        text: "text-white",
      },
      amber: {
        bg: "bg-amber-500",
        hoverBg: "hover:bg-amber-600",
        text: "text-white",
      },
      lime: {
        bg: "bg-lime-500",
        hoverBg: "hover:bg-lime-600",
        text: "text-white",
      },
      teal: {
        bg: "bg-teal-500",
        hoverBg: "hover:bg-teal-600",
        text: "text-white",
      },
    };

    return (
      colorMap[schedule.color] || {
        bg: defaultBg,
        hoverBg: defaultHoverBg,
        text: defaultText,
      }
    );
  };

  const getSchedulePosition = (schedule) => {
    // Each time slot row in the grid is 90px tall
    const slotHeight = 90;

    // Find the index of the time slot where the schedule begins.
    const startIndex = TIME_SLOTS.findIndex(
      (slot) => slot.split(" - ")[0].trim() === schedule.startTime
    );

    // Find the index of the last slot occupied by the schedule by its end time.
    const lastSlotIndex = TIME_SLOTS.findIndex(
      (slot) => slot.split(" - ")[1].trim() === schedule.endTime
    );

    // If the schedule's start time doesn't align with a slot, hide it.
    if (startIndex === -1) {
      console.warn("Schedule start time does not align with grid:", schedule);
      return { top: 0, height: 0 };
    }

    // The end index for calculation is one after the last occupied slot.
    // If not found, default to a single-slot duration.
    const endIndex = lastSlotIndex !== -1 ? lastSlotIndex + 1 : startIndex + 1;

    return {
      top: startIndex * slotHeight,
      height: Math.max((endIndex - startIndex) * slotHeight, slotHeight),
    };
  };

  const calculateTotalHours = (startTime, endTime) => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(":");
      let hour = parseInt(hours);
      const minute = parseInt(minutes.split(" ")[0]);
      const period = time.includes("PM");

      if (period && hour !== 12) hour += 12;
      if (!period && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const diffMinutes = endMinutes - startMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60; // Calculate remaining minutes

    return (
      hours +
      (hours > 1 ? " hrs" : " hr") +
      (minutes > 0 ? ` ${minutes} min` : "")
    );
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
      if (!activeSession?.id || !activeSession?.semesterId || !room?.id) {
        console.error("Missing required data for fetching schedules");
        return;
      }

      // Simply query by roomId and filter results in memory
      const schedulesQuery = query(
        collectionGroup(db, "schedules"),
        where("roomId", "==", room.id)
      );

      const schedulesSnapshot = await getDocs(schedulesQuery);

      // Process all schedules in parallel
      const allSchedulesPromises = schedulesSnapshot.docs.map(
        async (scheduleDoc) => {
          const scheduleData = scheduleDoc.data();
          const sectionPath = scheduleDoc.ref.parent.parent.path;

          // Extract section ID from path
          const pathParts = sectionPath.split("/");
          const sectionId = pathParts[pathParts.length - 2];

          // Get section data
          const sectionRef = scheduleDoc.ref.parent.parent;
          const sectionDoc = await getDoc(sectionRef);
          const sectionName =
            sectionDoc.data()?.sectionName || `Section ${sectionId}`;

          // Get year level data
          const yearLevelRef = sectionRef.parent.parent;
          const yearLevelDoc = await getDoc(yearLevelRef);
          const yearLevelName =
            yearLevelDoc.data()?.yearLevelName || "Unknown Year";

          // Get course data
          const courseRef = yearLevelRef.parent.parent;
          const courseDoc = await getDoc(courseRef);
          const courseName = courseDoc.data()?.courseName || "Unknown Course";

          return {
            id: scheduleDoc.id,
            ...scheduleData,
            days: scheduleData.days || [],
            subjectName: scheduleData.subjectName || "Unknown Subject",
            subjectCode: scheduleData.subjectCode || "",
            sectionName: sectionName,
            courseName: courseName,
            yearLevelName: yearLevelName,
            departmentName: scheduleData.departmentName || "Unknown Department",
            instructorName: scheduleData.instructorName || "Unassigned",
          };
        }
      );

      const allSchedules = await Promise.all(allSchedulesPromises);

      setSchedules(allSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
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
              No active academic session found.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Active Session</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There is currently no active academic year or semester.
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

        {/* loading skeleton */}
        <div className="mt-4 flex-1">
          {loading ? (
            <div className="border rounded-lg mt-4 overflow-hidden">
              <div className="grid grid-cols-8 relative">
                {/* Time column skeleton */}
                <div className="border-r relative">
                  <div className="h-12 border-b flex items-center justify-center">
                    <Skeleton className="h-5 w-25" />
                  </div>
                  {Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-[60px] px-2 flex items-center gap-4 justify-center",
                          index !== 0 && "border-t"
                        )}
                      >
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    ))}
                </div>

                {/* Day columns skeleton */}
                {Array(7)
                  .fill(0)
                  .map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="relative border-r min-h-full"
                    >
                      {/* Day header skeleton */}
                      <div className="h-12 border-b flex items-center justify-center">
                        <Skeleton className="h-5 w-25" />
                      </div>

                      {/* Time slot gridlines */}
                      {Array(8)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className={cn(
                              "h-[60px]",
                              index !== 0 && "border-t"
                            )}
                          ></div>
                        ))}
                    </div>
                  ))}
              </div>
            </div>
          ) : schedules.length === 0 ? (
            // Empty state
            <div className="text-center">
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
            <ScrollArea className="h-[60vh]">{renderCalendar()}</ScrollArea>
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
