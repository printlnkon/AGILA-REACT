import { db } from "@/api/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useState, useEffect, useReducer } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderCircle, Plus, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", bg: "bg-blue-500", text: "text-white" },
  { value: "green", label: "Green", bg: "bg-green-500", text: "text-white" },
  { value: "red", label: "Red", bg: "bg-red-500", text: "text-white" },
  { value: "purple", label: "Purple", bg: "bg-purple-500", text: "text-white" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", text: "text-white" },
  { value: "pink", label: "Pink", bg: "bg-pink-500", text: "text-white" },
  { value: "cyan", label: "Cyan", bg: "bg-cyan-500", text: "text-white" },
  { value: "amber", label: "Amber", bg: "bg-amber-500", text: "text-black" },
  { value: "lime", label: "Lime", bg: "bg-lime-500", text: "text-black" },
  { value: "teal", label: "Teal", bg: "bg-teal-500", text: "text-white" },
];

const START_HOUR_OPTIONS = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
const END_HOUR_OPTIONS = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)];
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);

const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// initial state for form reducer
const initialFormState = {
  roomType: "lecture",
  subject: "",
  room: "",
  instructor: "",
  color: "blue",
  startHour: "",
  startMinute: "",
  startPeriod: "AM",
  endHour: "",
  endMinute: "",
  endPeriod: "AM",
  days: {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  },
  // New fields for laboratory
  hasLaboratory: false,
  labStartHour: "",
  labStartMinute: "",
  labStartPeriod: "AM",
  labEndHour: "",
  labEndMinute: "",
  labEndPeriod: "AM",
  labDays: {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  },
  labRoom: "",
  labInstructor: "",
};

// reducer for form state
function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_DAY":
      return {
        ...state,
        days: { ...state.days, [action.day]: !state.days[action.day] },
      };
    case "SET_LAB_DAY":
      return {
        ...state,
        labDays: { ...state.labDays, [action.day]: !state.labDays[action.day] },
      };
    case "TOGGLE_LAB":
      return { ...state, hasLaboratory: !state.hasLaboratory };
    case "RESET":
      return initialFormState;
    case "SET_TIME":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Initial state for errors
const initialErrorsState = {
  roomType: "",
  subject: "",
  room: "",
  instructor: "",
  startTime: "",
  endTime: "",
  days: "",
  timeRange: "",
  dateRange: "",
  color: "",
};

