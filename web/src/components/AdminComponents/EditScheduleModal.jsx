import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  Building,
  User,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validation schema for schedule form
const scheduleFormSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  instructorName: z.string().min(1, "Instructor name is required"),
  roomName: z.string().min(1, "Room name is required"),
  startHour: z.string().min(1, "Start hour is required"),
  startMinute: z.string().min(1, "Start minute is required"),
  startPeriod: z.string().min(1, "Start period is required"),
  endHour: z.string().min(1, "End hour is required"),
  endMinute: z.string().min(1, "End minute is required"),
  endPeriod: z.string().min(1, "End period is required"),
  days: z.array(z.string()).min(1, "At least one day must be selected"),
  color: z.string(),
  scheduleType: z.string(),
});

const days = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", bg: "bg-blue-500", text: "text-white" },
  { value: "green", label: "Green", bg: "bg-green-500", text: "text-white" },
  { value: "red", label: "Red", bg: "bg-red-500", text: "text-white" },
  { value: "purple", label: "Purple", bg: "bg-purple-500", text: "text-white" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", text: "text-white" },
  { value: "pink", label: "Pink", bg: "bg-pink-500", text: "text-white" },
  { value: "cyan", label: "Cyan", bg: "bg-cyan-500", text: "text-white" },
  { value: "amber", label: "Amber", bg: "bg-amber-500", text: "text-white" },
  { value: "lime", label: "Lime", bg: "bg-lime-500", text: "text-white" },
  { value: "teal", label: "Teal", bg: "bg-teal-500", text: "text-white" },
];

const START_HOUR_OPTIONS = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
const END_HOUR_OPTIONS = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)];
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);

const conflictDetails = {
  room: {
    Icon: Building,
    title: "Room Conflicts",
    className: "text-blue-600",
  },
  instructor: {
    Icon: User,
    title: "Instructor Conflicts",
    className: "text-purple-600",
  },
  section: {
    Icon: Users,
    title: "Section Schedule Conflicts",
    className: "text-amber-700",
  },
};

// Validate time range before submitting
const validateTimeRange = (
  startHour,
  startMinute,
  startPeriod,
  endHour,
  endMinute,
  endPeriod
) => {

  if (endPeriod === "AM") {
    const hourNum = parseInt(endHour);
    if (hourNum === 12 || (hourNum >= 1 && hourNum <= 6)) {
      return "End time cannot be between 12:00 AM - 6:59 AM";
    }
  }

  // Convert to 24-hour format for comparison
  let start24Hour = parseInt(startHour);
  if (startPeriod === "PM" && start24Hour !== 12) start24Hour += 12;
  if (startPeriod === "AM" && start24Hour === 12) start24Hour = 0;

  let end24Hour = parseInt(endHour);
  if (endPeriod === "PM" && end24Hour !== 12) end24Hour += 12;
  if (endPeriod === "AM" && end24Hour === 12) end24Hour = 0;

  // Compare times
  if (end24Hour < start24Hour) {
    return "End time must be after start time";
  }
  if (
    end24Hour === start24Hour &&
    parseInt(endMinute) <= parseInt(startMinute)
  ) {
    return "End time must be after start time";
  }

  // Calculate duration in minutes
  const startMinutes = start24Hour * 60 + parseInt(startMinute);
  const endMinutes = end24Hour * 60 + parseInt(endMinute);
  const duration = endMinutes - startMinutes;

  // Check minimum duration (30 minutes)
  if (duration < 30) {
    return "Schedule duration must be at least 30 minutes";
  }

  // Check maximum duration (3 hours = 180 minutes)
  if (duration > 180) {
    return "Schedule duration cannot exceed 3 hours";
  }

  return null;
};

