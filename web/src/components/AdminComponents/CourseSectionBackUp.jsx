import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ChevronDown,
  Columns2,
  Search,
  UsersRound,
  SquarePen,
  X,
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const createColumns = (handleOpenModal) => [
  // student no. column
  {
    id: "Student No.",
    header: <div className="ml-4">Student No.</div>,
    cell: ({ row }) => {
      const studentNo = row.original.studentNumber;
      return <div className="ml-4 capitalize">{studentNo || "N/A"}</div>;
    },
  },
  // name column
  {
    id: "name",
    accessorFn: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="mr-12"
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const firstName = row.original.firstName || "";
      const lastName = row.original.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return <div className="ml-3 capitalize">{fullName || "N/A"}</div>;
    },
  },
  // email column
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="lowercase ml-3">{row.getValue("email")}</div>
    ),
  },

  // year level column
  {
    id: "Year Level",
    accessorKey: "yearLevel",
    header: "Year Level",
    cell: ({ row }) => <div>{row.getValue("Year Level") || "N/A"}</div>,
  },
  // course column
  {
    accessorKey: "course",
    header: "Course",
    cell: ({ row }) => <div>{row.getValue("course") || "N/A"}</div>,
  },
  // section column
  {
    accessorKey: "section",
    header: "Section",
    cell: ({ row }) => <div>{row.getValue("section") || "N/A"}</div>,
  },
  // status column
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") || "active";
      const isActive = status === "active";
      return (
        <Badge
          variant={isActive ? "default" : "destructive"}
          className={
            isActive ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  // actions column
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <Button
          onClick={() => handleOpenModal(student)}
          size="sm"
          className="cursor-pointer"
        >
          <SquarePen />
          Assign
        </Button>
      );
    },
  },
];