export default function AddScheduleModal({
  onScheduleAdded,
  departmentId,
  courseId,
  yearLevel,
  sectionId,
  activeSession,
  canAddSchedule,
  existingSchedules = [],
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("class_schedule");
  const [loading, setLoading] = useState(false);

  // Data state
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Form state with reducer
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const [errors, setErrors] = useState(initialErrorsState);

  // Utility functions
  const parseTime = (timeString) => {
    const [time, period] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
    };
  };

  const validateEndTime = (hour, minute, period) => {
    const endHour = parseInt(hour);
    const endMinute = parseInt(minute);

    // Convert to 24-hour format for comparison
    let hour24 = endHour;
    if (period === "PM" && endHour !== 12) {
      hour24 += 12;
    } else if (period === "AM" && endHour === 12) {
      hour24 = 0;
    }

    // Check if time is after 8:30 PM (20:30)
    if (hour24 > 20 || (hour24 === 20 && endMinute > 30)) {
      return false;
    }

    return true;
  };

  // set current time when modal opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      let currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Round to next 30-minute interval
      const roundedMinute = currentMinute < 30 ? "30" : "00";
      if (currentMinute >= 30) {
        currentHour += 1;
      }

      // Convert to 12-hour format
      const period = currentHour >= 12 ? "PM" : "AM";
      const hour12 =
        currentHour > 12
          ? currentHour - 12
          : currentHour === 0
          ? 12
          : currentHour;

      // Set end time (1 hour later)
      let endHour = currentHour + 1;
      const endPeriod = endHour >= 12 ? "PM" : "AM";
      const endHour12 =
        endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;

      dispatch({
        type: "SET_TIME",
        payload: {
          startHour: hour12.toString(),
          startMinute: roundedMinute,
          startPeriod: period,
          endHour: endHour12.toString(),
          endMinute: roundedMinute,
          endPeriod: endPeriod,
          labStartHour: hour12.toString(),
          labStartMinute: roundedMinute,
          labStartPeriod: period,
          labEndHour: endHour12.toString(),
          labEndMinute: roundedMinute,
          labEndPeriod: endPeriod,
        },
      });
    }
  }, [open]);

  // Clear errors when values change
  useEffect(() => {
    const { roomType, subject, room, instructor, color } = formState;
    const newErrors = { ...errors };

    if (roomType) newErrors.roomType = "";
    if (subject) newErrors.subject = "";
    if (room) newErrors.room = "";
    if (instructor) newErrors.instructor = "";
    if (color) newErrors.color = "";

    setErrors(newErrors);
  }, [
    formState.roomType,
    formState.subject,
    formState.room,
    formState.instructor,
    formState.color,
  ]);

  // clear time errors when time values change
  useEffect(() => {
    const newErrors = { ...errors };

    if (formState.startHour && formState.startMinute && formState.startPeriod) {
      newErrors.startTime = "";
    }
    if (formState.endHour && formState.endMinute && formState.endPeriod) {
      newErrors.endTime = "";
    }

    // validate time range
    if (
      formState.startHour &&
      formState.startMinute &&
      formState.startPeriod &&
      formState.endHour &&
      formState.endMinute &&
      formState.endPeriod
    ) {
      const startTime = parseTime(
        `${formState.startHour}:${formState.startMinute} ${formState.startPeriod}`
      );
      const endTime = parseTime(
        `${formState.endHour}:${formState.endMinute} ${formState.endPeriod}`
      );

      const startMinutes = startTime.hours * 60 + startTime.minutes;
      const endMinutes = endTime.hours * 60 + endTime.minutes;

      if (endMinutes < startMinutes) {
        newErrors.timeRange = "End time must be after start time";
      } else {
        newErrors.timeRange = "";
      }
    }

    // lab time validation
    if (formState.hasLaboratory) {
      if (
        formState.labStartHour &&
        formState.labStartMinute &&
        formState.labStartPeriod
      ) {
        newErrors.labStartTime = "";
      }
      if (
        formState.labEndHour &&
        formState.labEndMinute &&
        formState.labEndPeriod
      ) {
        newErrors.labEndTime = "";
      }

      // Validate lab time range
      if (
        formState.labStartHour &&
        formState.labStartMinute &&
        formState.labStartPeriod &&
        formState.labEndHour &&
        formState.labEndMinute &&
        formState.labEndPeriod
      ) {
        const labStartTime = parseTime(
          `${formState.labStartHour}:${formState.labStartMinute} ${formState.labStartPeriod}`
        );
        const labEndTime = parseTime(
          `${formState.labEndHour}:${formState.labEndMinute} ${formState.labEndPeriod}`
        );

        const labStartMinutes = labStartTime.hours * 60 + labStartTime.minutes;
        const labEndMinutes = labEndTime.hours * 60 + labEndTime.minutes;

        if (labEndMinutes < labStartMinutes) {
          newErrors.labTimeRange = "Lab end time must be after lab start time";
        } else {
          newErrors.labTimeRange = "";
        }
      }
    }

    setErrors(newErrors);
  }, [
    formState.startHour,
    formState.startMinute,
    formState.startPeriod,
    formState.endHour,
    formState.endMinute,
    formState.endPeriod,
    formState.labStartHour,
    formState.labStartMinute,
    formState.labStartPeriod,
    formState.labEndHour,
    formState.labEndMinute,
    formState.labEndPeriod,
    formState.hasLaboratory,
  ]);

  // Validate days selection
  useEffect(() => {
    const selectedDays = Object.values(formState.days).some(Boolean);
    const newErrors = { ...errors };

    if (selectedDays) {
      newErrors.days = "";
    }

    setErrors(newErrors);
  }, [formState.days]);

  // Fetch data when modal opens
  useEffect(() => {
    if (open && canAddSchedule) {
      fetchSubjects();
      fetchRooms();
      fetchInstructors();
    }
  }, [open, canAddSchedule]);

  // Filter available rooms
  useEffect(() => {
    const {
      roomType,
      subject,
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod,
      days,
    } = formState;

    if (
      !startHour ||
      !startMinute ||
      !endHour ||
      !endMinute ||
      !Object.values(days).some((day) => day) ||
      !subject ||
      !roomType
    ) {
      setAvailableRooms([]);
      return;
    }

    filterAvailableRooms();
  }, [
    formState.roomType,
    formState.startHour,
    formState.startMinute,
    formState.startPeriod,
    formState.endHour,
    formState.endMinute,
    formState.endPeriod,
    formState.days,
    formState.subject,
    rooms,
    existingSchedules,
  ]);

  // Check conflicts
  useEffect(() => {
    const {
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod,
      days,
      room,
      instructor,
    } = formState;

    if (
      !startHour ||
      !startMinute ||
      !endHour ||
      !endMinute ||
      !room ||
      !instructor ||
      !Object.values(days).some((day) => day)
    ) {
      setConflicts([]);
      return;
    }

    checkConflicts();
  }, [
    formState.startHour,
    formState.startMinute,
    formState.startPeriod,
    formState.endHour,
    formState.endMinute,
    formState.endPeriod,
    formState.days,
    formState.room,
    formState.instructor,
    rooms,
    instructors,
    existingSchedules,
  ]);

  // Function to filter available rooms
  const filterAvailableRooms = () => {
    const {
      roomType,
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod,
      days,
    } = formState;

    // Filter rooms by type
    const roomsByType = rooms.filter(
      (room) =>
        room.status === "available" &&
        (!room.roomType || room.roomType === roomType)
    );

    if (roomsByType.length === 0) {
      setAvailableRooms([]);
      return;
    }

    // Create time strings for comparison
    const startTime = `${startHour}:${startMinute} ${startPeriod}`;
    const endTime = `${endHour}:${endMinute} ${endPeriod}`;

    const activeDays = Object.entries(days)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => day);

    // Check each room for conflicts
    const available = roomsByType.filter((room) => {
      const conflicts = existingSchedules.filter((schedule) => {
        // Only consider conflicts for this room
        if (schedule.roomId !== room.id) return false;

        // Check time overlap
        const scheduleStart = parseTime(schedule.startTime);
        const scheduleEnd = parseTime(schedule.endTime);
        const newStart = parseTime(startTime);
        const newEnd = parseTime(endTime);

        const timeOverlap =
          newStart.totalMinutes <= scheduleEnd.totalMinutes &&
          newEnd.totalMinutes >= scheduleStart.totalMinutes;

        // Check day overlap
        const dayOverlap = activeDays.some((day) =>
          schedule.days.includes(day)
        );

        return timeOverlap && dayOverlap;
      });

      // Room is available if there are no conflicts
      return conflicts.length === 0;
    });

    setAvailableRooms(available);

    // Reset selected room if it's no longer available
    if (
      formState.room &&
      !available.some((room) => room.id === formState.room)
    ) {
      dispatch({ type: "SET_FIELD", field: "room", value: "" });
    }
  };

  // Check for time conflicts
  const checkTimeConflict = (scheduleA, scheduleB) => {
    const startA = parseTime(scheduleA.startTime);
    const endA = parseTime(scheduleA.endTime);
    const startB = parseTime(scheduleB.startTime);
    const endB = parseTime(scheduleB.endTime);

    // Schedule A starts or ends during Schedule B
    const aOverlapsB =
      (startA.totalMinutes < endB.totalMinutes &&
        startA.totalMinutes >= startB.totalMinutes) ||
      (endA.totalMinutes <= endB.totalMinutes &&
        endA.totalMinutes > startB.totalMinutes);

    // Schedule B starts or ends during Schedule A
    const bOverlapsA =
      (startB.totalMinutes < endA.totalMinutes &&
        startB.totalMinutes >= startA.totalMinutes) ||
      (endB.totalMinutes <= endA.totalMinutes &&
        endB.totalMinutes > startA.totalMinutes);

    // One schedule completely contains the other
    const aContainsB =
      startA.totalMinutes <= startB.totalMinutes &&
      endA.totalMinutes >= endB.totalMinutes;
    const bContainsA =
      startB.totalMinutes <= startA.totalMinutes &&
      endB.totalMinutes >= endA.totalMinutes;

    // Schedules start or end at exactly the same time
    const sameStartOrEnd =
      startA.totalMinutes === startB.totalMinutes ||
      startA.totalMinutes === endB.totalMinutes ||
      endA.totalMinutes === startB.totalMinutes ||
      endA.totalMinutes === endB.totalMinutes;

    return (
      aOverlapsB || bOverlapsA || aContainsB || bContainsA || sameStartOrEnd
    );
  };

  // Check for conflicts
  // Fix for the checkConflicts function
  const checkConflicts = () => {
    const {
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod,
      days,
      room,
      instructor,
      hasLaboratory,
      labStartHour,
      labStartMinute,
      labStartPeriod,
      labEndHour,
      labEndMinute,
      labEndPeriod,
      labDays,
      labRoom,
      labInstructor,
    } = formState;

    const startTime = `${startHour}:${startMinute} ${startPeriod}`;
    const endTime = `${endHour}:${endMinute} ${endPeriod}`;

    const selectedDays = Object.entries(days)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => day);

    // Track already checked schedules to avoid duplicates
    const processedScheduleIds = new Set();
    const detectedConflicts = [];

    // Check lecture conflicts with existing schedules
    existingSchedules.forEach((schedule) => {
      // Skip the schedule if it's the one being edited
      if (schedule.id === formState.editingScheduleId) {
        return;
      }

      // Check for time and day overlap
      const timeOverlap = checkTimeConflict(
        { startTime, endTime },
        { startTime: schedule.startTime, endTime: schedule.endTime }
      );

      // Check day overlap
      const dayOverlap = selectedDays.some((day) =>
        schedule.days.includes(day)
      );

      if (timeOverlap && dayOverlap) {
        // Check each type of conflict independently

        // Room conflict
        if (room === schedule.roomId) {
          detectedConflicts.push({
            id: `${schedule.id}-room`,
            subject: schedule.subjectName,
            type: "room",
            conflict: `Room ${schedule.roomName} is already booked for ${schedule.subjectCode} (${schedule.startTime} - ${schedule.endTime})`,
          });
        }

        // Instructor conflict
        if (instructor === schedule.instructorId) {
          detectedConflicts.push({
            id: `${schedule.id}-instructor`,
            subject: schedule.subjectName,
            type: "instructor",
            conflict: `Instructor ${schedule.instructorName} is already teaching ${schedule.subjectCode} (${schedule.startTime} - ${schedule.endTime})`,
          });
        }

        // Student schedule conflict (same section)
        if (
          !schedule.isLabComponent &&
          !processedScheduleIds.has(`${schedule.id}-section`)
        ) {
          detectedConflicts.push({
            id: `${schedule.id}-section`,
            subject: schedule.subjectName,
            type: "section",
            conflict: `This section already has ${schedule.subjectCode} scheduled at this time`,
          });
          processedScheduleIds.add(`${schedule.id}-section`);
        }
      }
    });

    // Check laboratory conflicts if lab is included
    if (hasLaboratory && labRoom && labInstructor) {
      const labStartTimeString = `${labStartHour}:${labStartMinute} ${labStartPeriod}`;
      const labEndTimeString = `${labEndHour}:${labEndMinute} ${labEndPeriod}`;

      // Get selected days for laboratory
      const selectedLabDays = Object.entries(labDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day]) => day);

      existingSchedules.forEach((schedule) => {
        // Skip the schedule if it's the one being edited
        if (schedule.id === formState.editingLabScheduleId) {
          return;
        }

        // Check for time overlap using our helper function
        const labTimeOverlap = checkTimeConflict(
          { startTime: labStartTimeString, endTime: labEndTimeString },
          { startTime: schedule.startTime, endTime: schedule.endTime }
        );

        // Check lab day overlap
        const labDayOverlap = selectedLabDays.some((day) =>
          schedule.days.includes(day)
        );

        if (labTimeOverlap && labDayOverlap) {
          // Lab room conflict
          if (labRoom === schedule.roomId) {
            detectedConflicts.push({
              id: `${schedule.id}-labRoom`,
              subject: schedule.subjectName,
              type: "labRoom",
              conflict: `Laboratory room ${schedule.roomName} is already booked for ${schedule.subjectCode} (${schedule.startTime} - ${schedule.endTime})`,
            });
          }

          // Lab instructor conflict
          if (labInstructor === schedule.instructorId) {
            detectedConflicts.push({
              id: `${schedule.id}-labInstructor`,
              subject: schedule.subjectName,
              type: "labInstructor",
              conflict: `Laboratory instructor ${schedule.instructorName} is already teaching ${schedule.subjectCode} (${schedule.startTime} - ${schedule.endTime})`,
            });
          }
        }
      });

      // Check if lecture and lab schedules conflict with each other
      const selfTimeOverlap = checkTimeConflict(
        { startTime, endTime },
        { startTime: labStartTimeString, endTime: labEndTimeString }
      );

      const selfDayOverlap = selectedLabDays.some((day) =>
        selectedDays.includes(day)
      );

      // Check if lecture instructor is teaching the lab at the same time
      if (selfTimeOverlap && selfDayOverlap && instructor === labInstructor) {
        detectedConflicts.push({
          id: "self-conflict",
          subject: "This schedule",
          type: "self",
          conflict:
            "The same instructor cannot teach lecture and laboratory sessions at overlapping times",
        });
      }
    }

    // Remove any duplicate conflicts
    const uniqueConflicts = Array.from(
      new Map(
        detectedConflicts.map((conflict) => [conflict.id, conflict])
      ).values()
    );

    setConflicts(uniqueConflicts);
  };

  // fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const subjectsRef = collection(
        db,
        `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses/${courseId}/year_levels/${yearLevel}/subjects`
      );

      const subjectsSnapshot = await getDocs(subjectsRef);

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
    } finally {
      setLoading(false);
    }
  };

  // fetch teachers/instructors
  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const teachersRef = collection(db, `users/teacher/accounts`);
      const teachersSnapshot = await getDocs(teachersRef);

      if (teachersSnapshot.empty) {
        setInstructors([]);
        toast.warning("No instructors found in the system.");
        return;
      }

      // Process all teachers and filter based on department
      const teachersList = teachersSnapshot.docs
        .map((doc) => {
          const teacherData = doc.data();
          return {
            id: doc.id,
            name: teacherData.firstName + " " + teacherData.lastName,
            // Include the required fields
            department: teacherData.department || "",
            departmentName: teacherData.departmentName || "",
            course: teacherData.course || "",
            courseName: teacherData.courseName || "",
            yearLevel: teacherData.yearLevel || "",
            yearLevelName: teacherData.yearLevelName || "",
            section: teacherData.section || "",
            sectionName: teacherData.sectionName || "",
          };
        })
        // Filter teachers to only include those from the current department
        .filter((teacher) => teacher.department === departmentId);

      setInstructors(teachersList);

      if (teachersList.length === 0) {
        toast.warning("No instructors found for this department.");
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  // fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);

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
          name: roomData.roomNo,
          roomNo: roomData.roomNo,
          floor: roomData.floor,
          status: roomData.status || "available",
          roomType: roomData.roomType || formState.roomType || "lecture",
        };
      });

      setRooms(roomsList);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (rooms.length > 0 && open) {
      filterAvailableRooms();
    }
  }, [rooms, open]);

  const validateForm = () => {
    const {
      roomType,
      subject,
      room,
      instructor,
      color,
      startHour,
      startMinute,
      startPeriod,
      endHour,
      endMinute,
      endPeriod,
      days,
      hasLaboratory,
      labStartHour,
      labStartMinute,
      labEndHour,
      labEndMinute,
      labDays,
      labRoom,
      labInstructor,
    } = formState;

    const newErrors = {};
    let isValid = true;

    // Existing validations
    if (!roomType) {
      newErrors.roomType = "Room type is required";
      isValid = false;
    }

    if (!startHour || !startMinute) {
      newErrors.startTime = "Start time is required";
      isValid = false;
    }

    if (!endHour || !endMinute) {
      newErrors.endTime = "End time is required";
      isValid = false;
    }

    if (!Object.values(days).some((day) => day)) {
      newErrors.days = "Select at least one day";
      isValid = false;
    }

    if (!subject) {
      newErrors.subject = "Subject is required";
      isValid = false;
    }

    if (!room) {
      newErrors.room = "Room is required";
      isValid = false;
    }

    if (!instructor) {
      newErrors.instructor = "Instructor is required";
      isValid = false;
    }

    if (!color) {
      newErrors.color = "Color is required";
      isValid = false;
    }

    // Laboratory validations when the checkbox is checked
    if (hasLaboratory) {
      if (!labStartHour || !labStartMinute) {
        newErrors.labStartTime = "Laboratory start time is required";
        isValid = false;
      }

      if (!labEndHour || !labEndMinute) {
        newErrors.labEndTime = "Laboratory end time is required";
        isValid = false;
      }

      if (!Object.values(labDays).some((day) => day)) {
        newErrors.labDays = "Select at least one laboratory day";
        isValid = false;
      }

      if (!labRoom) {
        newErrors.labRoom = "Laboratory room is required";
        isValid = false;
      }

      if (!labInstructor) {
        newErrors.labInstructor = "Laboratory instructor is required";
        isValid = false;
      }

      // Time range validation for lab
      if (labStartHour && labStartMinute && labEndHour && labEndMinute) {
        const start = parseTime(
          `${labStartHour}:${labStartMinute} ${formState.labStartPeriod}`
        );
        const end = parseTime(
          `${labEndHour}:${labEndMinute} ${formState.labEndPeriod}`
        );

        if (start.totalMinutes >= end.totalMinutes) {
          newErrors.labTimeRange = "Lab end time must be after lab start time";
          isValid = false;
        }
      }
    }

    // Time range validation for lecture
    if (startHour && startMinute && endHour && endMinute) {
      const start = parseTime(
        `${startHour}:${startMinute} ${formState.startPeriod}`
      );
      const end = parseTime(`${endHour}:${endMinute} ${formState.endPeriod}`);

      if (start.totalMinutes >= end.totalMinutes) {
        newErrors.timeRange = "End time must be after start time";
        isValid = false;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleRoomAdded = (newRoom) => {
    setRooms((prevRooms) => [
      ...prevRooms,
      {
        id: newRoom.id,
        roomNo: newRoom.roomNo,
        floor: newRoom.floor,
        status: newRoom.status || "available",
        roomType: formState.roomType || "lecture",
      },
    ]);

    setTimeout(filterAvailableRooms, 100);

    setTimeout(() => {
      if (availableRooms.some((room) => room.id === newRoom.id)) {
        dispatch({ type: "SET_FIELD", field: "room", value: newRoom.id });
      }
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // If there are errors in the class_schedule info tab, switch to it
      if (
        errors.subject ||
        errors.roomType ||
        errors.room ||
        errors.instructor ||
        errors.color ||
        errors.labStartTime ||
        errors.labEndTime ||
        errors.labDays ||
        errors.labRoom ||
        errors.labInstructor
      ) {
        setActiveTab("class_schedule");
      }
      return;
    }

    // Validate end time limits
    const {
      endHour,
      endMinute,
      endPeriod,
      labEndHour,
      labEndMinute,
      labEndPeriod,
      hasLaboratory,
    } = formState;

    if (!validateEndTime(endHour, endMinute, endPeriod)) {
      setErrors((prev) => ({
        ...prev,
        endTime: "End time cannot exceed 8:30 PM",
      }));
      setActiveTab("class_schedule");
      return;
    }

    if (
      hasLaboratory &&
      !validateEndTime(labEndHour, labEndMinute, labEndPeriod)
    ) {
      setErrors((prev) => ({
        ...prev,
        labEndTime: "Laboratory end time cannot exceed 8:30 PM",
      }));
      setActiveTab("class_schedule");
      return;
    }

    setLoading(true);

    try {
      const {
        roomType,
        subject,
        room,
        instructor,
        color,
        startHour,
        startMinute,
        startPeriod,
        endHour,
        endMinute,
        endPeriod,
        days,
        hasLaboratory,
        labStartHour,
        labStartMinute,
        labStartPeriod,
        labEndHour,
        labEndMinute,
        labEndPeriod,
        labDays,
        labRoom,
        labInstructor,
      } = formState;

      // Get selected days for lecture
      const selectedDays = Object.entries(days)
        .filter(([_, isSelected]) => isSelected)
        .map(([day]) => day);

      // Check for conflicts before submitting
      if (conflicts.length > 0) {
        setShowConflictDialog(true);
        setLoading(false);
        return;
      }

      // Update room type for lecture room
      const roomRef = doc(db, "rooms", room);
      await updateDoc(roomRef, {
        roomType: roomType,
        status: "scheduled",
        updatedAt: new Date(),
      });

      // Lecture schedule object
      const scheduleData = {
        subjectId: subject,
        subjectCode: subjects.find((s) => s.id === subject)?.code,
        subjectName: subjects.find((s) => s.id === subject)?.name,
        roomId: room,
        roomName: rooms.find((r) => r.id === room)?.name,
        instructorId: instructor,
        instructorName: instructors.find((i) => i.id === instructor)?.name,
        startTime: `${startHour}:${startMinute} ${startPeriod}`,
        endTime: `${endHour}:${endMinute} ${endPeriod}`,
        days: selectedDays,
        roomType: "LECTURE",
        color: color,
        createdAt: new Date(),
        hasLaboratory: hasLaboratory,
      };

      // Path to save schedules
      const schedulesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses/${courseId}/year_levels/${yearLevel}/sections/${sectionId}/schedules`;

      // Add lecture schedule document to firestore
      const lectureDocRef = await addDoc(
        collection(db, schedulesPath),
        scheduleData
      );

      // Add the ID to the schedule data for the local state update
      const newSchedule = {
        id: lectureDocRef.id,
        ...scheduleData,
      };

      // If laboratory component is enabled, create lab schedule
      if (hasLaboratory) {
        // Get selected days for laboratory
        const selectedLabDays = Object.entries(labDays)
          .filter(([_, isSelected]) => isSelected)
          .map(([day]) => day);

        // Update room type for laboratory room
        const labRoomRef = doc(db, "rooms", labRoom);
        await updateDoc(labRoomRef, {
          roomType: "laboratory",
          status: "scheduled",
          updatedAt: new Date(),
        });

        // Laboratory schedule object
        const labScheduleData = {
          subjectId: subject,
          subjectCode: subjects.find((s) => s.id === subject)?.code,
          subjectName: subjects.find((s) => s.id === subject)?.name,
          roomId: labRoom,
          roomName: rooms.find((r) => r.id === labRoom)?.name,
          instructorId: labInstructor,
          instructorName: instructors.find((i) => i.id === labInstructor)?.name,
          startTime: `${labStartHour}:${labStartMinute} ${labStartPeriod}`,
          endTime: `${labEndHour}:${labEndMinute} ${labEndPeriod}`,
          days: selectedLabDays,
          roomType: "LABORATORY",
          color: color,
          createdAt: new Date(),
          lectureScheduleId: lectureDocRef.id,
          isLabComponent: true,
        };

        // Add laboratory schedule document to firestore
        const labDocRef = await addDoc(
          collection(db, schedulesPath),
          labScheduleData
        );

        // Add the lab schedule to the local state update
        const newLabSchedule = {
          id: labDocRef.id,
          ...labScheduleData,
        };

        // If no conflicts, proceed with submission
        await handleConfirmedConflictSubmit();
        // Update both schedules
        await onScheduleAdded([newSchedule, newLabSchedule]);
      } else {
        // Only update lecture schedule
        await onScheduleAdded(newSchedule);
      }

      // toast.success(`Schedule${hasLaboratory ? "s" : ""} successfully added`);
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error("Failed to add schedule");
      console.error("Error adding schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedConflictSubmit = async () => {
    setShowConflictDialog(false);
    setLoading(true);

    try {
      const {
        roomType,
        subject,
        room,
        instructor,
        color,
        startHour,
        startMinute,
        startPeriod,
        endHour,
        endMinute,
        endPeriod,
        days,
        hasLaboratory,
        labStartHour,
        labStartMinute,
        labStartPeriod,
        labEndHour,
        labEndMinute,
        labEndPeriod,
        labDays,
        labRoom,
        labInstructor,
      } = formState;

      // Get selected days for lecture
      const selectedDays = Object.entries(days)
        .filter(([_, isSelected]) => isSelected)
        .map(([day]) => day);

      // Update room type for lecture room
      const roomRef = doc(db, "rooms", room);
      await updateDoc(roomRef, {
        roomType: roomType,
        status: "scheduled",
        updatedAt: new Date(),
      });

      // Lecture schedule object
      const scheduleData = {
        subjectId: subject,
        subjectCode: subjects.find((s) => s.id === subject)?.code,
        subjectName: subjects.find((s) => s.id === subject)?.name,
        roomId: room,
        roomName: rooms.find((r) => r.id === room)?.name,
        instructorId: instructor,
        instructorName: instructors.find((i) => i.id === instructor)?.name,
        startTime: `${startHour}:${startMinute} ${startPeriod}`,
        endTime: `${endHour}:${endMinute} ${endPeriod}`,
        days: selectedDays,
        roomType: "LECTURE",
        color: color,
        createdAt: new Date(),
        hasLaboratory: hasLaboratory,
      };

      // Path to save schedules
      const schedulesPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${departmentId}/courses/${courseId}/year_levels/${yearLevel}/sections/${sectionId}/schedules`;

      // Add lecture schedule document to firestore
      const lectureDocRef = await addDoc(
        collection(db, schedulesPath),
        scheduleData
      );

      // Add the ID to the schedule data for the local state update
      const newSchedule = {
        id: lectureDocRef.id,
        ...scheduleData,
      };

      // If laboratory component is enabled, create lab schedule
      if (hasLaboratory) {
        // Get selected days for laboratory
        const selectedLabDays = Object.entries(labDays)
          .filter(([_, isSelected]) => isSelected)
          .map(([day]) => day);

        // Update room type for laboratory room
        const labRoomRef = doc(db, "rooms", labRoom);
        await updateDoc(labRoomRef, {
          roomType: "laboratory",
          status: "scheduled",
          updatedAt: new Date(),
        });

        // Laboratory schedule object
        const labScheduleData = {
          subjectId: subject,
          subjectCode: subjects.find((s) => s.id === subject)?.code,
          subjectName: subjects.find((s) => s.id === subject)?.name,
          roomId: labRoom,
          roomName: rooms.find((r) => r.id === labRoom)?.name,
          instructorId: labInstructor,
          instructorName: instructors.find((i) => i.id === labInstructor)?.name,
          startTime: `${labStartHour}:${labStartMinute} ${labStartPeriod}`,
          endTime: `${labEndHour}:${labEndMinute} ${labEndPeriod}`,
          days: selectedLabDays,
          roomType: "LABORATORY",
          color: color,
          createdAt: new Date(),
          lectureScheduleId: lectureDocRef.id,
          isLabComponent: true,
        };

        // Add laboratory schedule document to firestore
        const labDocRef = await addDoc(
          collection(db, schedulesPath),
          labScheduleData
        );

        // Add the lab schedule to the local state update
        const newLabSchedule = {
          id: labDocRef.id,
          ...labScheduleData,
        };

        // Update both schedules
        await onScheduleAdded([newSchedule, newLabSchedule]);
      } else {
        // Only update lecture schedule
        await onScheduleAdded(newSchedule);
      }

      toast.success(`Schedule${hasLaboratory ? "s" : ""} successfully added`);
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error("Failed to add schedule");
      console.error("Error adding schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    dispatch({ type: "RESET" });
    setErrors(initialErrorsState);
    setConflicts([]);
    setActiveTab("class_schedule");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" disabled={!canAddSchedule}>
          <Plus className="h-4 w-4" /> Add Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Add Class Schedule
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create a new schedule for the selected class. All fields marked with{" "}
            <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger
              value="class_schedule"
              className="cursor-pointer text-sm sm:text-base"
            >
              Class Schedule
            </TabsTrigger>
            <TabsTrigger
              value="time"
              className="cursor-pointer text-sm sm:text-base"
            >
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="class_schedule">
            <form className="space-y-4">
              {/* Schedule Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="roomType" className="text-sm sm:text-base">
                  Room Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formState.roomType}
                  onValueChange={(value) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "roomType",
                      value,
                    })
                  }
                >
                  <SelectTrigger id="roomType" className="w-full">
                    <SelectValue placeholder="Select Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">Lecture</SelectItem>
                  </SelectContent>
                </Select>
                {errors.roomType && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">
                    {errors.roomType}
                  </p>
                )}
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formState.subject}
                  onValueChange={(value) =>
                    dispatch({ type: "SET_FIELD", field: "subject", value })
                  }
                >
                  <SelectTrigger id="subject" className="w-full">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              {formState.roomType && formState.subject && (
                <>
                  {/* Time selection */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Start Time */}
                      <div className="space-y-2">
                        <Label htmlFor="startTime" className="text-sm">
                          Start Time <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-xs text-muted-foreground block">
                          Current Time:{" "}
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          <Select
                            value={formState.startHour}
                            onValueChange={(value) => {
                              dispatch({
                                type: "SET_FIELD",
                                field: "startHour",
                                value,
                              });
                              // Restrict minutes if 8 PM is selected
                              if (
                                value === "8" &&
                                formState.startPeriod === "PM" &&
                                formState.startMinute > "30"
                              ) {
                                dispatch({
                                  type: "SET_FIELD",
                                  field: "startMinute",
                                  value: "30",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Hr" />
                            </SelectTrigger>
                            <SelectContent
                              className="max-h-[200px]"
                              position="popper"
                            >
                              {START_HOUR_OPTIONS.map((hour) => (
                                <SelectItem
                                  key={`start-hr-${hour}`}
                                  value={hour.toString()}
                                  disabled={
                                    formState.startPeriod === "PM" && hour > 8
                                  }
                                >
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>:</span>
                          <Select
                            value={formState.startMinute}
                            onValueChange={(value) => {
                              if (
                                !(
                                  formState.startPeriod === "PM" &&
                                  formState.startHour === "8" &&
                                  value > "30"
                                )
                              ) {
                                dispatch({
                                  type: "SET_FIELD",
                                  field: "startMinute",
                                  value,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent
                              className="max-h-[200px]"
                              position="popper"
                            >
                              {MINUTE_OPTIONS.map((minute) => (
                                <SelectItem
                                  key={`start-min-${minute}`}
                                  value={minute}
                                  disabled={
                                    formState.startPeriod === "PM" &&
                                    formState.startHour === "8" &&
                                    minute > "30"
                                  }
                                >
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={formState.startPeriod}
                            onValueChange={(value) => {
                              dispatch({
                                type: "SET_FIELD",
                                field: "startPeriod",
                                value,
                              });
                              // Adjust hour and minute when switching to PM
                              if (value === "PM") {
                                const hourNum = parseInt(formState.startHour);
                                if (hourNum > 8) {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "startHour",
                                    value: "8",
                                  });
                                  if (formState.startMinute > "30") {
                                    dispatch({
                                      type: "SET_FIELD",
                                      field: "startMinute",
                                      value: "30",
                                    });
                                  }
                                } else if (
                                  hourNum === 8 &&
                                  formState.startMinute > "30"
                                ) {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "startMinute",
                                    value: "30",
                                  });
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.startTime && (
                          <p className="text-xs sm:text-sm text-destructive mt-1">
                            {errors.startTime}
                          </p>
                        )}
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <Label htmlFor="endTime" className="text-sm">
                          End Time <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-xs text-muted-foreground block">
                          Current Time:{" "}
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          <Select
                            value={formState.endHour}
                            onValueChange={(value) => {
                              dispatch({
                                type: "SET_FIELD",
                                field: "endHour",
                                value,
                              });
                              // Restrict minutes if 8 PM is selected
                              if (
                                value === "8" &&
                                formState.endPeriod === "PM" &&
                                formState.endMinute > "30"
                              ) {
                                dispatch({
                                  type: "SET_FIELD",
                                  field: "endMinute",
                                  value: "30",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Hr" />
                            </SelectTrigger>
                            <SelectContent
                              className="max-h-[200px]"
                              position="popper"
                            >
                              {END_HOUR_OPTIONS.map((hour) => (
                                <SelectItem
                                  key={`end-hr-${hour}`}
                                  value={hour.toString()}
                                  disabled={
                                    formState.endPeriod === "PM" && hour > 8
                                  }
                                >
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>:</span>
                          <Select
                            value={formState.endMinute}
                            onValueChange={(value) => {
                              if (
                                !(
                                  formState.endPeriod === "PM" &&
                                  formState.endHour === "8" &&
                                  value > "30"
                                )
                              ) {
                                dispatch({
                                  type: "SET_FIELD",
                                  field: "endMinute",
                                  value,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                            <SelectContent
                              className="max-h-[200px]"
                              position="popper"
                            >
                              {MINUTE_OPTIONS.map((minute) => (
                                <SelectItem
                                  key={`end-min-${minute}`}
                                  value={minute}
                                  disabled={
                                    formState.endPeriod === "PM" &&
                                    formState.endHour === "8" &&
                                    minute > "30"
                                  }
                                >
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={formState.endPeriod}
                            onValueChange={(value) => {
                              dispatch({
                                type: "SET_FIELD",
                                field: "endPeriod",
                                value,
                              });
                              // Adjust hour and minute when switching to PM
                              if (value === "PM") {
                                const hourNum = parseInt(formState.endHour);
                                if (hourNum > 8) {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "endHour",
                                    value: "8",
                                  });
                                  if (formState.endMinute > "30") {
                                    dispatch({
                                      type: "SET_FIELD",
                                      field: "endMinute",
                                      value: "30",
                                    });
                                  }
                                } else if (
                                  hourNum === 8 &&
                                  formState.endMinute > "30"
                                ) {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "endMinute",
                                    value: "30",
                                  });
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {errors.endTime && (
                          <p className="text-xs sm:text-sm text-destructive mt-1">
                            {errors.endTime}
                          </p>
                        )}
                      </div>
                    </div>
                    {errors.timeRange && (
                      <p className="text-xs sm:text-sm text-destructive mt-1">
                        {errors.timeRange}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: End time cannot be later than 8:30 PM
                    </p>
                  </div>

                  {/* Days Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Day <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-x-2 gap-y-3">
                      {Object.entries(DAY_LABELS).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${key}`}
                            checked={formState.days[key]}
                            onCheckedChange={() =>
                              dispatch({ type: "SET_DAY", day: key })
                            }
                          />
                          <label
                            htmlFor={`day-${key}`}
                            className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.days && (
                      <p className="text-xs sm:text-sm text-destructive mt-1">
                        {errors.days}
                      </p>
                    )}
                  </div>

                  {/* Laboratory Checkbox */}
                  {formState.roomType === "lecture" && (
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="hasLaboratory"
                        checked={formState.hasLaboratory}
                        onCheckedChange={() => dispatch({ type: "TOGGLE_LAB" })}
                      />
                      <Label
                        htmlFor="hasLaboratory"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        w/ Laboratory
                      </Label>
                    </div>
                  )}

                  {/* Room Selection */}
                  {formState.roomType &&
                    formState.subject &&
                    Object.values(formState.days).some((day) => day) && (
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="room" className="text-sm">
                              Room <span className="text-destructive">*</span>
                            </Label>
                          </div>
                          <Select
                            value={formState.room}
                            onValueChange={(value) =>
                              dispatch({
                                type: "SET_FIELD",
                                field: "room",
                                value,
                              })
                            }
                          >
                            <SelectTrigger id="room" className="w-full">
                              <SelectValue
                                placeholder={
                                  availableRooms.length
                                    ? "Select Lecture Room"
                                    : "No available lecture rooms"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="max-h-[200px] overflow-y-auto"
                            >
                              {availableRooms.length > 0 ? (
                                // Group rooms by floor
                                Object.entries(
                                  availableRooms.reduce((acc, room) => {
                                    const floor = room.floor || "Other";
                                    if (!acc[floor]) acc[floor] = [];
                                    acc[floor].push(room);
                                    return acc;
                                  }, {})
                                )
                                  .sort(([floorA], [floorB]) => {
                                    // Sort floors numerically
                                    const numA = parseInt(floorA);
                                    const numB = parseInt(floorB);
                                    if (isNaN(numA)) return 1;
                                    if (isNaN(numB)) return -1;
                                    return numA - numB;
                                  })
                                  .map(([floor, rooms]) => (
                                    <div key={floor}>
                                      <div className="text-xs font-bold text-muted-foreground">
                                        {floor === "Other"
                                          ? "Other Rooms"
                                          : `Floor ${floor}`}
                                      </div>
                                      {rooms
                                        .sort((a, b) => {
                                          // Sort rooms within each floor numerically
                                          const roomNumA = parseInt(
                                            a.roomNo.replace(/\D/g, "")
                                          );
                                          const roomNumB = parseInt(
                                            b.roomNo.replace(/\D/g, "")
                                          );
                                          return roomNumA - roomNumB;
                                        })
                                        .map((room) => (
                                          <SelectItem
                                            key={room.id}
                                            value={room.id}
                                          >
                                            {room.name}
                                          </SelectItem>
                                        ))}
                                    </div>
                                  ))
                              ) : (
                                <SelectItem value="no-rooms" disabled>
                                  No available rooms
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {errors.room && (
                            <p className="text-xs sm:text-sm text-destructive mt-1">
                              {errors.room}
                            </p>
                          )}
                          {availableRooms.length === 0 &&
                            formState.roomType &&
                            formState.subject &&
                            Object.values(formState.days).some(
                              (day) => day
                            ) && (
                              <p className="text-xs sm:text-sm text-amber-600 mt-1">
                                No rooms available for selected time and day.
                                Try selecting different time or day, or add a
                                new room.
                              </p>
                            )}
                        </div>

                        {/* Instructor Selection */}
                        {formState.room && (
                          <div className="space-y-2">
                            <Label htmlFor="instructor" className="text-sm">
                              Instructor{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={formState.instructor}
                              onValueChange={(value) =>
                                dispatch({
                                  type: "SET_FIELD",
                                  field: "instructor",
                                  value,
                                })
                              }
                            >
                              <SelectTrigger id="instructor" className="w-full">
                                <SelectValue placeholder="Select Lecture Instructor" />
                              </SelectTrigger>
                              <SelectContent position="popper">
                                {instructors.map((instructor) => (
                                  <SelectItem
                                    key={instructor.id}
                                    value={instructor.id}
                                  >
                                    {instructor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.instructor && (
                              <p className="text-xs sm:text-sm text-destructive mt-1">
                                {errors.instructor}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Laboratory Time and Day Selection */}
                  {formState.hasLaboratory && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      <h3 className="font-bold text-lg">Laboratory Schedule</h3>

                      {/* Laboratory Time Selection */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Lab Start Time */}
                          <div className="space-y-2">
                            <Label htmlFor="labStartTime" className="text-sm">
                              Lab Start Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <span className="text-xs text-muted-foreground block">
                              Current Time:{" "}
                              {new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                            <div className="flex items-center gap-1">
                              <Select
                                value={formState.labStartHour}
                                onValueChange={(value) => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "labStartHour",
                                    value,
                                  });
                                  // Restrict minutes if 8 PM is selected
                                  if (
                                    value === "8" &&
                                    formState.labStartPeriod === "PM" &&
                                    formState.labStartMinute > "30"
                                  ) {
                                    dispatch({
                                      type: "SET_FIELD",
                                      field: "labStartMinute",
                                      value: "30",
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Hr" />
                                </SelectTrigger>
                                <SelectContent
                                  className="max-h-[200px]"
                                  position="popper"
                                >
                                  {START_HOUR_OPTIONS.map((hour) => (
                                    <SelectItem
                                      key={`lab-start-hr-${hour}`}
                                      value={hour.toString()}
                                      disabled={
                                        formState.labStartPeriod === "PM" &&
                                        hour > 8
                                      }
                                    >
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span>:</span>
                              <Select
                                value={formState.labStartMinute}
                                onValueChange={(value) => {
                                  if (
                                    !(
                                      formState.labStartPeriod === "PM" &&
                                      formState.labStartHour === "8" &&
                                      value > "30"
                                    )
                                  ) {
                                    dispatch({
                                      type: "SET_FIELD",
                                      field: "labStartMinute",
                                      value,
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                                <SelectContent
                                  className="max-h-[200px]"
                                  position="popper"
                                >
                                  {MINUTE_OPTIONS.map((minute) => (
                                    <SelectItem
                                      key={`lab-start-min-${minute}`}
                                      value={minute}
                                      disabled={
                                        formState.labStartPeriod === "PM" &&
                                        formState.labStartHour === "8" &&
                                        minute > "30"
                                      }
                                    >
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={formState.labStartPeriod}
                                onValueChange={(value) => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "labStartPeriod",
                                    value,
                                  });
                                  // Adjust hour and minute when switching to PM
                                  if (value === "PM") {
                                    const hourNum = parseInt(
                                      formState.labStartHour
                                    );
                                    if (hourNum > 8) {
                                      dispatch({
                                        type: "SET_FIELD",
                                        field: "labStartHour",
                                        value: "8",
                                      });
                                      if (formState.labStartMinute > "30") {
                                        dispatch({
                                          type: "SET_FIELD",
                                          field: "labStartMinute",
                                          value: "30",
                                        });
                                      }
                                    } else if (
                                      hourNum === 8 &&
                                      formState.labStartMinute > "30"
                                    ) {
                                      dispatch({
                                        type: "SET_FIELD",
                                        field: "labStartMinute",
                                        value: "30",
                                      });
                                    }
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {errors.labStartTime && (
                              <p className="text-xs sm:text-sm text-destructive mt-1">
                                {errors.labStartTime}
                              </p>
                            )}
                          </div>

                          {/* Lab End Time */}
                          <div className="space-y-2">
                            <Label htmlFor="labEndTime" className="text-sm">
                              Lab End Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <span className="text-xs text-muted-foreground block">
                              Current Time:{" "}
                              {new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                            <div className="flex items-center gap-1">
                              <Select
                                value={formState.labEndHour}
                                onValueChange={(value) => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "labEndHour",
                                    value,
                                  });
                                  // Restrict minutes if 8 PM is selected
                                  if (
                                    value === "8" &&
                                    formState.labEndPeriod === "PM" &&
                                    formState.labEndMinute > "30"
                                  ) {
                                    dispatch({
                                      type: "SET_FIELD",
                                      field: "labEndMinute",
                                      value: "30",
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Hr" />
                                </SelectTrigger>
                                <SelectContent
                                  className="max-h-[200px]"
                                  position="popper"
                                >
                                  {END_HOUR_OPTIONS.map((hour) => (
                                    <SelectItem
                                      key={`lab-end-hr-${hour}`}
                                      value={hour.toString()}
                                      disabled={
                                        formState.labEndPeriod === "PM" &&
                                        hour > 8
                                      }
                                    >
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span>:</span>
                              <Select
                                value={formState.labEndMinute}
                                onValueChange={(value) => {
                                  if (
                                    !(
                                      formState.labEndPeriod === "PM" &&
                                      formState.labEndHour === "8" &&
                                      value > "30"
                                    )
                                  ) {
                                    dispatch({
                                      type: "SET_FIELD",
                                      field: "labEndMinute",
                                      value,
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                                <SelectContent
                                  className="max-h-[200px]"
                                  position="popper"
                                >
                                  {MINUTE_OPTIONS.map((minute) => (
                                    <SelectItem
                                      key={`lab-end-min-${minute}`}
                                      value={minute}
                                      disabled={
                                        formState.labEndPeriod === "PM" &&
                                        formState.labEndHour === "8" &&
                                        minute > "30"
                                      }
                                    >
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={formState.labEndPeriod}
                                onValueChange={(value) => {
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "labEndPeriod",
                                    value,
                                  });
                                  // Adjust hour and minute when switching to PM
                                  if (value === "PM") {
                                    const hourNum = parseInt(
                                      formState.labEndHour
                                    );
                                    if (hourNum > 8) {
                                      dispatch({
                                        type: "SET_FIELD",
                                        field: "labEndHour",
                                        value: "8",
                                      });
                                      if (formState.labEndMinute > "30") {
                                        dispatch({
                                          type: "SET_FIELD",
                                          field: "labEndMinute",
                                          value: "30",
                                        });
                                      }
                                    } else if (
                                      hourNum === 8 &&
                                      formState.labEndMinute > "30"
                                    ) {
                                      dispatch({
                                        type: "SET_FIELD",
                                        field: "labEndMinute",
                                        value: "30",
                                      });
                                    }
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {errors.labEndTime && (
                              <p className="text-xs sm:text-sm text-destructive mt-1">
                                {errors.labEndTime}
                              </p>
                            )}
                          </div>
                          {errors.timeRange && (
                            <p className="text-xs sm:text-sm text-destructive mt-1">
                              {errors.timeRange}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: End time cannot be later than 8:30 PM
                        </p>
                      </div>

                      {/* Laboratory Days Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Laboratory Day{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid grid-cols-3 sm:grid-cols-7 gap-x-2 gap-y-3">
                          {Object.entries(DAY_LABELS).map(([key, label]) => (
                            <div
                              key={`lab-${key}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                value
                                id={`lab-day-${key}`}
                                checked={formState.labDays[key]}
                                onCheckedChange={() =>
                                  dispatch({
                                    type: "SET_LAB_DAY",
                                    day: key,
                                  })
                                }
                              />
                              <label
                                htmlFor={`lab-day-${key}`}
                                className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {Object.values(formState.labDays).some((day) => day) && (
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                          {/* Laboratory Room Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="labRoom" className="text-sm">
                              Laboratory Room{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={formState.labRoom}
                              onValueChange={(value) =>
                                dispatch({
                                  type: "SET_FIELD",
                                  field: "labRoom",
                                  value,
                                })
                              }
                            >
                              <SelectTrigger id="labRoom" className="w-full">
                                <SelectValue
                                  placeholder={
                                    availableRooms.length
                                      ? "Select Laboratory Room"
                                      : "No available laboratory rooms"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                className="max-h-[200px] overflow-y-auto"
                              >
                                {availableRooms.length > 0 ? (
                                  // Group rooms by floor
                                  Object.entries(
                                    availableRooms.reduce((acc, room) => {
                                      const floor = room.floor || "Other";
                                      if (!acc[floor]) acc[floor] = [];
                                      acc[floor].push(room);
                                      return acc;
                                    }, {})
                                  )
                                    .sort(([floorA], [floorB]) => {
                                      // Sort floors numerically
                                      const numA = parseInt(floorA);
                                      const numB = parseInt(floorB);
                                      if (isNaN(numA)) return 1;
                                      if (isNaN(numB)) return -1;
                                      return numA - numB;
                                    })
                                    .map(([floor, rooms]) => (
                                      <div key={floor}>
                                        <div className="text-xs font-bold text-muted-foreground">
                                          {floor === "Other"
                                            ? "Other Rooms"
                                            : `Floor ${floor}`}
                                        </div>
                                        {rooms
                                          .sort((a, b) => {
                                            // Sort rooms within each floor numerically
                                            const roomNumA = parseInt(
                                              a.roomNo.replace(/\D/g, "")
                                            );
                                            const roomNumB = parseInt(
                                              b.roomNo.replace(/\D/g, "")
                                            );
                                            return roomNumA - roomNumB;
                                          })
                                          .map((room) => (
                                            <SelectItem
                                              key={room.id}
                                              value={room.id}
                                            >
                                              {room.name}
                                            </SelectItem>
                                          ))}
                                      </div>
                                    ))
                                ) : (
                                  <SelectItem value="no-rooms" disabled>
                                    No available rooms
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Laboratory Instructor Selection (can be optional) */}
                          {formState.labRoom && (
                            <div className="space-y-2">
                              <Label
                                htmlFor="labInstructor"
                                className="text-sm"
                              >
                                Laboratory Instructor{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Select
                                value={formState.labInstructor}
                                onValueChange={(value) =>
                                  dispatch({
                                    type: "SET_FIELD",
                                    field: "labInstructor",
                                    value,
                                  })
                                }
                              >
                                <SelectTrigger
                                  id="labInstructor"
                                  className="w-full"
                                >
                                  <SelectValue placeholder="Select Laboratory Instructor" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  {instructors.map((instructor) => (
                                    <SelectItem
                                      key={`lab-instructor-${instructor.id}`}
                                      value={instructor.id}
                                    >
                                      {instructor.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Color Selection */}
              <div className="space-y-2">
                <Label htmlFor="scheduleColor" className="text-sm">
                  Color <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formState.color}
                  onValueChange={(value) =>
                    dispatch({ type: "SET_FIELD", field: "color", value })
                  }
                >
                  <SelectTrigger id="scheduleColor" className="w-full">
                    <SelectValue placeholder="Select Color">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            COLOR_OPTIONS.find(
                              (c) => c.value === formState.color
                            )?.bg || "bg-blue-500"
                          }`}
                        ></div>
                        <span>
                          {COLOR_OPTIONS.find(
                            (c) => c.value === formState.color
                          )?.label || "Blue"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                {errors.color && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">
                    {errors.color}
                  </p>
                )}
              </div>

              {/* Cancel & Next btn */}
              <div className="flex justify-end pt-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="cursor-pointer text-xs sm:text-sm"
                    onClick={() => {
                      resetForm();
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="cursor-pointer text-xs sm:text-sm"
                    onClick={() => setActiveTab("time")}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="time">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Schedule summary */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm sm:text-base">
                  Schedule Summary
                </h3>
                <div className="bg-muted p-3 sm:p-4 rounded-md">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-3 gap-x-2 text-md sm:text-md">
                    <div className="col-span-2 sm:col-span-2">
                      <h4 className="font-bold">Lecture Schedule</h4>
                    </div>
                    <div>
                      <p className="font-semibold">Room Type:</p>
                      <p>
                        {formState.roomType
                          ? `${
                              formState.roomType.charAt(0).toUpperCase() +
                              formState.roomType.slice(1)
                            }${formState.hasLaboratory ? " w/ Laboratory" : ""}`
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Subject:</p>
                      <p className="break-words">
                        {subjects.find((s) => s.id === formState.subject)
                          ?.name || "Not set"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Lecture Room No.:</p>
                      <p>
                        {rooms.find((r) => r.id === formState.room)?.name ||
                          "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Lecture Instructor:</p>
                      <p className="break-words">
                        {instructors.find((i) => i.id === formState.instructor)
                          ?.name || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Lecture Time:</p>
                      <p>
                        {formState.startHour &&
                        formState.startMinute &&
                        formState.endHour &&
                        formState.endMinute
                          ? `${formState.startHour}:${formState.startMinute} ${formState.startPeriod} - ${formState.endHour}:${formState.endMinute} ${formState.endPeriod}`
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Lecture Day:</p>
                      <p>
                        {Object.entries(formState.days)
                          .filter(([_, isSelected]) => isSelected)
                          .map(
                            ([day]) =>
                              day.charAt(0).toUpperCase() + day.slice(1, 3)
                          )
                          .join(", ") || "Not set"}
                      </p>
                    </div>
                    {/* Laboratory info in summary */}
                    {formState.hasLaboratory && (
                      <div className="col-span-1 sm:col-span-2">
                        <h4 className="font-bold">Laboratory Schedule</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 text-md sm:text-md">
                          <div>
                            <p className="font-semibold">Lab Room No.:</p>
                            <p>
                              {rooms.find((r) => r.id === formState.labRoom)
                                ?.name || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">Lab Instructor:</p>
                            <p className="break-words">
                              {instructors.find(
                                (i) => i.id === formState.labInstructor
                              )?.name || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">Lab Time:</p>
                            <p>
                              {formState.labStartHour &&
                              formState.labStartMinute &&
                              formState.labEndHour &&
                              formState.labEndMinute
                                ? `${formState.labStartHour}:${formState.labStartMinute} ${formState.labStartPeriod} - ${formState.labEndHour}:${formState.labEndMinute} ${formState.labEndPeriod}`
                                : "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">Lab Day:</p>
                            <p>
                              {Object.entries(formState.labDays)
                                .filter(([_, isSelected]) => isSelected)
                                .map(
                                  ([day]) =>
                                    day.charAt(0).toUpperCase() +
                                    day.slice(1, 3)
                                )
                                .join(", ") || "Not set"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display selected color */}
                    <div className="col-span-1 sm:col-span-2">
                      <p className="font-semibold">Color:</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            COLOR_OPTIONS.find(
                              (c) => c.value === formState.color
                            )?.bg || "bg-blue-500"
                          }`}
                        ></div>
                        <span>
                          {COLOR_OPTIONS.find(
                            (c) => c.value === formState.color
                          )?.label || "Blue"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflicts alert */}
              {conflicts.length > 0 && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200"
                >
                  <AlertTriangle className="h-5 w-5 mt-1 sm:mt-2" />
                  <AlertTitle className="text-sm sm:text-base">
                    Scheduling Conflicts Detected
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">
                    <p className="mb-2">
                      This schedule conflicts with {conflicts.length} existing
                      schedule(s).{" "}
                      {/* Remove the detailed listing from here since it's duplicated */}
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
                open={showConflictDialog}
                onOpenChange={setShowConflictDialog}
              >
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Schedule Conflicts Detected</DialogTitle>
                    <DialogDescription>
                      There {conflicts.length === 1 ? "is" : "are"}{" "}
                      {conflicts.length} scheduling{" "}
                      {conflicts.length === 1 ? "conflict" : "conflicts"} with
                      existing schedules. Do you want to proceed anyway?
                    </DialogDescription>
                  </DialogHeader>

                  <div className="max-h-[200px] overflow-y-auto mt-4">
                    <div className="space-y-3">
                      {/* Group conflicts by type */}
                      {[...new Set(conflicts.map((c) => c.type))].map(
                        (type) => (
                          <div key={type}>
                            <h4 className="font-semibold mb-1 capitalize">
                              {type === "room"
                                ? "Room Conflicts"
                                : type === "instructor"
                                ? "Instructor Conflicts"
                                : type === "section"
                                ? "Section Schedule Conflicts"
                                : type === "labRoom"
                                ? "Laboratory Room Conflicts"
                                : type === "labInstructor"
                                ? "Laboratory Instructor Conflicts"
                                : type === "self"
                                ? "Self Conflicts"
                                : "Other Conflicts"}
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {conflicts
                                .filter((conflict) => conflict.type === type)
                                .map((conflict) => (
                                  <li
                                    key={`${conflict.type}-${conflict.id}`}
                                    className="text-sm"
                                  >
                                    <Badge
                                      variant="outline"
                                      className={`mr-1 text-[10px] sm:text-xs ${
                                        type === "room" || type === "labRoom"
                                          ? "bg-blue-50 border-blue-300 text-blue-700"
                                          : type === "instructor" ||
                                            type === "labInstructor"
                                          ? "bg-purple-50 border-purple-300 text-purple-700"
                                          : type === "section"
                                          ? "bg-amber-50 border-amber-300 text-amber-700"
                                          : "bg-red-50 border-red-300 text-red-700"
                                      }`}
                                    >
                                      {conflict.subject}
                                    </Badge>
                                    {conflict.conflict}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
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

              {/* Cancel & Back btn */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer text-xs sm:text-sm"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveTab("class_schedule")}
                    className="cursor-pointer text-xs sm:text-sm flex-1 sm:flex-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer text-xs sm:text-sm flex-1 sm:flex-auto"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