// Convert time string to 24-hour format for comparison
const convertTimeToMinutes = (timeString) => {
  const [timePart, period] = timeString.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

export default function EditScheduleModal({
  open,
  onClose,
  schedule,
  onEditSchedule,
  activeSession,
  selectedDepartment,
  selectedCourse,
  selectedYearLevel,
  existingSchedules,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Initialize form for editing schedules
  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subjectName: "",
      instructorName: "",
      roomName: "",
      startHour: "",
      startMinute: "",
      startPeriod: "AM",
      endHour: "",
      endMinute: "",
      endPeriod: "AM",
      days: [],
      color: "blue",
      scheduleType: "lecture",
    },
  });

  // Fetch data when edit modal opens
  useEffect(() => {
    if (open) {
      fetchSubjects();
      fetchInstructors();
      fetchRooms();
    }
  }, [open, selectedDepartment, selectedCourse, selectedYearLevel]);

  // Fetch subjects for the current department and course
  const fetchSubjects = async () => {
    setLoadingOptions(true);
    try {
      const subjectsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/year_levels/${selectedYearLevel}/subjects`;

      const subjectsSnapshot = await getDocs(collection(db, subjectsPath));

      if (subjectsSnapshot.empty) {
        setSubjects([]);
        toast.warning("No subjects found for this course.");
        return;
      }

      const subjectsList = subjectsSnapshot.docs.map((doc) => {
        const subjectData = doc.data();
        return {
          id: doc.id,
          subjectCode: subjectData.subjectCode || "",
          subjectName: subjectData.subjectName || "",
          code: subjectData.subjectCode || "",
          name: subjectData.subjectName || "",
          units: subjectData.units || 0,
          description: subjectData.description || "",
          ...subjectData,
        };
      });
      setSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
      setSubjects([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch instructors for the current department
  const fetchInstructors = async () => {
    setLoadingOptions(true);
    try {
      const teachersRef = collection(db, `users/teacher/accounts`);
      const teachersSnapshot = await getDocs(teachersRef);

      if (teachersSnapshot.empty) {
        setInstructors([]);
        toast.warning("No instructors found in the system.");
        return;
      }

      // Process all teachers and filter based on department
      const instructorsData = teachersSnapshot.docs
        .map((doc) => {
          const teacherData = doc.data();
          return {
            id: doc.id,
            name: teacherData.firstName + " " + teacherData.lastName,
            department: teacherData.department || "",
            departmentName: teacherData.departmentName || "",
            course: teacherData.course || "",
            courseName: teacherData.courseName || "",
            yearLevel: teacherData.yearLevel || "",
            yearLevelName: teacherData.yearLevelName || "",
            section: teacherData.section || "",
            sectionName: teacherData.sectionName || "",
            email: teacherData.email || "",
          };
        })
        // Filter teachers to only include those from the current department
        .filter((teacher) => teacher.department === selectedDepartment)
        .sort((a, b) => a.name.localeCompare(b.name));

      setInstructors(instructorsData);

      if (instructorsData.length === 0) {
        toast.warning("No instructors found for this department.");
      }
    } catch (error) {
      console.error("Error fetching instructors from Firestore:", error);
      toast.error("Failed to fetch instructors");
      setInstructors([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch rooms for the current department and course
  const fetchRooms = async () => {
    setLoadingOptions(true);
    try {
      const roomsRef = collection(db, "rooms");
      const roomsSnapshot = await getDocs(roomsRef);

      if (roomsSnapshot.empty) {
        setRooms([]);
        toast.warning("No rooms found.");
        return;
      }

      const roomsList = roomsSnapshot.docs.map((doc) => {
        const roomData = doc.data();
        return {
          id: doc.id,
          name: roomData.roomNo || roomData.name,
          roomNo: roomData.roomNo || roomData.name,
          floor: roomData.floor,
          status: roomData.status || "available",
          roomType: roomData.roomType || "lecture",
        };
      });

      setRooms(roomsList);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load rooms");
      setRooms([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Set form values when schedule data is loaded
  useEffect(() => {
    if (
      open &&
      schedule &&
      subjects.length > 0 &&
      rooms.length > 0 &&
      instructors.length > 0
    ) {
      // Find the subject, room and instructor objects that match the selected schedule
      const selectedSubject = subjects.find(
        (subject) =>
          subject.id === schedule.subjectId ||
          subject.name === schedule.subjectName
      );

      const selectedRoom = rooms.find(
        (room) => room.id === schedule.roomId || room.name === schedule.roomName
      );

      const selectedInstructor = instructors.find(
        (instructor) =>
          instructor.id === schedule.instructorId ||
          instructor.name === schedule.instructorName
      );

      // Parse start time
      const startTimeParts = schedule.startTime.split(" ");
      const [startHour, startMinute] = startTimeParts[0].split(":");
      const startPeriod = startTimeParts[1];

      // Parse end time
      const endTimeParts = schedule.endTime.split(" ");
      const [endHour, endMinute] = endTimeParts[0].split(":");
      const endPeriod = endTimeParts[1];

      // Reset the form with all the data
      form.reset({
        subjectId: selectedSubject?.id || schedule.subjectId,
        subjectName: selectedSubject
          ? selectedSubject.name
          : schedule.subjectName,
        instructorId: selectedInstructor?.id || schedule.instructorId,
        instructorName: selectedInstructor
          ? selectedInstructor.name
          : schedule.instructorName,
        roomId: selectedRoom?.id || schedule.roomId,
        roomName: selectedRoom ? selectedRoom.name : schedule.roomName,
        days: schedule.days || [],
        startHour: startHour,
        startMinute: startMinute,
        startPeriod: startPeriod,
        endHour: endHour,
        endMinute: endMinute,
        endPeriod: endPeriod,
        color: schedule.color || "blue",
        scheduleType:
          schedule.isLabComponent === true ||
          schedule.scheduleType === "LABORATORY" ||
          schedule.roomType === "laboratory"
            ? "laboratory"
            : "lecture",
      });
    }
  }, [open, schedule, subjects, rooms, instructors]);

  // reset conflicts when modal closes
  useEffect(() => {
    // When the modal closes, reset conflicts
    if (!open) {
      setConflicts([]);
      setShowConflictDialog(false);
    }
  }, [open]);

  // function to allow instructors to teach multiple subjects at different times on the same day
  const checkForConflicts = (updatedSchedule) => {
    if (!existingSchedules || existingSchedules.length === 0) {
      return [];
    }

    // Calculate start and end times in minutes for the edited schedule
    const editStartMinutes = convertTimeToMinutes(updatedSchedule.startTime);
    const editEndMinutes = convertTimeToMinutes(updatedSchedule.endTime);

    // Days of the edited schedule
    const editDays = updatedSchedule.days;

    const detectedConflicts = [];

    // Check against existing schedules (excluding the one being edited)
    existingSchedules.forEach((existingSchedule) => {
      // Skip if it's the same schedule being edited
      if (existingSchedule.id === schedule.id) return;

      // Check if there's any overlap in days
      const hasOverlappingDays = existingSchedule.days.some((day) =>
        editDays.includes(day)
      );
      if (!hasOverlappingDays) return;

      // Calculate start and end times in minutes for existing schedule
      const existingStartMinutes = convertTimeToMinutes(
        existingSchedule.startTime
      );
      const existingEndMinutes = convertTimeToMinutes(existingSchedule.endTime);

      // Check for time overlap - only when time ranges actually overlap
      const hasTimeOverlap =
        (editStartMinutes >= existingStartMinutes &&
          editStartMinutes < existingEndMinutes) || // Edit start time within existing
        (editEndMinutes > existingStartMinutes &&
          editEndMinutes <= existingEndMinutes) || // Edit end time within existing
        (editStartMinutes <= existingStartMinutes &&
          editEndMinutes >= existingEndMinutes); // Edit spans entire existing

      // Only consider conflicts when there's both day AND time overlap
      if (hasTimeOverlap) {
        // Check for room conflict
        if (updatedSchedule.roomName === existingSchedule.roomName) {
          detectedConflicts.push({
            id: `${existingSchedule.id}-room`,
            subject: existingSchedule.subjectName,
            type: "room",
            conflict: `${existingSchedule.roomName} is already booked for ${
              existingSchedule.subjectCode || existingSchedule.subjectName
            } (${existingSchedule.startTime} - ${existingSchedule.endTime})`,
          });
        }

        // Check for instructor conflict - only if time AND day overlap
        if (
          updatedSchedule.instructorName === existingSchedule.instructorName
        ) {
          detectedConflicts.push({
            id: `${existingSchedule.id}-instructor`,
            subject: existingSchedule.subjectName,
            type: "instructor",
            conflict: `Instructor ${
              existingSchedule.instructorName
            } is already teaching ${
              existingSchedule.subjectCode || existingSchedule.subjectName
            } (${existingSchedule.startTime} - ${existingSchedule.endTime})`,
          });
        }

        // Student schedule conflict (same section)
        detectedConflicts.push({
          id: `${existingSchedule.id}-section`,
          subject: existingSchedule.subjectName,
          type: "section",
          conflict: `This section already has ${
            existingSchedule.subjectCode || existingSchedule.subjectName
          } scheduled at this time`,
        });
      }
    });

    // Remove any duplicate conflicts
    const uniqueConflicts = Array.from(
      new Map(
        detectedConflicts.map((conflict) => [conflict.id, conflict])
      ).values()
    );

    return uniqueConflicts;
  };

  // Handle form submission for editing schedules
  const handleEditSubmit = async (data) => {
    if (schedule) {
      setIsSubmitting(true);
      try {
        // Format the times from the separate hour, minute, period fields
        const startTime = `${data.startHour}:${data.startMinute} ${data.startPeriod}`;
        const endTime = `${data.endHour}:${data.endMinute} ${data.endPeriod}`;

        // Find the selected subject to get its ID
        const selectedSubject = subjects.find(
          (subject) => subject.name === data.subjectName
        );

        // Find the selected room to get its ID
        const selectedRoom = rooms.find((room) => room.name === data.roomName);

        // Find the selected instructor to get its ID
        const selectedInstructor = instructors.find(
          (instructor) => instructor.name === data.instructorName
        );

        // Create updated schedule with original id and form data
        const updatedSchedule = {
          ...schedule,
          subjectName: data.subjectName,
          subjectId: selectedSubject?.id || schedule.subjectId,
          subjectCode:
            selectedSubject?.code ||
            selectedSubject?.subjectCode ||
            schedule.subjectCode,
          roomName: data.roomName,
          roomId: selectedRoom?.id || schedule.roomId,
          instructorId: selectedInstructor?.id || schedule.instructorId,
          instructorName: data.instructorName,
          startTime,
          endTime,
          days: data.days,
          color: data.color || "blue",
          scheduleType: data.scheduleType || "lecture",
          isLabComponent: data.scheduleType === "laboratory",
        };

        // Validate time range
        const timeError = validateTimeRange(
          data.startHour,
          data.startMinute,
          data.startPeriod,
          data.endHour,
          data.endMinute,
          data.endPeriod
        );

        if (timeError) {
          toast.error(timeError);
          form.setError("timeRange", { message: timeError });
          setIsSubmitting(false);
          return;
        }

        // Check if conflicts already exist from the real-time check
        if (conflicts.length > 0) {
          setShowConflictDialog(true);
          setIsSubmitting(false);
          return;
        }

        // If no conflicts, proceed with update
        await handleConfirmedUpdate(updatedSchedule);
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Failed to update schedule");
        setIsSubmitting(false);
      }
    }
  };

  const handleConfirmedConflictSubmit = () => {
    // Get the current form values
    const data = form.getValues();

    // Format the times
    const startTime = `${data.startHour}:${data.startMinute} ${data.startPeriod}`;
    const endTime = `${data.endHour}:${data.endMinute} ${data.endPeriod}`;

    // Find the selected items
    const selectedSubject = subjects.find(
      (subject) => subject.name === data.subjectName
    );
    const selectedRoom = rooms.find((room) => room.name === data.roomName);
    const selectedInstructor = instructors.find(
      (instructor) => instructor.name === data.instructorName
    );

    // Create updated schedule
    const updatedSchedule = {
      ...schedule,
      subjectName: data.subjectName,
      subjectId: selectedSubject?.id || schedule.subjectId,
      subjectCode:
        selectedSubject?.code ||
        selectedSubject?.subjectCode ||
        schedule.subjectCode,
      roomName: data.roomName,
      roomId: selectedRoom?.id || schedule.roomId,
      instructorId: selectedInstructor?.id || schedule.instructorId,
      instructorName: data.instructorName,
      startTime,
      endTime,
      days: data.days,
      color: data.color || "blue",
      scheduleType: data.scheduleType || "lecture",
      isLabComponent: data.scheduleType === "laboratory",
    };

    handleConfirmedUpdate(updatedSchedule);
  };

  // Handle confirmed update after conflict check
  const handleConfirmedUpdate = async (updatedSchedule) => {
    try {
      // Call parent component's edit handler
      await onEditSchedule(updatedSchedule);

      // Show success message
      toast.success("Schedule has been updated");

      // Close the edit modal
      onClose();
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    } finally {
      setIsSubmitting(false);
      setShowConflictDialog(false);
    }
  };

  // Watch individual fields to create stable dependencies for the useEffect hook.
  const watchedDays = form.watch("days");
  const watchedStartHour = form.watch("startHour");
  const watchedStartMinute = form.watch("startMinute");
  const watchedStartPeriod = form.watch("startPeriod");
  const watchedEndHour = form.watch("endHour");
  const watchedEndMinute = form.watch("endMinute");
  const watchedEndPeriod = form.watch("endPeriod");
  const watchedRoomName = form.watch("roomName");
  const watchedInstructorName = form.watch("instructorName");

  // useEffect for real-time conflict checking when days or time change.
  useEffect(() => {
    // Only run if a schedule is loaded and the necessary fields are populated.
    if (
      schedule &&
      watchedDays?.length > 0 &&
      watchedStartHour &&
      watchedStartMinute &&
      watchedStartPeriod &&
      watchedEndHour &&
      watchedEndMinute &&
      watchedEndPeriod &&
      watchedRoomName &&
      watchedInstructorName
    ) {
      const startTime = `${watchedStartHour}:${watchedStartMinute} ${watchedStartPeriod}`;
      const endTime = `${watchedEndHour}:${watchedEndMinute} ${watchedEndPeriod}`;

      // Construct a temporary updated schedule object for checking.
      const tempUpdatedSchedule = {
        ...schedule,
        roomName: watchedRoomName,
        instructorName: watchedInstructorName,
        startTime,
        endTime,
        days: watchedDays,
      };

      const detectedConflicts = checkForConflicts(tempUpdatedSchedule);
      setConflicts(detectedConflicts);
    }
  }, [
    watchedDays,
    watchedStartHour,
    watchedStartMinute,
    watchedStartPeriod,
    watchedEndHour,
    watchedEndMinute,
    watchedEndPeriod,
    watchedRoomName,
    watchedInstructorName,
    schedule,
    existingSchedules,
  ]);
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setConflicts([]);
          setShowConflictDialog(false);
          form.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Class Schedule</DialogTitle>
          <DialogDescription>
            Update the schedule information for this class. All fields marked
            with <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleEditSubmit)}
          className="space-y-4"
        >
          {/* Schedule Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Room Type <span className="text-destructive">*</span>
              </label>
              {form.formState.errors.scheduleType && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.scheduleType.message}
                </p>
              )}
            </div>
            <Controller
              control={form.control}
              name="scheduleType"
              render={({ field }) => (
                <Select
                  value={
                    field.value ||
                    (schedule?.isLabComponent === true ||
                    schedule?.scheduleType === "LABORATORY" ||
                    schedule?.roomType === "laboratory"
                      ? "laboratory"
                      : "lecture")
                  }
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Schedule Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="laboratory">Laboratory</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            {/* Subject field */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Subject <span className="text-destructive">*</span>
              </label>
              {form.formState.errors.subjectName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.subjectName.message}
                </p>
              )}
            </div>
            <Controller
              control={form.control}
              name="subjectName"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <SelectItem
                          key={`subject-${subject.id || "unknown"}`}
                          value={
                            subject.name || `Subject ${subject.id || "unknown"}`
                          }
                        >
                          {subject.code
                            ? `${subject.code} - ${
                                subject.name || "Unknown Subject"
                              }`
                            : subject.name || "Unknown Subject"}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">
                        No subjects available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              {/* Start Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Start Time <span className="text-destructive">*</span>
                  </label>
                  {form.formState.errors.startTime && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.startTime.message}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Current Time:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <Controller
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <>
                        <Select
                          value={form.watch("startHour") || ""}
                          onValueChange={(value) => {
                            form.setValue("startHour", value);
                            // Restrict minutes if 8 PM is selected
                            if (
                              value === "8" &&
                              form.watch("startPeriod") === "PM" &&
                              form.watch("startMinute") > "30"
                            ) {
                              form.setValue("startMinute", "30");
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Hr" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {START_HOUR_OPTIONS.map((hour) => (
                              <SelectItem
                                key={`start-hr-${hour}`}
                                value={hour.toString()}
                                disabled={
                                  (form.watch("startPeriod") === "AM" &&
                                    hour < 7 &&
                                    hour !== 12) ||
                                  (form.watch("startPeriod") === "PM" &&
                                    hour > 8 &&
                                    hour < 12)
                                }
                              >
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                          value={form.watch("startMinute") || ""}
                          onValueChange={(value) => {
                            if (
                              !(
                                form.watch("startPeriod") === "PM" &&
                                form.watch("startHour") === "8" &&
                                value > "30"
                              )
                            ) {
                              form.setValue("startMinute", value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {MINUTE_OPTIONS.map((minute) => (
                              <SelectItem
                                key={`start-min-${minute}`}
                                value={minute}
                                disabled={
                                  form.watch("startPeriod") === "PM" &&
                                  form.watch("startHour") === "8" &&
                                  minute > "30"
                                }
                              >
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={form.watch("startPeriod") || "AM"}
                          onValueChange={(value) => {
                            form.setValue("startPeriod", value);
                            // Adjust hour and minute when switching to PM
                            if (value === "PM") {
                              const hourNum = parseInt(form.watch("startHour"));
                              if (hourNum > 8 && hourNum !== 12) {
                                form.setValue("startHour", "8");
                                if (form.watch("startMinute") > "30") {
                                  form.setValue("startMinute", "30");
                                }
                              } else if (
                                hourNum === 8 &&
                                form.watch("startMinute") > "30"
                              ) {
                                form.setValue("startMinute", "30");
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    End Time <span className="text-destructive">*</span>
                  </label>
                  {form.formState.errors.endTime && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.endTime.message}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Current Time:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <Controller
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <>
                        <Select
                          value={form.watch("endHour") || ""}
                          onValueChange={(value) => {
                            form.setValue("endHour", value);
                            // Restrict minutes if 8 PM is selected
                            if (
                              value === "8" &&
                              form.watch("endPeriod") === "PM" &&
                              form.watch("endMinute") > "30"
                            ) {
                              form.setValue("endMinute", "30");
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Hr" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {END_HOUR_OPTIONS.map((hour) => (
                              <SelectItem
                                key={`end-hr-${hour}`}
                                value={hour.toString()}
                                disabled={
                                  (form.watch("endPeriod") === "PM" && hour > 8 && hour < 12) || 
                                  (form.watch("endPeriod") === "AM" && (hour === 12 || (hour >= 1 && hour <= 6)))
                                }
                              >
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                          value={form.watch("endMinute") || ""}
                          onValueChange={(value) => {
                            if (
                              !(
                                form.watch("endPeriod") === "PM" &&
                                form.watch("endHour") === "8" &&
                                value > "30"
                              )
                            ) {
                              form.setValue("endMinute", value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {MINUTE_OPTIONS.map((minute) => (
                              <SelectItem
                                key={`end-min-${minute}`}
                                value={minute}
                                disabled={
                                  form.watch("endPeriod") === "PM" &&
                                  form.watch("endHour") === "8" &&
                                  minute > "30"
                                }
                              >
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={form.watch("endPeriod") || "AM"}
                          onValueChange={(value) => {
                            form.setValue("endPeriod", value);

                            if (value === "AM") {
                              const hourNum = parseInt(form.watch("endHour"));
                              if (
                                hourNum === 12 ||
                                (hourNum >= 1 && hourNum <= 6)
                              ) {
                                form.setValue("endHour", "7"); // Reset to 7 AM as the earliest allowed end time
                              }
                            }
                            // Adjust hour and minute when switching to PM
                            if (value === "PM") {
                              const hourNum = parseInt(form.watch("endHour"));
                              if (hourNum > 8 && hourNum !== 12) {
                                form.setValue("endHour", "8");
                                if (form.watch("endMinute") > "30") {
                                  form.setValue("endMinute", "30");
                                }
                              } else if (
                                hourNum === 8 &&
                                form.watch("endMinute") > "30"
                              ) {
                                form.setValue("endMinute", "30");
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
            {form.formState.errors.timeRange && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.timeRange.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Note: End time must be between 7:00 AM - 8:30 PM
            </p>
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Day <span className="text-destructive">*</span>
            </label>
            {form.formState.errors.days && (
              <p className="text-xs text-destructive">
                {form.formState.errors.days.message}
              </p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-x-2 gap-y-3">
              {Object.entries(days).map(([value, label]) => (
                <Controller
                  key={value}
                  control={form.control}
                  name="days"
                  render={({ field }) => {
                    return (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(value)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, value])
                              : field.onChange(
                                  field.value?.filter((item) => item !== value)
                                );
                          }}
                        />
                        <label
                          htmlFor={`day-${value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {label}
                        </label>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {/* Room field */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Room <span className="text-destructive">*</span>
                </label>
                {form.formState.errors.roomName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.roomName.message}
                  </p>
                )}
              </div>
              <Controller
                control={form.control}
                name="roomName"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={loadingOptions}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.length > 0 ? (
                        rooms.map((room) => (
                          <SelectItem
                            key={`room-${room.id || "unknown"}`}
                            value={room.name || `Room ${room.id || "unknown"}`}
                          >
                            {room.name || "Unknown Room"}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No rooms available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Instructor field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Instructor <span className="text-destructive">*</span>
                </label>
                {form.formState.errors.instructorName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.instructorName.message}
                  </p>
                )}
              </div>
              <Controller
                control={form.control}
                name="instructorName"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={loadingOptions}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.length > 0 ? (
                        instructors.map((instructor) => (
                          <SelectItem
                            key={`instructor-${instructor.id || "unknown"}`}
                            value={
                              instructor.name ||
                              `Instructor ${instructor.id || "unknown"}`
                            }
                          >
                            {instructor.name || "Unknown Instructor"}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No instructors available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Color <span className="text-destructive">*</span>
              </label>
              {form.formState.errors.color && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.color.message}
                </p>
              )}
            </div>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Select
                  value={field.value || "blue"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="scheduleColor" className="w-full">
                    <SelectValue placeholder="Select Color">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            COLOR_OPTIONS.find((c) => c.value === field.value)
                              ?.bg || "bg-blue-500"
                          }`}
                        ></div>
                        <span>
                          {COLOR_OPTIONS.find((c) => c.value === field.value)
                            ?.label || "Blue"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="grid grid-cols-2 gap-1 py-2">
                      {COLOR_OPTIONS.map((color) => (
                        <SelectItem
                          key={color.value}
                          value={color.value}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full ${color.bg}`}
                            ></div>
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* conflicts alert */}
          {conflicts.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-5 w-5 mt-1 sm:mt-2" />
              <AlertTitle className="text-sm sm:text-base">
                Scheduling Conflicts Detected
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                <p className="mb-2">
                  This schedule conflicts with {conflicts.length} existing
                  schedule(s).{" "}
                  {conflicts.length > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-xs sm:text-sm underline text-blue-600 cursor-pointer"
                      onClick={() => setShowConflictDialog(true)}
                    >
                      View conflict details
                    </Button>
                  )}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Conflict Confirmation Dialog */}
          <Dialog
            open={showConflictDialog && conflicts.length > 0}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setShowConflictDialog(false);
              }
            }}
          >
            <DialogContent className="sm:max-w-[750px]">
              <DialogHeader>
                <DialogTitle>Schedule Conflicts Detected</DialogTitle>
                <DialogDescription>
                  There {conflicts.length === 1 ? "is" : "are"}{" "}
                  {conflicts.length} scheduling{" "}
                  {conflicts.length === 1 ? "conflict" : "conflicts"} with
                  existing schedules. Do you want to proceed anyway?
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[250px] overflow-y-auto mt-4 pr-2 space-y-4">
                {Object.entries(
                  conflicts.reduce((acc, conflict) => {
                    if (!acc[conflict.type]) {
                      acc[conflict.type] = [];
                    }
                    acc[conflict.type].push(conflict);
                    return acc;
                  }, {})
                ).map(([type, group]) => {
                  // Get the right icon and title from our helper object
                  const details = conflictDetails[type] || {
                    title: "Other Conflicts",
                  };
                  const IconComponent = details.Icon;

                  return (
                    <div key={type}>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-md">
                        {IconComponent && (
                          <IconComponent
                            className={`h-5 w-5 ${details.className}`}
                            aria-hidden="true"
                          />
                        )}
                        <span>{details.title}</span>
                      </h4>
                      <ul className="list-none pl-4 border-l-2 ml-2.5 space-y-2.5">
                        {group.map((conflict) => (
                          <li
                            key={conflict.id}
                            className="text-sm flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 pt-0.5">
                              <Badge variant="outline">
                                {conflict.subject}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground">
                              {conflict.conflict}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConflictDialog(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmedConflictSubmit}
                  className="cursor-pointer"
                >
                  Proceed Anyway
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Confirmation Dialog */}
          <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel? All unsaved changes will be
                  lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCancelConfirm(false)}
                  className="cursor-pointer"
                >
                  Continue Editing
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    form.reset();
                    onClose();
                    setShowCancelConfirm(false);
                  }}
                  className="cursor-pointer"
                >
                  Discard Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel and Save changes button */}
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              className="cursor-pointer"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