export default function CourseSectionTable() {
  // Student management state
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    course: "",
    yearLevel: "",
    section: "",
  });

  // Course and section management state
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState({});
  const [yearLevels, setYearLevels] = useState([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [courseData, setCourseData] = useState({ name: "", code: "" });
  const [sectionData, setSectionData] = useState({
    name: "",
    courseId: "",
    yearLevel: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [currentSectionId, setCurrentSectionId] = useState(null);

  // Bulk assignment state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkAssignmentData, setBulkAssignmentData] = useState({
    course: "",
    yearLevel: "",
    section: "",
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsWithoutCourse: 0,
    courseDistribution: {},
  });

  // Filter state
  const [courseFilter, setCourseFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  // Table state
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Fetch students from Firebase
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const studentsCollectionRef = collection(db, "users/student/accounts");
      const data = await getDocs(studentsCollectionRef);
      const studentData = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentData);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch student data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch courses, sections, and year levels
  const fetchCourseAndSectionData = useCallback(async () => {
    try {
      // Fetch courses
      const coursesRef = collection(db, "courses");
      const coursesSnapshot = await getDocs(coursesRef);
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);

      // Fetch sections per course
      const sectionsRef = collection(db, "sections");
      const sectionsSnapshot = await getDocs(sectionsRef);
      const sectionsData = {};

      sectionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.courseId) {
          if (!sectionsData[data.courseId]) {
            sectionsData[data.courseId] = [];
          }
          sectionsData[data.courseId].push({
            id: doc.id,
            ...data,
          });
        }
      });
      setSections(sectionsData);

      // Fetch year levels from Firestore
      const yearLevelsRef = collection(db, "year_levels");
      const yearLevelsSnapshot = await getDocs(yearLevelsRef);
      if (yearLevelsSnapshot.empty) {
        // If no year levels found, set default values
        setYearLevels(["1st Year", "2nd Year", "3rd Year", "4th Year"]);
      } else {
        const yearLevelsData = yearLevelsSnapshot.docs.map(
          (doc) => doc.data().yearLevelName
        );
        setYearLevels(yearLevelsData);
      }
    } catch (error) {
      console.error("Error fetching course and section data:", error);
      toast.error("Failed to load course and section data");
    }
  }, []);

  // Calculate statistics from student data
  const calculateStats = useCallback((studentData) => {
    const total = studentData.length;
    const withoutCourse = studentData.filter((s) => !s.course).length;

    const distribution = {};
    studentData.forEach((student) => {
      if (student.course) {
        if (!distribution[student.course]) {
          distribution[student.course] = {
            total: 0,
            byYearLevel: {},
            bySection: {},
          };
        }

        distribution[student.course].total += 1;

        if (student.yearLevel) {
          if (!distribution[student.course].byYearLevel[student.yearLevel]) {
            distribution[student.course].byYearLevel[student.yearLevel] = 0;
          }
          distribution[student.course].byYearLevel[student.yearLevel] += 1;
        }

        if (student.section) {
          if (!distribution[student.course].bySection[student.section]) {
            distribution[student.course].bySection[student.section] = 0;
          }
          distribution[student.course].bySection[student.section] += 1;
        }
      }
    });

    setStats({
      totalStudents: total,
      studentsWithoutCourse: withoutCourse,
      courseDistribution: distribution,
    });
  }, []);

  // Fetch data on initial load
  useEffect(() => {
    fetchStudents();
    fetchCourseAndSectionData();
  }, [fetchStudents, fetchCourseAndSectionData]);

  // Update statistics when student data changes
  useEffect(() => {
    if (students.length > 0) {
      calculateStats(students);
    }
  }, [students, calculateStats]);

  // Set selectedStudents whenever rowSelection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection);
    const selectedStudentData = selectedIds
      .map((id) => students[parseInt(id)])
      .filter(Boolean);
    setSelectedStudents(selectedStudentData);
  }, [rowSelection, students]);

  // Dialog open handlers
  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setAssignmentData({
      course: student.course || "",
      yearLevel: student.yearLevel || "",
      section: student.section || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenCourseModal = (course = null) => {
    if (course) {
      setCourseData({
        name: course.name || "",
        code: course.code || "",
      });
      setEditMode(true);
      setCurrentCourseId(course.id);
    } else {
      setCourseData({ name: "", code: "" });
      setEditMode(false);
      setCurrentCourseId(null);
    }
    setIsCourseModalOpen(true);
  };

  const handleOpenSectionModal = (section = null) => {
    if (section) {
      setSectionData({
        name: section.name || "",
        courseId: section.courseId || "",
        yearLevel: section.yearLevel || "",
      });
      setEditMode(true);
      setCurrentSectionId(section.id);
    } else {
      setSectionData({ name: "", courseId: "", yearLevel: "" });
      setEditMode(false);
      setCurrentSectionId(null);
    }
    setIsSectionModalOpen(true);
  };

  const handleOpenBulkAssignModal = () => {
    setBulkAssignmentData({
      course: "",
      yearLevel: "",
      section: "",
    });
    setBulkAssignModalOpen(true);
  };

  // Form handlers
  const handleSelectChange = (id, value) => {
    setAssignmentData((prev) => ({ ...prev, [id]: value }));
  };

  const handleBulkSelectChange = (id, value) => {
    setBulkAssignmentData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionInputChange = (e) => {
    const { name, value } = e.target;
    setSectionData((prev) => ({ ...prev, [name]: value }));
  };

  // Firebase operations
  const handleAssign = async () => {
    if (!selectedStudent) return;

    try {
      const studentDocRef = doc(
        db,
        "users/student/accounts",
        selectedStudent.id
      );
      await updateDoc(studentDocRef, {
        course: assignmentData.course,
        yearLevel: assignmentData.yearLevel,
        section: assignmentData.section,
      });

      toast.success(
        `Successfully assigned ${selectedStudent.firstName} ${selectedStudent.lastName}.`
      );
      setIsModalOpen(false);
      setSelectedStudent(null);
      fetchStudents(); // Refresh data
    } catch (error) {
      console.error("Error assigning student:", error);
      toast.error("Failed to assign student. Please try again.");
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error("No students selected for bulk assignment");
      return;
    }

    try {
      const batch = writeBatch(db);

      selectedStudents.forEach((student) => {
        const studentRef = doc(db, "users/student/accounts", student.id);
        batch.update(studentRef, {
          course: bulkAssignmentData.course,
          yearLevel: bulkAssignmentData.yearLevel,
          section: bulkAssignmentData.section,
        });
      });

      await batch.commit();

      toast.success(
        `Successfully assigned ${selectedStudents.length} students.`
      );
      setBulkAssignModalOpen(false);
      setRowSelection({});
      fetchStudents(); // Refresh data
    } catch (error) {
      console.error("Error bulk assigning students:", error);
      toast.error("Failed to assign students. Please try again.");
    }
  };

  const saveCourse = async () => {
    if (!courseData.name || !courseData.code) {
      toast.error("Please fill in all course fields");
      return;
    }

    try {
      if (editMode && currentCourseId) {
        // Update existing course
        const courseRef = doc(db, "courses", currentCourseId);
        await updateDoc(courseRef, courseData);
        toast.success("Course updated successfully");
      } else {
        // Add new course
        const coursesRef = collection(db, "courses");
        await addDoc(coursesRef, courseData);
        toast.success("Course added successfully");
      }
      setIsCourseModalOpen(false);
      fetchCourseAndSectionData();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    }
  };

  const saveSection = async () => {
    if (!sectionData.name || !sectionData.courseId || !sectionData.yearLevel) {
      toast.error("Please fill in all section fields");
      return;
    }

    try {
      if (editMode && currentSectionId) {
        // Update existing section
        const sectionRef = doc(db, "sections", currentSectionId);
        await updateDoc(sectionRef, sectionData);
        toast.success("Section updated successfully");
      } else {
        // Add new section
        const sectionsRef = collection(db, "sections");
        await addDoc(sectionsRef, sectionData);
        toast.success("Section added successfully");
      }
      setIsSectionModalOpen(false);
      fetchCourseAndSectionData();
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Failed to save section");
    }
  };

  // Export students data to CSV
  const exportStudentsToCSV = () => {
    // Convert student data to CSV format
    const headers = [
      "Student No.",
      "Name",
      "Email",
      "Course",
      "Year Level",
      "Section",
      "Status",
    ];
    let csvContent = headers.join(",") + "\n";

    students.forEach((student) => {
      const row = [
        student.studentNumber || "",
        `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        student.email || "",
        student.course || "",
        student.yearLevel || "",
        student.section || "",
        student.status || "active",
      ];
      csvContent += row.join(",") + "\n";
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "students_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Student data exported to CSV");
  };

 // Pre-filter data before passing it to the table
  const filteredData = useMemo(() => {
    return students.filter((student) => {
      if (courseFilter && student.course !== courseFilter) {
        return false;
      }
      if (yearLevelFilter && student.yearLevel !== yearLevelFilter) {
        return false;
      }
      if (sectionFilter && student.section !== sectionFilter) {
        return false;
      }
      return true;
    });
  }, [students, courseFilter, yearLevelFilter, sectionFilter]);

  // Create table with columns
  const columns = createColumns(handleOpenModal);
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Main UI
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Course and Section</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportStudentsToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleOpenCourseModal()}>
                Add Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenSectionModal()}>
                Add Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.studentsWithoutCourse} students without course assignment
            </p>
          </CardContent>
        </Card>

        {Object.entries(stats.courseDistribution)
          .slice(0, 2)
          .map(([course, data]) => (
            <Card key={course}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{course}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total} students</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Object.entries(data.byYearLevel).map(
                    ([yearLevel, count]) => (
                      <span key={yearLevel} className="mr-2">
                        {yearLevel}: {count}
                      </span>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Course and Section Distribution Details */}
      <Tabs defaultValue="students" className="mb-6">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="distribution">Course Distribution</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          {/* Student management content stays here */}
        </TabsContent>
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.courseDistribution).map(([course, data]) => (
              <div key={course} className="p-4 border rounded-md shadow-sm">
                <h3 className="font-bold">{course}</h3>
                <p>Total students: {data.total}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">By Year Level:</p>
                  <ul className="text-sm">
                    {Object.entries(data.byYearLevel).map(
                      ([yearLevel, count]) => (
                        <li key={yearLevel}>
                          {yearLevel}: {count} students
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">By Section:</p>
                  <ul className="text-sm">
                    {Object.entries(data.bySection).map(([section, count]) => (
                      <li key={section}>
                        Section {section}: {count} students
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2 py-4">
        {/* Bulk Actions */}
        {selectedStudents.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenBulkAssignModal}
            className="mr-2"
          >
            <Users className="mr-2 h-4 w-4" />
            Bulk Assign ({selectedStudents.length})
          </Button>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={courses}>All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.code}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Year Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={yearLevels}>All Year Levels</SelectItem>
                {yearLevels.map((yearLevel, index) => (
                  <SelectItem key={index} value={yearLevel}>
                    {yearLevel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={sections}>All Sections</SelectItem>
                {/* Flatten all sections */}
                {Object.values(sections)
                  .flat()
                  .map((section) => (
                    <SelectItem key={section.id} value={section.name}>
                      Section {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student no..."
            value={table.getColumn("Student No.")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("Student No.")?.setFilterValue(event.target.value)
            }
            className="pl-10 max-w-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {table.getColumn("Student No.")?.getFilterValue() && (
              <button
                onClick={() =>
                  table.getColumn("Student No.")?.setFilterValue("")
                }
                className="p-1 mr-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4 text-primary" />
              </button>
            )}
          </div>
        </div>

        {/* filter columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 cursor-pointer">
              <Columns2 /> Filter Columns
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    const newSelection = { ...rowSelection };
                    newSelection[row.id] = !rowSelection[row.id];
                    setRowSelection(newSelection);
                  }}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full ">
                      <UsersRound className="h-12 w-12 " />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        Try adjusting your search or filters to find students.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        {/* rows per page */}
        <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-18 cursor-pointer"
                id="rows-per-page"
              >
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* pagination */}
          <Pagination className="flex items-center">
            <PaginationContent className="flex flex-wrap justify-center gap-1">
              <PaginationItem>
                <PaginationFirst
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {table.getPageCount() > 0 && (
                <>
                  {/* compact pagination on smaller screens */}
                  <div className="hidden xs:flex items-center">
                    {/* first page */}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => table.setPageIndex(0)}
                        isActive={table.getState().pagination.pageIndex === 0}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {/* show ellipsis if currentPage > 3 */}
                    {table.getState().pagination.pageIndex > 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* pages around current page */}
                    {Array.from({ length: table.getPageCount() }, (_, i) => {
                      // show current page and 1 page before/after
                      if (
                        i > 0 &&
                        i < table.getPageCount() - 1 &&
                        Math.abs(i - table.getState().pagination.pageIndex) <= 1
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => table.setPageIndex(i)}
                              isActive={
                                table.getState().pagination.pageIndex === i
                              }
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    {/* show ellipsis if currentPage < lastPage - 2 */}
                    {table.getState().pagination.pageIndex <
                      table.getPageCount() - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* last page */}
                    {table.getPageCount() > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                          }
                          isActive={
                            table.getState().pagination.pageIndex ===
                            table.getPageCount() - 1
                          }
                          className="cursor-pointer"
                        >
                          {table.getPageCount()}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                  </div>

                  {/* page indicator */}
                  <div className="flex items-center">
                    <Label className="text-sm font-medium mx-1">
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()}
                    </Label>
                  </div>
                </>
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLast
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Single Student Assignment Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedStudent && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Assign Course and Section to {selectedStudent.firstName}{" "}
                {selectedStudent.lastName}
              </DialogTitle>
              <DialogDescription>
                Please select the course, year level, and section for this
                student.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course" className="text-right">
                  Course
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange("course", value)}
                  defaultValue={assignmentData.course}
                >
                  <SelectTrigger id="course" className="col-span-3 w-full">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.code}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="yearLevel" className="text-right">
                  Year Level
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("yearLevel", value)
                  }
                  defaultValue={assignmentData.yearLevel}
                >
                  <SelectTrigger id="yearLevel" className="col-span-3 w-full">
                    <SelectValue placeholder="Select Year Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearLevels.map((yearLevel, index) => (
                      <SelectItem key={index} value={yearLevel}>
                        {yearLevel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section" className="text-right">
                  Section
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("section", value)
                  }
                  defaultValue={assignmentData.section}
                >
                  <SelectTrigger id="section" className="col-span-3 w-full">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Filter sections based on selected course */}
                    {assignmentData.course && sections[assignmentData.course]
                      ? sections[assignmentData.course]
                          .filter(
                            (section) =>
                              !assignmentData.yearLevel ||
                              section.yearLevel === assignmentData.yearLevel
                          )
                          .map((section) => (
                            <SelectItem key={section.id} value={section.name}>
                              Section {section.name}
                            </SelectItem>
                          ))
                      : Object.values(sections)
                          .flat()
                          .map((section) => (
                            <SelectItem key={section.id} value={section.name}>
                              Section {section.name}
                            </SelectItem>
                          ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleAssign}>Save</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignModalOpen} onOpenChange={setBulkAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk Assign Students ({selectedStudents.length})
            </DialogTitle>
            <DialogDescription>
              Assign course, year level, and section to{" "}
              {selectedStudents.length} selected students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkCourse" className="text-right">
                Course
              </Label>
              <Select
                onValueChange={(value) =>
                  handleBulkSelectChange("course", value)
                }
                value={bulkAssignmentData.course}
              >
                <SelectTrigger id="bulkCourse" className="col-span-3 w-full">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.code}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkYearLevel" className="text-right">
                Year Level
              </Label>
              <Select
                onValueChange={(value) =>
                  handleBulkSelectChange("yearLevel", value)
                }
                value={bulkAssignmentData.yearLevel}
              >
                <SelectTrigger id="bulkYearLevel" className="col-span-3 w-full">
                  <SelectValue placeholder="Select Year Level" />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels.map((yearLevel, index) => (
                    <SelectItem key={index} value={yearLevel}>
                      {yearLevel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkSection" className="text-right">
                Section
              </Label>
              <Select
                onValueChange={(value) =>
                  handleBulkSelectChange("section", value)
                }
                value={bulkAssignmentData.section}
              >
                <SelectTrigger id="bulkSection" className="col-span-3 w-full">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {/* Filter sections based on selected course */}
                  {bulkAssignmentData.course &&
                  sections[bulkAssignmentData.course]
                    ? sections[bulkAssignmentData.course]
                        .filter(
                          (section) =>
                            !bulkAssignmentData.yearLevel ||
                            section.yearLevel === bulkAssignmentData.yearLevel
                        )
                        .map((section) => (
                          <SelectItem key={section.id} value={section.name}>
                            Section {section.name}
                          </SelectItem>
                        ))
                    : Object.values(sections)
                        .flat()
                        .map((section) => (
                          <SelectItem key={section.id} value={section.name}>
                            Section {section.name}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleBulkAssign}>
              Assign to {selectedStudents.length} Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Management Dialog */}
      <Dialog open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              Enter the course details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseName" className="text-right">
                Course Name
              </Label>
              <Input
                id="courseName"
                name="name"
                value={courseData.name}
                onChange={handleCourseInputChange}
                className="col-span-3"
                placeholder="Bachelor of Science in Information Technology"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode" className="text-right">
                Course Code
              </Label>
              <Input
                id="courseCode"
                name="code"
                value={courseData.code}
                onChange={handleCourseInputChange}
                className="col-span-3"
                placeholder="BSIT"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={saveCourse}>{editMode ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Management Dialog */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Section" : "Add New Section"}
            </DialogTitle>
            <DialogDescription>
              Enter the section details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionName" className="text-right">
                Section Name
              </Label>
              <Input
                id="sectionName"
                name="name"
                value={sectionData.name}
                onChange={handleSectionInputChange}
                className="col-span-3"
                placeholder="A"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionCourse" className="text-right">
                Course
              </Label>
              <Select
                onValueChange={(value) =>
                  setSectionData((prev) => ({ ...prev, courseId: value }))
                }
                value={sectionData.courseId}
              >
                <SelectTrigger id="sectionCourse" className="col-span-3 w-full">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.code}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionYearLevel" className="text-right">
                Year Level
              </Label>
              <Select
                onValueChange={(value) =>
                  setSectionData((prev) => ({ ...prev, yearLevel: value }))
                }
                value={sectionData.yearLevel}
              >
                <SelectTrigger
                  id="sectionYearLevel"
                  className="col-span-3 w-full"
                >
                  <SelectValue placeholder="Select Year Level" />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels.map((yearLevel, index) => (
                    <SelectItem key={index} value={yearLevel}>
                      {yearLevel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={saveSection}>
              {editMode ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
