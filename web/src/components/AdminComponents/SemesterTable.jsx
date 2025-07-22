import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  AlertTriangle,
  Info,
} from "lucide-react";
import AddSemesterModal from "@/components/AdminComponents/AddSemesterModal";
import SemesterCard from "@/components/AdminComponents/SemesterCard";

export default function Semester() {
  const [activeAcadYear, setActiveAcadYear] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingSemesterId, setActivatingSemesterId] = useState(null);

  // Fetch active academic year and set loading state
  const fetchActiveAcademicYear = useCallback(async () => {
    try {
      const q = query(
        collection(db, "academic_years"),
        where("status", "==", "Active")
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const acadYearDoc = querySnapshot.docs[0];
        setActiveAcadYear({ id: acadYearDoc.id, ...acadYearDoc.data() });
        return true; // Return true if active year exists
      } else {
        setActiveAcadYear(null);
        toast.error(
          "No active academic year found. Please set one to manage semesters."
        );
        return false; // Return false if no active year
      }
    } catch (error) {
      console.error("Error fetching active academic year: ", error);
      toast.error("Failed to fetch active academic year.");
      return false;
    }
  }, []);

  // Fetch semesters for the active academic year
  const fetchSemesters = useCallback(async () => {
    if (!activeAcadYear) {
      setSemesters([]);
      setLoading(false);
      return;
    }

    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        activeAcadYear.id,
        "semesters"
      );
      const q = query(semestersColRef);
      const semesterSnapshot = await getDocs(q);
      const semesterList = semesterSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // active status stays on top
      semesterList.sort((a, b) => {
        if (a.status === "Active") return -1;
        if (b.status === "Active") return 1;
        return 0;
      });

      setSemesters(semesterList);
    } catch (error) {
      console.error("Error fetching semesters: ", error);
      toast.error("Failed to fetch semesters.");
    } finally {
      setLoading(false);
    }
  }, [activeAcadYear]);

  // Load data in sequence to improve UX
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const hasActiveYear = await fetchActiveAcademicYear();

      // If we have an active year, fetchSemesters will be triggered by its own useEffect
      // If not, we should set loading to false here
      if (!hasActiveYear) {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchActiveAcademicYear]);

  // Fetch semesters whenever the active academic year changes
  useEffect(() => {
    if (activeAcadYear !== null) {
      fetchSemesters();
    }
  }, [fetchSemesters, activeAcadYear]);

  const handleSetStatus = async (semesterToActivate) => {
    if (!activeAcadYear) return;

    setActivatingSemesterId(semesterToActivate.id);
    const batch = writeBatch(db);
    semesters.forEach((sem) => {
      const semRef = doc(
        db,
        "academic_years",
        activeAcadYear.id,
        "semesters",
        sem.id
      );
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
      fetchSemesters(); // Refresh the list
    } catch (error) {
      console.error("Error updating semester status: ", error);
      toast.error("Failed to update semester status.");
    } finally {
      setActivatingSemesterId(null);
    }
  };

  const handleEditSemester = async (semesterToEdit, newData) => {
    if (!newData.semesterName || !newData.startDate || !newData.endDate) {
      toast.error("Please fill out all fields.");
      return;
    }

    if (new Date(newData.startDate) >= new Date(newData.endDate)) {
      toast.error("End date must be after the start date.");
      return;
    }

    const semRef = doc(
      db,
      "academic_years",
      activeAcadYear.id,
      "semesters",
      semesterToEdit.id
    );

    try {
      await updateDoc(semRef, {
        semesterName: newData.semesterName,
        startDate: newData.startDate,
        endDate: newData.endDate,
      });
      toast.success("Semester updated successfully.");
      fetchSemesters(); // Refresh the list
    } catch (error) {
      console.error("Error updating semester: ", error);
      toast.error("Failed to update semester.");
    }
  };

  const handleDeleteSemester = async (semesterToDelete) => {
    if (semesterToDelete.status === "Active") {
      toast.error("Cannot delete an active semester.");
      return;
    }

    const semRef = doc(
      db,
      "academic_years",
      activeAcadYear.id,
      "semesters",
      semesterToDelete.id
    );

    try {
      await deleteDoc(semRef);
      toast.success("Semester deleted successfully.");
      fetchSemesters();
    } catch (error) {
      console.error("Error deleting semester: ", error);
      toast.error("Failed to delete semester.");
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        {/* skeleton for year levels active session */}
        <div>
          <Skeleton className="h-18 w-full" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add user button */}
          <Skeleton className="h-9 w-28" />
        </div>

        {/* skeleton for cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-4 w-16 mt-1" />
                <div className="space-y-2 pt-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Semester</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete semesters available in the system.
          </p>
        </div>
      </div>

      {/* year levels active session - display after loading completes */}
      <div className="mb-4">
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            {activeAcadYear ? (
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-ring" />
            ) : (
              <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
            )}
            <div>
              <p className="font-semibold">
                {activeAcadYear
                  ? "Semesters for Active Academic Year"
                  : "No Active Academic Year"}
              </p>
              {activeAcadYear ? (
                <p className="text-sm font-bold text-primary">
                  {activeAcadYear.acadYear}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the Academic Year module and set an active
                  session to manage semesters.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Only show the add semester button and content if there's an active academic year */}
      {activeAcadYear ? (
        <>
          <div className="flex items-center py-4 gap-2">
            <AddSemesterModal
              activeAcadYear={activeAcadYear}
              onSemesterAdded={fetchSemesters}
            />
          </div>

          {/* Card Grid Layout */}
          {semesters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {semesters.map((semester) => (
                <SemesterCard
                  key={semester.id}
                  semester={semester}
                  onEdit={handleEditSemester}
                  onDelete={handleDeleteSemester}
                  onSetActive={handleSetStatus}
                  isActivating={activatingSemesterId === semester.id}
                />
              ))}
            </div>
          ) : (
            // Empty state - when no semesters but active academic year exists
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No semesters found.</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Semester" to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
