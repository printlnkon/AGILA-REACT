import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { db } from "@/api/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Search,
  Pencil,
  Trash2,
  X,
  Building2,
  User,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  CalendarIcon,
  CalendarRange,
  LoaderCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import AddScheduleModal from "@/components/AdminComponents/AddScheduleModal";
// import ScheduleList from "@/components/AdminComponents/ScheduleList";

const days = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// time slots for the calendar - can be customized as needed
const timeSlots = [
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

// Time options for dropdown select
const timeOptions = [
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
];

// month names for month view
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// validate time range before submitting
const validateTimeRange = (
  startHour,
  startMinute,
  startPeriod,
  endHour,
  endMinute,
  endPeriod
) => {
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

  return null;
};

// Validation schema for schedule form
const scheduleFormSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  instructorName: z.string().min(1, "Instructor name is required"),
  roomName: z.string().min(1, "Room name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  days: z.array(z.string()).min(1, "At least one day must be selected"),
});

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

export default function ScheduleCalendar({
  activeSession,
  canAddSchedule,
  scheduleData,
  loading,
  departments,
  courses,
  yearLevels,
  sections,
  selectedDepartment,
  selectedCourse,
  selectedYearLevel,
  selectedSection,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [calendarView, setCalendarView] = useState("week"); // week, day, or month
  const [currentDay, setCurrentDay] = useState("monday");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  // Add this useEffect to fetch data when edit modal opens
  useEffect(() => {
    if (showEditModal) {
      fetchSubjects();
      fetchInstructors();
      fetchRooms();
    }
  }, [showEditModal, selectedDepartment, selectedCourse, selectedYearLevel]);

  // Fetch subjects for the current department and course
  const fetchSubjects = async () => {
    setLoadingOptions(true);
    try {
      const subjectsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${selectedDepartment}/courses/${selectedCourse}/subjects`;

      // Get subjects collection
      const subjectsSnapshot = await getDocs(collection(db, subjectsPath));

      // Map the snapshot to the format needed
      const subjectsData = subjectsSnapshot.empty
        ? []
        : subjectsSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              name: doc.data().subjectName || doc.data().name,
              code: doc.data().subjectCode || doc.data().code || "",
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
      setSubjects([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch instructors for the current department
  const fetchInstructors = async () => {
    setLoadingOptions(true);
    try {
      // Fetch instructors, possibly filtered by department
      const response = await fetch(
        `/api/instructors?departmentId=${selectedDepartment}`
      );
      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch rooms for the current department and course
  const fetchRooms = async () => {
    setLoadingOptions(true);
    try {
      // Fetch available rooms
      const response = await fetch("/api/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const departmentName = departments.find(
    (d) => d.id === selectedDepartment
  )?.name;
  const courseName = courses.find((c) => c.id === selectedCourse)?.name;
  const yearLevelValue =
    typeof yearLevels[0] === "object"
      ? yearLevels.find((y) => y.id === selectedYearLevel)?.yearLevelName
      : yearLevels.find((y) => y.toString() === selectedYearLevel)?.toString();
  const sectionName = sections.find((s) => s.id === selectedSection)?.name;

  // schedule type name
  const getScheduleTypeName = (schedule) => {
    if (schedule.isLabComponent === true || 
        schedule.scheduleType === "LABORATORY" || 
        schedule.scheduleType?.toLowerCase() === "laboratory" || 
        schedule.roomType === "laboratory") {
      return "Laboratory";
    }
    return "Lecture";
  };

  // initialize form for editing schedules
  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subjectName: "",
      instructorName: "",
      roomName: "",
      startTime: "",
      endTime: "",
      days: [],
      startHour: "",
      startMinute: "",
      startPeriod: "AM",
      endHour: "",
      endMinute: "",
      endPeriod: "AM",
      color: "blue",
      startDate: undefined,
      endDate: undefined,
    },
  });

  // group schedules by day
  const schedulesByDay = useMemo(() => {
    const grouped = {};
    Object.keys(days).forEach((day) => {
      grouped[day] = scheduleData.filter(
        (schedule) => schedule.days && schedule.days.includes(day)
      );
    });
    return grouped;
  }, [scheduleData]);

  // handle schedule click
  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetails(true);
  };

  // handle edit button click
  const handleEditClick = () => {
    if (selectedSchedule) {
      // Close the details first
      setShowDetails(false);

      // Show the edit modal (this triggers the useEffect to load data)
      setShowEditModal(true);

      // Parse start time
      const startTimeParts = selectedSchedule.startTime.split(" ");
      const [startHour, startMinute] = startTimeParts[0].split(":");
      const startPeriod = startTimeParts[1];

      // Parse end time
      const endTimeParts = selectedSchedule.endTime.split(" ");
      const [endHour, endMinute] = endTimeParts[0].split(":");
      const endPeriod = endTimeParts[1];

      // Parse dates if they exist
      let startDate = undefined;
      let endDate = undefined;

      if (selectedSchedule.startDate) {
        startDate = new Date(selectedSchedule.startDate);
      }

      if (selectedSchedule.endDate) {
        endDate = new Date(selectedSchedule.endDate);
      }

      // Populate the form with selected schedule data
      setTimeout(() => {
        form.reset({
          subjectName: selectedSchedule.subjectName,
          instructorName: selectedSchedule.instructorName,
          roomName: selectedSchedule.roomName,
          startTime: selectedSchedule.startTime,
          endTime: selectedSchedule.endTime,
          days: selectedSchedule.days || [],
          startHour: startHour,
          startMinute: startMinute,
          startPeriod: startPeriod,
          endHour: endHour,
          endMinute: endMinute,
          endPeriod: endPeriod,
          color: selectedSchedule.color || "blue",
          startDate: startDate,
          endDate: endDate,
        });
      }, 100);
    }
  };

  // handle delete button click
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // confirm delete action
  const confirmDelete = () => {
    if (selectedSchedule) {
      onDeleteSchedule(selectedSchedule.id);
      toast.success("Schedule has been deleted");
      setShowDeleteConfirm(false);
      setShowDetails(false);
    }
  };

  // handle form submission for editing schedules
  const handleEditSubmit = async (data) => {
    if (selectedSchedule) {
      setIsSubmitting(true);
      try {
        // Format the times from the separate hour, minute, period fields
        const startTime = `${data.startHour}:${data.startMinute} ${data.startPeriod}`;
        const endTime = `${data.endHour}:${data.endMinute} ${data.endPeriod}`;

        // Create updated schedule with original id and form data
        const updatedSchedule = {
          ...selectedSchedule,
          subjectName: data.subjectName,
          roomName: data.roomName,
          roomId:
            rooms.find((room) => room.name === data.roomName)?.id ||
            selectedSchedule.roomId,
          instructorId:
            instructors.find(
              (instructor) => instructor.name === data.instructorName
            )?.id || selectedSchedule.instructorId,
          instructorName: data.instructorName,
          startTime,
          endTime,
          days: data.days,
          color: data.color || "blue",
          scheduleType: data.scheduleType || "lecture",
        };

        // validate time range
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
          return;
        }

        // Call parent component's edit handler
        await onEditSchedule(updatedSchedule);

        // Show success message
        toast.success("Schedule has been updated");

        // Close the edit modal
        setShowEditModal(false);
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Failed to update schedule");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // get schedule color classes
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
        text: "text-black",
      },
      lime: {
        bg: "bg-lime-500",
        hoverBg: "hover:bg-lime-600",
        text: "text-black",
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

  // format the schedule time
  const formatScheduleTime = (schedule) => {
    return `${schedule.startTime} - ${schedule.endTime}`;
  };

  // format the current day date
  const formatCurrentDayDate = (dayKey) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Convert our day key to a number (0 = monday in our system)
    const dayKeys = Object.keys(days);
    const selectedDayIndex = dayKeys.indexOf(dayKey);

    // Convert to JavaScript's day numbers (0 = Sunday)
    // Our days: monday(0), tuesday(1), etc.
    // JS days: sunday(0), monday(1), etc.
    const selectedJsDay = selectedDayIndex + 1; // +1 because monday is 1 in JS

    // Calculate the difference in days
    let diff = selectedJsDay - dayOfWeek;

    // Adjust if we need to go to next week
    if (diff < 0) diff += 7;
    // If today is the selected day, don't add any days
    if (selectedJsDay === dayOfWeek) diff = 0;

    // Get the date by adding the difference
    const date = new Date(today);
    date.setDate(today.getDate() + diff);

    // Format the date (e.g., "Aug 21, 2025")
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // parse a time string like "8:00 AM" to get hours and minutes
  const parseTime = (timeString) => {
    // parse a time string like "8:00 AM" to get hours and minutes
    const [time, period] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  };

  // calculate the position of a schedule in the calendar
  const calculateSchedulePosition = (schedule) => {
    // calculate position and height based on start and end times
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    // find the closest time slot index for start and end time
    const startIndex = timeOptions.findIndex(
      (time) => time === schedule.startTime
    );
    const endIndex = timeOptions.findIndex((time) => time === schedule.endTime);

    // calculate the height based on duration (each slot is 60px high)
    const finalStartIndex = startIndex >= 0 ? Math.floor(startIndex / 2) : 0;
    const finalEndIndex =
      endIndex >= 0 ? Math.floor(endIndex / 2) : finalStartIndex + 1;

    return {
      top: finalStartIndex * 60,
      height: Math.max((finalEndIndex - finalStartIndex) * 60, 60),
    };
  };

  // calculate total hours for a schedule
  const calculateTotalHours = (schedule) => {
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    // calculate total hours (handle wrapping around midnight if needed)
    let hours = end.hours - start.hours;
    if (hours < 0) hours += 24;

    // handle minutes
    let minutes = end.minutes - start.minutes;
    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }

    // format the result
    return hours + (minutes > 0 ? ` hr ${minutes} min` : ` hr`);
  };

  // render a schedule item in the calendar
  const renderScheduleItem = (schedule, dayKey) => {
    const { top, height } = calculateSchedulePosition(schedule);
    const isCurrentSchedule =
      selectedSchedule && selectedSchedule.id === schedule.id;
    const totalHours = calculateTotalHours(schedule);
    const { bg, hoverBg, text } = getScheduleColorClasses(schedule);

    return (
      <div
        key={`${dayKey}-${schedule.id}`}
        onClick={() => handleScheduleClick(schedule)}
        className={`absolute w-full px-2 py-1 rounded-md overflow-hidden text-center
        transition-colors cursor-pointer flex flex-col justify-center
        ${bg} ${hoverBg} ${text}
        ${isCurrentSchedule ? "ring-1 ring-offset-1 ring-primary" : ""}`}
        style={{
          top: `${top}px`,
          height: `${Math.max(height, 60)}px`,
          zIndex: isCurrentSchedule ? 5 : 1,
        }}
      >
        {/* section name with schedule type */}
        <div className="text-[12px] font-medium opacity-80 mb-0.5 truncate">
          {sectionName || "Section"} • {getScheduleTypeName(schedule)}
        </div>

        {/* subject code with subject name */}
        <div className="font-semibold text-sm leading-tight truncate">
          {schedule.subjectCode && `${schedule.subjectCode} - `}{schedule.subjectName}
        </div>

        {/* room information */}
        <div className="text-[12px] mt-0.5 truncate">{schedule.roomName}</div>

        {/* time information and total hours */}
        {height >= 75 && (
          <div className="flex justify-center items-center gap-1 mt-1 text-[12px]">
            <Clock className="h-2.5 w-2.5" />
            <span className="truncate">{totalHours}</span>
          </div>
        )}

        {/* instructor name - only show if we have enough space */}
        {height >= 100 && (
          <div className="truncate text-[12px] mt-1 italic">
            {schedule.instructorName}
          </div>
        )}
      </div>
    );
  };

  // generate calendar days for the month view
  const getDaysInMonth = (year, month) => {
    // Get the days in the specified month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Adjust for Sunday being 0 in JS but we want Monday as first day (0)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: i, isCurrentMonth: true });
    }

    // Add empty cells to complete the grid (6 rows x 7 columns = 42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    return days;
  };

  // check if a day has schedules
  const getDaySchedules = (dayNumber) => {
    if (!dayNumber) return [];

    // create a date for the specific day in the calendar view
    const calendarDate = new Date(currentYear, currentMonth, dayNumber);

    const dayOfWeek = calendarDate.getDay();
    const dayMapping = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };
    const dayKey = dayMapping[dayOfWeek];

    // filter schedules that include this day and fall within the date range
    return scheduleData.filter((schedule) => {
      // check if schedule includes this day of the week
      if (!schedule.days || !schedule.days.includes(dayKey)) {
        return false;
      }

      // check if the calendar date falls within the schedule's date range
      if (schedule.startDate && schedule.endDate) {
        const scheduleStart = new Date(schedule.startDate);
        const scheduleEnd = new Date(schedule.endDate);

        // set hours to 0 for date-only comparison
        scheduleStart.setHours(0, 0, 0, 0);
        scheduleEnd.setHours(23, 59, 59, 999); // include the entire end date
        calendarDate.setHours(12, 0, 0, 0); // set to noon to avoid timezone issues

        return calendarDate >= scheduleStart && calendarDate <= scheduleEnd;
      }

      return true;
    });
  };

  // day view calendar
  const renderDayCalendar = () => {
    // Get the current date
    const today = new Date();

    // Track the selected date with an offset from today
    const [dayOffset, setDayOffset] = useState(0);

    // Calculate the displayed date by adding the offset to today
    const displayedDate = useMemo(() => {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      return date;
    }, [dayOffset]);

    // Get the day of the week for the displayed date
    const dayOfWeek = displayedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const dayMapping = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

    // Get the current day key based on the displayed date
    const currentDayKey = dayMapping[dayOfWeek];

    // Update current day when component mounts or date changes
    React.useEffect(() => {
      setCurrentDay(currentDayKey);
    }, [dayOffset]);

    // Get schedules for the displayed day
    const daySchedules = schedulesByDay[currentDay] || [];

    // Format the displayed date in a readable format
    const formatDisplayedDate = () => {
      return displayedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const handleTodayClick = () => {
      setDayOffset(0);
    };

    const isToday = dayOffset === 0;

    return (
      <div className="border rounded-lg mt-4 overflow-hidden">
        {/* day navigation */}
        <div className="flex justify-between bg-secondary items-center px-4 py-2 border-b">
          {/* previous day button */}
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => setDayOffset(dayOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* display day and date */}
          <div className="text-center">
            <div className="text-lg font-medium flex items-center justify-center gap-2">
              {days[currentDay]}
              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs cursor-pointer"
                  onClick={handleTodayClick}
                >
                  Today
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDisplayedDate()}
            </div>
          </div>

          {/* next day button */}
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => setDayOffset(dayOffset + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* time slots and schedule items */}
        <div className="grid grid-cols-12 relative">
          {/* time labels column */}
          <div className="col-span-2 border-r relative">
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className={`h-[60px] px-2 text-xs flex items-center justify-center text-muted-foreground
                  ${index !== 0 ? "border-t" : ""}`}
              >
                {time}
              </div>
            ))}
          </div>

          {/* schedule content */}
          <div className="col-span-10 relative">
            {/* time slot gridlines */}
            {timeSlots.map((_, index) => (
              <div
                key={index}
                className={`h-[60px] ${index !== 0 ? "border-t" : ""}`}
              />
            ))}

            {/* schedule items */}
            {daySchedules.map((schedule) => {
              const isCurrentSchedule =
                selectedSchedule && selectedSchedule.id === schedule.id;
              const { top, height } = calculateSchedulePosition(schedule);
              const totalHours = calculateTotalHours(schedule);
              const { bg, hoverBg, text } = getScheduleColorClasses(schedule);

              return (
                <div
                  key={schedule.id}
                  onClick={() => handleScheduleClick(schedule)}
                  className={`absolute left-0 right-0 mx-2 px-3 py-2 rounded-md overflow-hidden text-center border
                  transition-colors cursor-pointer
                  ${bg} ${hoverBg} ${text}`}
                  style={{
                    top: `${top}px`,
                    height: `${Math.max(height, 70)}px`,
                    zIndex: isCurrentSchedule ? 5 : 1,
                  }}
                >
                  {/* section name with schedule type */}
                  <div className="text-xs font-medium opacity-80 mb-0.5 truncate">
                    {sectionName || "Section"} • {getScheduleTypeName(schedule)}
                  </div>

                  {/* subject code with subject name*/}
                  <div className="font-semibold text-sm sm:text-base leading-tight truncate">
                    {schedule.subjectCode && `${schedule.subjectCode} - `}{schedule.subjectName}
                  </div>

                  {/* room information */}
                  <div className="text-xs mt-0.5 truncate">
                    {schedule.roomName}
                  </div>

                  {/* time and total hours */}
                  {height >= 90 && (
                    <div className="flex justify-center items-center gap-1 mt-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{totalHours}</span>
                    </div>
                  )}

                  {/* instructor - only show if enough space */}
                  {height >= 120 && (
                    <div className="truncate text-xs mt-1 italic">
                      {schedule.instructorName}
                    </div>
                  )}
                </div>
              );
            })}

            {/* empty state */}
            {daySchedules.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  No classes scheduled.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // week view calendar
  const renderWeekCalendar = () => {
    // state for tracking the current week offset (0 = current week)
    const [weekOffset, setWeekOffset] = useState(0);

    // calculate the start and end of the displayed week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // calculate the monday of this week (first day)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    // apply the week offset to show previous/next weeks
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);

    // calculate the dates for each weekday
    const weekDates = {};
    Object.keys(days).forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      weekDates[day] = date;
    });

    // get the iso week number
    const getWeekNumber = (date) => {
      // copy date to avoid modifying the original
      const targetDate = new Date(date);

      // iso week starts on monday
      const dayNum = targetDate.getUTCDay() || 7;
      targetDate.setUTCDate(targetDate.getUTCDate() + 4 - dayNum);

      // get first day of year
      const yearStart = new Date(Date.UTC(targetDate.getUTCFullYear(), 0, 1));

      // return the week number
      return Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7);
    };

    // get the week number
    const weekNumber = getWeekNumber(monday);

    // format month range if week spans multiple months
    const firstDay = monday;
    const lastDay = new Date(monday);
    lastDay.setDate(monday.getDate() + 6); // Adjust to include Sunday (now 6 days from Monday)

    const monthRange =
      firstDay.getMonth() !== lastDay.getMonth()
        ? `${monthNames[firstDay.getMonth()].substring(0, 3)}-${monthNames[
            lastDay.getMonth()
          ].substring(0, 3)}`
        : monthNames[firstDay.getMonth()].substring(0, 3);

    const yearText =
      firstDay.getFullYear() !== lastDay.getFullYear()
        ? `${firstDay.getFullYear()}-${lastDay.getFullYear()}`
        : firstDay.getFullYear();

    const handleTodayClick = () => {
      setWeekOffset(0);
    };

    const isCurrentWeek = weekOffset === 0;

    return (
      <div className="border rounded-lg mt-4 overflow-hidden">
        {/* calendar header with navigation */}
        <div className="flex justify-between items-center bg-secondary py-2 px-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-center">
            <div className="text-lg font-medium flex items-center justify-center gap-2">
              Week {weekNumber}
              {!isCurrentWeek && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs cursor-pointer"
                  onClick={handleTodayClick}
                >
                  Today
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {monthRange} {yearText}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* day headers */}
        <div className="grid grid-cols-8 bg-secondary/50 text-center py-2 border-b">
          {/* Time column header */}
          <div className="text-muted-foreground text-xs font-medium flex flex-col justify-center">
            <span>Time</span>
          </div>

          {Object.entries(days).map(([key, day]) => {
            const date = weekDates[key];
            const dateText = date.getDate();
            // Check if this date is today's date (regardless of week offset)
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            return (
              <div key={key} className="text-xs font-medium">
                <div>{day}</div>
                <div
                  className={`mt-1 text-[11px] ${
                    isToday
                      ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                      : ""
                  }`}
                >
                  {dateText}
                </div>
              </div>
            );
          })}
        </div>

        {/* calendar grid */}
        <div className="grid grid-cols-8 relative">
          {/* time labels column */}
          <div className="border-r relative">
            {timeSlots.map((time, index) => (
              <div
                key={index}
                className={`h-[60px] px-2 text-xs flex items-center justify-center text-muted-foreground
                ${index !== 0 ? "border-t" : ""}`}
              >
                {time}
              </div>
            ))}
          </div>

          {/* day columns */}
          {Object.entries(days).map(([dayKey, dayName]) => {
            const daySchedules = schedulesByDay[dayKey] || [];
            // check if this date is today's date (regardless of week offset)
            const currentDate = weekDates[dayKey];
            const isToday =
              currentDate.getDate() === today.getDate() &&
              currentDate.getMonth() === today.getMonth() &&
              currentDate.getFullYear() === today.getFullYear();

            return (
              <div
                key={dayKey}
                className={`relative border-r min-h-full ${
                  isToday ? "bg-muted/10" : ""
                }`}
              >
                {/* time slot gridlines */}
                {timeSlots.map((_, index) => (
                  <div
                    key={index}
                    className={`h-[60px] ${index !== 0 ? "border-t" : ""}`}
                  />
                ))}

                {/* schedule items */}
                {daySchedules.map((schedule) =>
                  renderScheduleItem(schedule, dayKey)
                )}

                {/* empty state */}
                {daySchedules.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
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

  // month view calendar
  const renderMonthCalendar = () => {
    const monthDays = getDaysInMonth(currentYear, currentMonth);

    // Day headers (Mon, Tue, Wed, etc.)
    const dayHeaders = Object.values(days).map((day) => day.substring(0, 3));

    // Get today's date for highlighting the current day
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonthNow = today.getMonth();
    const currentYearNow = today.getFullYear();

    const handleTodayClick = () => {
      setCurrentMonth(currentMonthNow);
      setCurrentYear(currentYearNow);
    };

    const isCurrentMonth =
      currentMonth === currentMonthNow && currentYear === currentYearNow;

    return (
      <div className="border rounded-lg mt-4 overflow-hidden">
        {/* month navigation */}
        <div className="flex justify-between items-center bg-secondary px-4 py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-center">
            <div className="text-lg font-medium flex items-center justify-center gap-2">
              {monthNames[currentMonth]} {currentYear}
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs cursor-pointer"
                  onClick={handleTodayClick}
                >
                  Today
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
            }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* day headers */}
        <div className="grid grid-cols-7 bg-muted/30 text-center py-2 border-b">
          {dayHeaders.map((day, index) => (
            <div key={index} className="text-xs font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* calendar grid */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, index) => {
            const daySchedules = day.date ? getDaySchedules(day.date) : [];
            const hasSchedules = daySchedules.length > 0;

            // check if this day is today
            const isToday =
              day.isCurrentMonth &&
              day.date === currentDate &&
              currentMonth === currentMonthNow &&
              currentYear === currentYearNow;

            // determine if this day is in the past
            const isPastDay =
              currentYear < currentYearNow ||
              (currentYear === currentYearNow &&
                currentMonth < currentMonthNow) ||
              (currentYear === currentYearNow &&
                currentMonth === currentMonthNow &&
                day.date < currentDate);

            return (
              <div
                key={index}
                onClick={() => {
                  if (day.date) {
                    setSelectedDate({
                      day: day.date,
                      month: currentMonth,
                      year: currentYear,
                      schedules: daySchedules,
                    });
                    setShowDayDetail(true);
                  }
                }}
                className={`min-h-[120px] p-2 border-r border-b relative 
                ${!day.isCurrentMonth ? "bg-muted/10" : ""} 
                ${day.date ? "cursor-pointer hover:bg-muted/30" : ""}
                ${isToday ? "bg-primary/10" : ""}
              `}
              >
                {day.date && (
                  <>
                    <div className="flex justify-between items-center">
                      <div
                        className={`text-sm font-medium p-1.5 rounded-full w-7 h-7 flex items-center justify-center
                        ${isToday ? "bg-primary text-primary-foreground" : ""}
                        ${hasSchedules && !isToday ? "bg-secondary/60" : ""}
                        ${
                          isPastDay && !isToday ? "text-muted-foreground" : ""
                        }`}
                      >
                        {day.date}
                      </div>
                    </div>

                    {/* preview of schedules (up to 3) */}
                    <div className="mt-2 space-y-1.5">
                      {daySchedules.slice(0, 3).map((schedule, idx) => {
                        const { bg, text } = getScheduleColorClasses(schedule);

                        return (
                          <div
                            key={idx}
                            className={`text-[11px] truncate rounded px-1.5 py-1 
      ${isPastDay ? "bg-muted/50 text-muted-foreground" : `${bg} ${text}`}`}
                          >
                            {/* subject code with subject name */}
                            <div className="font-medium truncate">
                              {schedule.subjectCode ? `${schedule.subjectCode} - ${schedule.subjectName}` : schedule.subjectName}
                            </div>
                            <div className="text-[10px] opacity-80 truncate">
                              {formatScheduleTime(schedule)}
                            </div>
                          </div>
                        );
                      })}

                      {/* Show indicator for more schedules */}
                      {daySchedules.length > 3 && (
                        <div className="text-[10px] text-center text-muted-foreground font-medium pt-0.5">
                          +{daySchedules.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // schedule content
  const renderScheduleContent = () => {
    if (canAddSchedule) {
      if (scheduleData.length > 0) {
        return (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Class Schedule
              </h2>
            </div>

            <div className="flex flex-col space-y-4">
              {/* search and view controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subjects, instructors, or rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full sm:w-[300px]"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full cursor-pointer rounded-full"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground mr-2">
                    <Badge className="text-md font-normal">
                      Showing {scheduleData.length} schedules
                    </Badge>
                  </div>
                </div>
              </div>

              {/* class information */}
              <Card className="bg-secondary px-4 py-3 sm:p-4 flex text-md sm:text-base">
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{departmentName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="font-medium">{courseName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year Level</p>
                    <p className="font-medium">{yearLevelValue || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Section</p>
                    <p className="font-medium">{sectionName || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* schedule list */}
              {/* <ScheduleList
                scheduleData={scheduleData}
                searchQuery={searchQuery}
                handleScheduleClick={handleScheduleClick}
                formatScheduleTime={formatScheduleTime}
              /> */}

              {/* calendar view switcher and addschedulemodal buttons */}
              <Tabs defaultValue="week" className="w-full">
                <div className="flex flex-row sm:flex-row justify-between items-center">
                  <AddScheduleModal
                    onScheduleAdded={onAddSchedule}
                    departmentId={selectedDepartment}
                    courseId={selectedCourse}
                    yearLevel={selectedYearLevel}
                    sectionId={selectedSection}
                    activeSession={activeSession}
                    canAddSchedule={canAddSchedule}
                    existingSchedules={scheduleData}
                    activeDay="monday"
                  />
                  <TabsList className="sm:grid-auto grid grid-cols-3">
                    <TabsTrigger
                      value="day"
                      className="flex items-center justify-center cursor-pointer gap-1"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Day
                    </TabsTrigger>
                    <TabsTrigger
                      value="week"
                      className="flex items-center justify-center cursor-pointer gap-1"
                    >
                      <CalendarRange className="h-4 w-4" />
                      Week
                    </TabsTrigger>
                    <TabsTrigger
                      value="month"
                      className="flex items-center justify-center cursor-pointer gap-1"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Month
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="day">{renderDayCalendar()}</TabsContent>
                <TabsContent value="week">{renderWeekCalendar()}</TabsContent>
                <TabsContent value="month">{renderMonthCalendar()}</TabsContent>
              </Tabs>
            </div>
          </>
        );
      } else if (loading) {
        return (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-2">
              <div className="h-12 w-12 rounded-full border-4 border-t-primary animate-spin"></div>
              <p className="text-lg font-medium">Loading schedules...</p>
            </CardContent>
          </Card>
        );
      } else {
        return (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-2">
              <CalendarDays className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No schedules found.</p>
              <p className="text-sm text-muted-foreground">
                Click "Add Schedule" to get started.
              </p>
            </CardContent>
          </Card>
        );
      }
    } else {
      return (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-2">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No filters selected</p>
            <p className="text-center text-muted-foreground">
              Please select department, course, year level, and section to view
              or create schedules.
            </p>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <>
      {/* content display */}
      {renderScheduleContent()}

      {/* detail view side sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col max-w-[250]">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold">
              Schedule Details
            </SheetTitle>
            <SheetDescription>View and manage this schedule</SheetDescription>
          </SheetHeader>

          {/* schedule details */}
          {selectedSchedule && (
            <div className="space-y-6 py-6 p-4">
              <div className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {getScheduleTypeName(selectedSchedule)}
                    </Badge>
                    <h3 className="font-semibold text-2xl mb-1">
                      {selectedSchedule.subjectCode} | {selectedSchedule.subjectName}
                    </h3>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      getScheduleColorClasses(selectedSchedule).bg
                    }`}
                  ></div>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatScheduleTime(selectedSchedule)}
                  </span>
                  <span className="text-muted-foreground">
                    ({calculateTotalHours(selectedSchedule)} total)
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Room
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{selectedSchedule.roomName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Instructor
                    </p>
                    <p className="font-medium">
                      {selectedSchedule.instructorName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Day
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSchedule.days &&
                        selectedSchedule.days.map((day) => (
                          <Badge
                            key={day}
                            variant="secondary"
                            className="capitalize"
                          >
                            {day}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4 p-4">
                {/* grouped academic details */}
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Department
                      </p>
                      <p className="font-medium truncate">{departmentName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Course
                      </p>
                      <p className="font-medium truncate">{courseName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Year Level
                      </p>
                      <p className="font-medium">{yearLevelValue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Section
                      </p>
                      <p className="font-medium">{sectionName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="pt-2 flex-shrink-0">
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={handleEditClick}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setShowDetails(false)}
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* modal for month view */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                `${monthNames[selectedDate.month]} ${selectedDate.day}, ${
                  selectedDate.year
                }`}
            </DialogTitle>
            <DialogDescription>
              All scheduled classes for this day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedDate?.schedules?.length > 0 ? (
              selectedDate.schedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="cursor-pointer hover:bg-muted/20"
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setShowDayDetail(false);
                    setShowDetails(true);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {getScheduleTypeName(schedule)}
                        </Badge>
                        <h4 className="font-medium">
                          {schedule.subjectCode ? `${schedule.subjectCode} - ${schedule.subjectName}` : schedule.subjectName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatScheduleTime(schedule)}
                        </p>
                        <p className="text-sm mt-1">
                          {schedule.instructorName}
                        </p>
                      </div>
                      <Badge>{schedule.roomName}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No classes scheduled for this day.
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="cursor-pointer">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit schedule modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-lg">
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
                      value={field.value || 
                        (selectedSchedule?.isLabComponent === true || 
                        selectedSchedule?.scheduleType === "LABORATORY" || 
                        selectedSchedule?.roomType === "laboratory") ? "laboratory" : "lecture"}
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

            {/* Time Selection */}
            <div className="space-y-2 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
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
                                    form.watch("startPeriod") === "PM" &&
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
                                const hourNum = parseInt(
                                  form.watch("startHour")
                                );
                                if (hourNum > 8) {
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
                                    form.watch("endPeriod") === "PM" && hour > 8
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
                              // Adjust hour and minute when switching to PM
                              if (value === "PM") {
                                const hourNum = parseInt(form.watch("endHour"));
                                if (hourNum > 8) {
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
                Note: End time cannot be later than 8:30 PM
              </p>
            </div>

            {/* Days Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Days <span className="text-destructive">*</span>
                </label>
                {form.formState.errors.days && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.days.message}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                {Object.entries(days).map(([value, label]) => (
                  <Controller
                    key={value}
                    control={form.control}
                    name="days"
                    render={({ field }) => {
                      return (
                        <div
                          key={value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={field.value?.includes(value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, value])
                                : field.onChange(
                                    field.value?.filter(
                                      (item) => item !== value
                                    )
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem
                            key={`subject-${subject.id}`}
                            value={subject.name}
                          >
                            {subject.code
                              ? `${subject.code} - ${subject.name}`
                              : subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={`room-${room.id}`} value={room.name}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem
                          key={`instructor-${instructor.id}`}
                          value={instructor.name}
                        >
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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

            <DialogFooter>
              <Button
                variant="ghost"
                type="button"
                className="cursor-pointer"
                onClick={() => setShowEditModal(false)}
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

      {/* delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="font-medium">{selectedSchedule.subjectName}</p>
              <p className="text-sm text-muted-foreground">
                {formatScheduleTime(selectedSchedule)}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedSchedule.days &&
                  selectedSchedule.days.map((day) => (
                    <Badge key={day} variant="outline" className="capitalize">
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="cursor-pointer"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
