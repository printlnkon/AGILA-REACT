import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner";
import AddYearLevelModal from "@/components/AdminComponents/AddYearLevelModal";
import YearLevelCard from "@/components/AdminComponents/YearLevelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function YearLevelsTable() {
  const [yearLevels, setYearLevels] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch active academic year
  const fetchActiveSession = useCallback(async () => {
    try {
      // Find the active academic year first
      const academicYearsRef = collection(db, "academic_years");
      const qAcademicYear = query(
        academicYearsRef,
        where("status", "==", "Active")
      );

      const yearSnapshot = await getDocs(qAcademicYear);

      if (yearSnapshot.empty) {
        toast.error(
          "No active academic year found. Please set one to manage year levels."
        );
        setActiveSession({ id: null, name: "No Active Session" });
        setYearLevels([]);
        return false;
      }

      const academicYearDoc = yearSnapshot.docs[0];
      const academicYearData = {
        id: academicYearDoc.id,
        ...academicYearDoc.data(),
      };

      // Find the active semester within that academic year's sub-collection
      const semestersRef = collection(
        db,
        "academic_years",
        academicYearData.id,
        "semesters"
      );
      const qSemester = query(semestersRef, where("status", "==", "Active"));

      const semesterSnapshot = await getDocs(qSemester);

      if (semesterSnapshot.empty) {
        toast.error(
          `No active semester found for the academic year ${academicYearData.acadYear}.`
        );
        setActiveSession({
          ...academicYearData,
          semesterName: "No Active Semester",
        });
        return false;
      }

      const semesterDoc = semesterSnapshot.docs[0];
      const semesterData = semesterDoc.data();
      const semesterId = semesterDoc.id;

      // Combine data from both documents into the activeSession state
      const sessionInfo = {
        id: academicYearData.id,
        acadYear: academicYearData.acadYear,
        semesterName: semesterData.semesterName,
        semesterId: semesterId,
      };

      setActiveSession(sessionInfo);
      return true;
    } catch (error) {
      console.error("Error fetching active session:", error);
      toast.error("Failed to determine the active session.");
      return false;
    }
  }, []);

  // Fetch year levels for the active session
  const fetchYearLevels = useCallback(async () => {
    if (!activeSession || !activeSession.id || !activeSession.semesterId) {
      setYearLevels([]);
      setLoading(false);
      return;
    }

    try {
      const yearLevelsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/year_levels`;
      const yearLevelsRef = collection(db, yearLevelsPath);
      const yearLevelsSnapshot = await getDocs(yearLevelsRef);

      const levels = yearLevelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        academicYearId: activeSession.id,
        semesterId: activeSession.semesterId,
      }));

      const sortOrder = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
      levels.sort((a, b) => {
        const indexA = sortOrder.indexOf(a.yearLevelName);
        const indexB = sortOrder.indexOf(b.yearLevelName);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      setYearLevels(levels);
    } catch (error) {
      console.error("Error fetching year levels:", error);
      toast.error("Failed to fetch year levels.");
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  // Load data in sequence to improve UX
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const hasActiveSession = await fetchActiveSession();

      // If we have an active session, fetchYearLevels will be triggered by its own useEffect
      // If not, we should set loading to false here
      if (!hasActiveSession) {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchActiveSession]);

  // Fetch year levels whenever the active session changes
  useEffect(() => {
    if (activeSession && activeSession.id && activeSession.semesterId) {
      fetchYearLevels();
    }
  }, [fetchYearLevels, activeSession]);

  const handleEditYearLevel = async (yearLevel, newName) => {
    if (!newName.trim()) {
      toast.error("Year level name cannot be empty.");
      return;
    }

    if (!activeSession || !activeSession.id || !yearLevel.semesterId) {
      toast.error("Missing required references to update year level.");
      return;
    }

    // Path to the specific year level using the hierarchical structure
    const yearLevelPath = `academic_years/${activeSession.id}/semesters/${yearLevel.semesterId}/year_levels`;

    // Check if the new name already exists in this semester
    const yearLevelsRef = collection(db, yearLevelPath);
    const q = query(
      yearLevelsRef,
      where("yearLevelName", "==", newName.trim())
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty && querySnapshot.docs[0].id !== yearLevel.id) {
      toast.error(
        `Year level "${newName.trim()}" already exists in this semester.`
      );
      return;
    }

    // Reference to the specific year level document
    const yearLevelRef = doc(db, yearLevelPath, yearLevel.id);

    try {
      await updateDoc(yearLevelRef, {
        yearLevelName: newName.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Year level updated successfully.");
      fetchYearLevels();
    } catch (error) {
      console.error("Error updating year level:", error);
      toast.error("Failed to update year level.");
    }
  };

  const handleDeleteYearLevel = async (yearLevel) => {
    if (!activeSession || !activeSession.id || !yearLevel.semesterId) {
      toast.error("Missing required references to delete year level.");
      return;
    }

    // Path to the specific year level using the hierarchical structure
    const yearLevelPath = `academic_years/${activeSession.id}/semesters/${yearLevel.semesterId}/year_levels`;

    // Reference to the specific year level document
    const yearLevelRef = doc(db, yearLevelPath, yearLevel.id);

    try {
      await deleteDoc(yearLevelRef);
      toast.success(
        `Year level "${yearLevel.yearLevelName}" deleted successfully.`
      );
      fetchYearLevels();
    } catch (error) {
      console.error("Error deleting year level:", error);
      toast.error("Failed to delete year level.");
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
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
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

  const isNoActiveSession = activeSession && !activeSession.id;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Year Levels</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete year levels available in the system.
          </p>
        </div>
      </div>

      {/* year levels active session - display after loading completes */}
      <div className="mb-4">
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            {!isNoActiveSession ? (
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-ring" />
            ) : (
              <AlertTriangle className="h-8 w-8 mt-2 text-destructive" />
            )}
            <div>
              <p className="font-semibold">
                {!isNoActiveSession
                  ? "Year Levels for Active Academic Year and Semester"
                  : "No Active Academic Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} | {activeSession.semesterName}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the Academic Year module and set an active
                  session to manage year levels.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Only show the add year level button and content if there's an active academic year and semester */}
      {!isNoActiveSession ? (
        <>
          <div className="flex items-center py-4 gap-2">
            <AddYearLevelModal
              activeSession={activeSession}
              onYearLevelAdded={fetchYearLevels}
              disabled={isNoActiveSession}
            />
          </div>

          {/* Card Grid Layout */}
          {yearLevels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {yearLevels.map((yearLevel) => (
                <YearLevelCard
                  key={yearLevel.id}
                  yearLevel={yearLevel}
                  onEdit={handleEditYearLevel}
                  onDelete={handleDeleteYearLevel}
                />
              ))}
            </div>
          ) : (
            // Empty state - when no year levels
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
                <Layers className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No year levels found.</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Year Level" to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
