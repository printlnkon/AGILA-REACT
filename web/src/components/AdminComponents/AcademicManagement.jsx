import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";

// UI Components from shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons from lucide-react
import {
  Plus,
  LoaderCircle,
  Calendar as CalendarIcon,
  CircleAlert,
  Check,
  MoreHorizontal,
  Edit,
  Trash2,
  CalendarDays,
} from "lucide-react";

// The Main Combined Component
export default function AcademicManagement() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // For activating/deleting

  // State for Modals
  const [isAddAcadYearModalOpen, setAddAcadYearModalOpen] = useState(false);
  const [isAddSemesterModalOpen, setAddSemesterModalOpen] = useState(false);

  // State to track which academic year we are adding a semester to
  const [currentAcadYear, setCurrentAcadYear] = useState(null);

  // Fetch all academic years and their nested semesters
  const fetchAcademicData = useCallback(async () => {
    setLoading(true);
    try {
      const acadYearsColRef = collection(db, "academic_years");
      const q = query(acadYearsColRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const acadYearList = await Promise.all(
        querySnapshot.docs.map(async (acadDoc) => {
          const acadYearData = {
            id: acadDoc.id,
            ...acadDoc.data(),
            semesters: [],
          };

          // Fetch semesters for each academic year
          const semestersColRef = collection(
            db,
            "academic_years",
            acadDoc.id,
            "semesters"
          );
          const semestersQuery = query(
            semestersColRef,
            orderBy("createdAt", "asc")
          );
          const semesterSnapshot = await getDocs(semestersQuery);

          acadYearData.semesters = semesterSnapshot.docs.map((semDoc) => ({
            id: semDoc.id,
            ...semDoc.data(),
          }));

          // Sort semesters within the academic year (Active first)
          acadYearData.semesters.sort((a, b) => {
            if (a.status === "Active") return -1;
            if (b.status === "Active") return 1;
            return 0;
          });

          return acadYearData;
        })
      );

      // Sort academic years by status: Active > Upcoming > Archived
      acadYearList.sort((a, b) => {
        const statusOrder = { Active: 1, Upcoming: 2, Archived: 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      });

      setAcademicYears(acadYearList);
    } catch (error) {
      console.error("Error fetching academic data: ", error);
      toast.error("Failed to fetch academic data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // --- Handlers for Academic Years ---
  const handleAddAcademicYear = async (yearName) => {
    try {
      await addDoc(collection(db, "academic_years"), {
        acadYear: yearName,
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Academic Year "${yearName}" added successfully!`);
      fetchAcademicData();
      return true;
    } catch (error) {
      console.error("Error adding academic year: ", error);
      toast.error("Failed to add academic year.");
      return false;
    }
  };

  const handleSetActiveAcademicYear = async (acadYearToActivate) => {
    setActionLoading(acadYearToActivate.id);
    const batch = writeBatch(db);
    const acadYearsRef = collection(db, "academic_years");

    // find the current active year in the state
    const currentActiveYear = academicYears.find(
      (ay) => ay.status === "Active"
    );

    // if there is a currently active year, archive it and all its semesters
    if (currentActiveYear) {
      // archive the academic year itself
      const activeYearDocRef = doc(acadYearsRef, currentActiveYear.id);
      batch.update(activeYearDocRef, { status: "Archived" });

      // archive all semesters within that academic year
      if (
        currentActiveYear.semesters &&
        currentActiveYear.semesters.length > 0
      ) {
        toast.info(
          `Archiving all semesters for ${currentActiveYear.acadYear}.`
        );
        currentActiveYear.semesters.forEach((semester) => {
          const semesterDocRef = doc(
            db,
            "academic_years",
            currentActiveYear.id,
            "semesters",
            semester.id
          );
          // only archive semesters that aren't already archived.
          if (semester.status !== "Archived") {
            batch.update(semesterDocRef, { status: "Archived" });
          }
        });
      }
    }

    // Set the new academic year to Active
    const newActiveDocRef = doc(acadYearsRef, acadYearToActivate.id);
    batch.update(newActiveDocRef, { status: "Active" });

    try {
      await batch.commit();
      toast.success(
        `"${acadYearToActivate.acadYear}" is now the active academic year.`
      );
      fetchAcademicData(); // This will refresh the entire state from the database
    } catch (error) {
      console.error("Error setting active academic year: ", error);
      toast.error("Failed to set active academic year.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAcademicYear = async (acadYearToDelete) => {
    if (acadYearToDelete.status === "Active") {
      toast.error("Cannot delete an active academic year.");
      return;
    }
    const acadYearRef = doc(db, "academic_years", acadYearToDelete.id);
    try {
      await deleteDoc(acadYearRef);
      toast.success("Academic year deleted successfully.");
      fetchAcademicData();
    } catch (error) {
      toast.error("Failed to delete academic year.");
      console.error("Error deleting academic year:", error);
    }
  };

  // --- Handlers for Semesters ---
  const handleAddSemester = async (formData) => {
    if (!currentAcadYear) {
      toast.error("No academic year selected.");
      return false;
    }
    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        currentAcadYear.id,
        "semesters"
      );
      await addDoc(semestersColRef, {
        ...formData,
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(
        `Semester "${formData.semesterName}" added to ${currentAcadYear.acadYear}.`
      );
      fetchAcademicData();
      return true;
    } catch (error) {
      console.error("Error adding semester: ", error);
      toast.error("Failed to add semester.");
      return false;
    }
  };

  const handleSetActiveSemester = async (
    semesterToActivate,
    academicYearId
  ) => {
    setActionLoading(semesterToActivate.id);
    const batch = writeBatch(db);
    const semestersRef = collection(
      db,
      "academic_years",
      academicYearId,
      "semesters"
    );

    const academicYear = academicYears.find((ay) => ay.id === academicYearId);
    if (!academicYear) return;

    academicYear.semesters.forEach((sem) => {
      const semRef = doc(semestersRef, sem.id);
      if (sem.id === semesterToActivate.id) {
        batch.update(semRef, { status: "Active" });
      } else if (sem.status === "Active") {
        batch.update(semRef, { status: "Archived" });
      }
    });

    try {
      await batch.commit();
      toast.success(
        `"${semesterToActivate.semesterName}" is now the active semester.`
      );
      fetchAcademicData();
    } catch (error) {
      console.error("Error setting active semester:", error);
      toast.error("Failed to set active semester.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSemester = async (semesterToDelete, academicYearId) => {
    if (semesterToDelete.status === "Active") {
      toast.error("Cannot delete an active semester.");
      return;
    }
    const semRef = doc(
      db,
      "academic_years",
      academicYearId,
      "semesters",
      semesterToDelete.id
    );
    try {
      await deleteDoc(semRef);
      toast.success("Semester deleted successfully.");
      fetchAcademicData();
    } catch (error) {
      toast.error("Failed to delete semester.");
      console.error("Error deleting semester:", error);
    }
  };

  // --- Open Modal Handlers ---
  const openAddSemesterModal = (acadYear) => {
    setCurrentAcadYear(acadYear);
    setAddSemesterModalOpen(true);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Academic Management</h1>
          <p className="text-muted-foreground">
            Manage academic years and their corresponding semesters.
          </p>
        </div>
      </div>

      <div className="flex items-center py-4 gap-2">
        <AddAcademicYearModal
          onOpenChange={setAddAcadYearModalOpen}
          open={isAddAcadYearModalOpen}
          onAcademicYearAdded={handleAddAcademicYear}
          existingYears={academicYears.map((ay) => ay.acadYear)}
        />
      </div>

      {/* This modal is placed here but triggered from within the cards */}
      <AddSemesterModal
        open={isAddSemesterModalOpen}
        onOpenChange={setAddSemesterModalOpen}
        activeAcadYear={currentAcadYear}
        existingSemesters={currentAcadYear?.semesters || []}
        onSemesterAdded={handleAddSemester}
      />

      {/* Main Content Grid */}
      {academicYears.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {academicYears.map((acadYear) => (
            <AcademicYearCard
              key={acadYear.id}
              acadYear={acadYear}
              onSetActive={handleSetActiveAcademicYear}
              onDelete={handleDeleteAcademicYear}
              onAddSemesterClick={() => openAddSemesterModal(acadYear)}
              isActivating={actionLoading === acadYear.id}
            >
              {/* Nested Semesters */}
              {acadYear.semesters.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  {acadYear.semesters.map((semester) => (
                    <SemesterCard
                      key={semester.id}
                      semester={semester}
                      onSetActive={(sem) =>
                        handleSetActiveSemester(sem, acadYear.id)
                      }
                      onDelete={(sem) => handleDeleteSemester(sem, acadYear.id)}
                      isActivating={actionLoading === semester.id}
                      academicYearId={acadYear.id}
                      onDataRefresh={fetchAcademicData}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg mt-4">
                  <CalendarDays className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 font-semibold">No semesters found.</p>
                  <p>Click "Add Semester" to get started.</p>
                </div>
              )}
            </AcademicYearCard>
          ))}
        </div>
      ) : (
        <Card className="py-12 mt-4">
          <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No academic years found.</p>
            <p className="text-sm text-muted-foreground">
              Click "Add Academic Year" to create one.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Sub-components (Cards and Modals) ---

const getStatusConfig = (status) => {
  const config = {
    Active: "bg-green-600 text-white hover:bg-green-700",
    Archived: "bg-red-600 text-white hover:bg-red-700",
    Upcoming: "bg-blue-600 text-white hover:bg-blue-700",
  };
  return config[status] || "bg-gray-500 text-white";
};

const toDate = (timestamp) => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  // Add a day to correct for potential timezone issues if dates appear off by one.
  // date.setDate(date.getDate() + 1);
  return date;
};

// Card for a single Academic Year
const AcademicYearCard = ({
  acadYear,
  onSetActive,
  onDelete,
  onAddSemesterClick,
  isActivating,
  children,
}) => {
  const statusConfig = getStatusConfig(acadYear.status);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteClick = () => {
    onDelete(acadYear);
    setDeleteOpen(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{acadYear.acadYear}</CardTitle>
          <Badge className={statusConfig}>{acadYear.status}</Badge>
        </div>
        <CardDescription className="flex justify-between items-center pt-2">
          <span>
            Created:{" "}
            {acadYear.createdAt
              ? format(toDate(acadYear.createdAt), "MMMM d, yyyy")
              : "N/A"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isActivating}
              >
                {isActivating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {acadYear.status !== "Active" && (
                <DropdownMenuItem
                  onClick={() => onSetActive(acadYear)}
                  className="text-green-600 cursor-pointer focus:bg-green-50 focus:text-green-700"
                >
                  <Check className="mr-2 h-4 w-4" /> Set as Active
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                disabled={acadYear.status === "Active"}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Button onClick={onAddSemesterClick} className="w-full mb-4">
          <Plus className="mr-2 h-4 w-4" /> Add Semester
        </Button>
        {children} {/* This is where semester cards will be rendered */}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the academic year "
              <strong>{acadYear.acadYear}</strong>"? This will also delete all
              its semesters. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Card for a single Semester
const SemesterCard = ({
  semester,
  onSetActive,
  onDelete,
  isActivating,
  academicYearId,
  onDataRefresh,
}) => {
  const statusConfig = getStatusConfig(semester.status);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);

  const handleDeleteClick = () => {
    onDelete(semester);
    setDeleteOpen(false);
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{semester.semesterName}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isActivating}
              >
                {isActivating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {semester.status !== "Active" && (
                <DropdownMenuItem
                  onClick={() => onSetActive(semester)}
                  className="text-green-600 cursor-pointer focus:bg-green-50 focus:text-green-700"
                >
                  <Check className="mr-2 h-4 w-4" /> Set as Active
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setEditOpen(true)}
                className="text-blue-600 cursor-pointer focus:bg-blue-50 focus:text-blue-700"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                disabled={semester.status === "Active"}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          <Badge variant="default" className={statusConfig}>
            {semester.status}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start:</span>
            <span>{format(toDate(semester.startDate), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End:</span>
            <span>{format(toDate(semester.endDate), "MMM d, yyyy")}</span>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the semester "
              <strong>{semester.semesterName}</strong>"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              {" "}
              <Trash2 className="mr-2 h-4 w-4" /> Delete{" "}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Semester Dialog (logic needs to be implemented here) */}
      <EditSemesterDialog
        open={isEditOpen}
        onOpenChange={setEditOpen}
        semester={semester}
        academicYearId={academicYearId}
        onDataRefresh={onDataRefresh}
      />
    </Card>
  );
};

// Add Academic Year Modal
const AddAcademicYearModal = ({
  open,
  onOpenChange,
  onAcademicYearAdded,
  existingYears,
}) => {
  const [yearName, setYearName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yearName) {
      toast.error("Academic Year name is required.");
      return;
    }

    const yearFormat = /^S\.Y - \d{4}-\d{4}$/;
    if (!yearFormat.test(yearName)) {
      toast.error("Invalid format. Please use 'S.Y - YYYY-YYYY'.");
      return;
    }

    if (existingYears.includes(yearName)) {
      toast.error("This academic year already exists.");
      return;
    }

    setLoading(true);
    const success = await onAcademicYearAdded(yearName);
    setLoading(false);

    if (success) {
      setYearName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          {" "}
          <Plus className="mr-2 h-4 w-4" /> Add Academic Year{" "}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Academic Year</DialogTitle>
          <DialogDescription>
            Create a new academic session. Example: S.Y - 2025-2026
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="yearName">Academic Year</Label>
            <Input
              id="yearName"
              value={yearName}
              onChange={(e) => setYearName(e.target.value)}
              placeholder="e.g., S.Y - 2025-2026"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <LoaderCircle className="animate-spin mr-2" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add Semester Modal
const AddSemesterModal = ({
  open,
  onOpenChange,
  activeAcadYear,
  onSemesterAdded,
  existingSemesters = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    semesterName: "",
    startDate: null,
    endDate: null,
  });

  const resetForm = useCallback(() => {
    setFormData({ semesterName: "", startDate: null, endDate: null });
    setIsSubmitting(false);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        resetForm();
      }
    },
    [onOpenChange, resetForm]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.semesterName || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all fields.");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after the start date.");
      return;
    }
    if (
      existingSemesters.some(
        (sem) => sem.semesterName === formData.semesterName
      )
    ) {
      toast.error("This semester already exists in this academic year.");
      return;
    }

    setIsSubmitting(true);
    const success = await onSemesterAdded({
      semesterName: formData.semesterName,
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      endDate: format(formData.endDate, "yyyy-MM-dd"),
    });
    setIsSubmitting(false);

    if (success) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
          <DialogDescription>
            Add a new semester for{" "}
            {activeAcadYear ? (
              <strong>{activeAcadYear.acadYear}</strong>
            ) : (
              "the active academic year"
            )}
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Semester Name Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="semesterName" className="text-right">
              Semester
            </Label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, semesterName: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Semester">1st Semester</SelectItem>
                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                <SelectItem value="Mid-Year">Mid-Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 font-normal justify-start ${
                    !formData.startDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? (
                    format(formData.startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, startDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* End Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 font-normal justify-start ${
                    !formData.endDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endDate ? (
                    format(formData.endDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.endDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, endDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin mr-2" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Semester Dialog
const EditSemesterDialog = ({
  open,
  onOpenChange,
  semester,
  academicYearId,
  onDataRefresh,
}) => {
  const [editedData, setEditedData] = useState({
    semesterName: semester.semesterName,
    startDate: toDate(semester.startDate),
    endDate: toDate(semester.endDate),
  });
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSaveChanges = async () => {
    if (
      !editedData.semesterName ||
      !editedData.startDate ||
      !editedData.endDate
    ) {
      toast.error("Please fill all fields.");
      return;
    }
    if (new Date(editedData.startDate) >= new Date(editedData.endDate)) {
      toast.error("End date must be after the start date.");
      return;
    }
    setSubmitting(true);
    const semRef = doc(
      db,
      "academic_years",
      academicYearId,
      "semesters",
      semester.id
    );
    try {
      await updateDoc(semRef, {
        semesterName: editedData.semesterName,
        startDate: format(editedData.startDate, "yyyy-MM-dd"),
        endDate: format(editedData.endDate, "yyyy-MM-dd"),
        updatedAt: serverTimestamp(),
      });
      toast.success("Semester updated successfully!");
      onDataRefresh();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update semester.");
      console.error("Error updating semester: ", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Semester</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Semester Name Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="semesterName" className="text-right">
              Semester
            </Label>
            <Select
              value={editedData.semesterName}
              onValueChange={(value) =>
                setEditedData((prev) => ({ ...prev, semesterName: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Semester">1st Semester</SelectItem>
                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                <SelectItem value="Mid-Year">Mid-Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 font-normal justify-start ${
                    !editedData.startDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editedData.startDate ? (
                    format(editedData.startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={editedData.startDate}
                  onSelect={(date) =>
                    setEditedData((prev) => ({ ...prev, startDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* End Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 font-normal justify-start ${
                    !editedData.endDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editedData.endDate ? (
                    format(editedData.endDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={editedData.endDate}
                  onSelect={(date) =>
                    setEditedData((prev) => ({ ...prev, endDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin mr-2" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="w-full">
      <div className="mb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="flex items-center gap-2 py-4">
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-full mt-2" />
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
