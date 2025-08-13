import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { Search, X, Filter, BookOpen } from "lucide-react";
import AddSubjectModal from "@/components/AdminComponents/AddSubjectModal";
import SubjectCard from "@/components/AdminComponents/SubjectCard";

const INITIAL_SUBJECT_DATA = {
  subjectCode: "",
  subjectName: "",
  description: "",
  units: 0,
  department: "",
  departmentName: "",
  isActive: true,
};

export default function SubjectTable() {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // Get the active session from context
  const { activeSession } = useActiveSession();

  // Fetch subjects when component mounts and when activeSession changes
  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, [activeSession]);

  // Update filtered subjects when filters or subjects change
  useEffect(() => {
    filterSubjects();
  }, [subjects, searchTerm, departmentFilter, statusFilter]);

  // Mock function to fetch subjects - replace with actual API call
  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = [
        {
          id: "1",
          subjectCode: "CS101",
          subjectName: "Introduction to Computer Science",
          description: "Basic concepts in computer science and programming",
          units: 3,
          department: "1",
          departmentName: "Computer Science",
          isActive: true,
        },
        {
          id: "2",
          subjectCode: "MATH101",
          subjectName: "Calculus I",
          description: "Introduction to differential and integral calculus",
          units: 4,
          department: "2",
          departmentName: "Mathematics",
          isActive: true,
        },
        {
          id: "3",
          subjectCode: "ENG101",
          subjectName: "English Composition",
          description: "Fundamentals of written communication",
          units: 3,
          department: "3",
          departmentName: "English",
          isActive: false,
        },
        {
          id: "4",
          subjectCode: "PHY101",
          subjectName: "General Physics",
          description: "Basic principles of physics and mechanics",
          units: 4,
          department: "4",
          departmentName: "Physics",
          isActive: true,
        },
        {
          id: "5",
          subjectCode: "CHEM101",
          subjectName: "General Chemistry",
          description: "Introduction to chemical principles and applications",
          units: 3,
          department: "4",
          departmentName: "Physics",
          isActive: false,
        },
      ];

      setSubjects(data);
    } catch (err) {
      setError("Failed to fetch subjects");
      console.error("Error fetching subjects:", err);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects based on search term and filters
  const filterSubjects = () => {
    let filtered = [...subjects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (subject) =>
          subject.subjectName.toLowerCase().includes(term) ||
          subject.subjectCode.toLowerCase().includes(term) ||
          subject.description.toLowerCase().includes(term) ||
          subject.departmentName.toLowerCase().includes(term)
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(
        (subject) => subject.departmentName === departmentFilter
      );
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((subject) => subject.isActive === isActive);
    }

    setFilteredSubjects(filtered);
  };

  // Mock function to fetch departments - replace with actual API call
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const data = [
        { id: "1", departmentName: "Computer Science" },
        { id: "2", departmentName: "Mathematics" },
        { id: "3", departmentName: "English" },
        { id: "4", departmentName: "Physics" },
      ];

      setDepartments(data);
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to load departments");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Handle a subject update from SubjectCard
  const handleSubjectUpdated = (updatedSubject) => {
    setSubjects(
      subjects.map((subject) =>
        subject.id === updatedSubject.id ? updatedSubject : subject
      )
    );
  };

  // Handle a subject deletion from SubjectCard
  const handleSubjectDeleted = (deletedId) => {
    setSubjects(subjects.filter((subject) => subject.id !== deletedId));
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>

        <div className="flex items-center justify-between py-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="relative max-w-sm flex-1 h-9" />
          <Skeleton className="h-9 w-36 ml-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Error Loading Subjects
        </h2>
        <p className="mb-4">{error}</p>
        <Button onClick={fetchSubjects}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Subjects</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete subjects available in the system.
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 py-4">
        <AddSubjectModal
          isOpen={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubjectAdded={(newSubject) =>
            setSubjects([...subjects, newSubject])
          }
        />
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* search */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search subjects..."
              className="pl-8 w-full md:w-[300px] bg-white dark:bg-gray-950"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* clear button */}
            {searchTerm && (
              <Button
                variant="ghost"
                onClick={() => setSearchTerm("")}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {/* filter by department */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Department</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* filter by status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Status</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* subjects cards */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filteredSubjects.map((subject) => (
            <div key={subject.id} className="relative">
              <SubjectCard
                subject={subject}
                departments={departments}
                onSubjectUpdated={handleSubjectUpdated}
                onSubjectDeleted={handleSubjectDeleted}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium mb-2">No subjects found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || departmentFilter || statusFilter !== "all"
              ? "Try changing your search or filter criteria"
              : "Start by adding a new subject"}
          </p>
        </div>
      )}
    </div>
  );
}
