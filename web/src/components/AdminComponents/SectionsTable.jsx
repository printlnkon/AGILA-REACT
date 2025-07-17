import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Info, AlertTriangle, LibraryBig } from "lucide-react";
import AddSectionCard from "@/components/AdminComponents/AddSectionCard";

export default function SectionsTable() {
  const [yearLevels, setYearLevels] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // state to hold active academic year info
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Define a variable to hold the listener for the year levels
    let unsubscribeYearLevels = () => {};

    // Find the active academic year first
    const academicYearsRef = collection(db, "academic_years");
    const qAcademicYear = query(
      academicYearsRef,
      where("status", "==", "Active")
    );

    const unsubscribeAcademicYear = onSnapshot(
      qAcademicYear,
      async (yearSnapshot) => {
        unsubscribeYearLevels();
        if (yearSnapshot.empty) {
          toast.error(
            "No active academic year found. Please set one to manage year levels."
          );
          setActiveSession({ id: null, name: "No Active Session" });
          setYearLevels([]);
          setLoading(false);
          return;
        }

        const academicYearDoc = yearSnapshot.docs[0];
        const academicYearData = {
          id: academicYearDoc.id,
          ...academicYearDoc.data(),
        };

        // find the active semester within that academic year's sub-collection
        const semestersRef = collection(
          db,
          "academic_years",
          academicYearData.id,
          "semesters"
        );
        const qSemester = query(semestersRef, where("status", "==", "Active"));

        try {
          const semesterSnapshot = await getDocs(qSemester);

          if (semesterSnapshot.empty) {
            toast.error(
              `No active semester found for the academic year ${academicYearData.acadYear}.`
            );
            setActiveSession({
              ...academicYearData,
              semesterName: "No Active Semester",
            }); // still show the year
            setYearLevels([]);
            setLoading(false);
            return;
          }

          const semesterDoc = semesterSnapshot.docs[0];
          const semesterData = semesterDoc.data();
          const semesterId = semesterDoc.id;

          // combine data from both documents into the activeSession state
          const sessionInfo = {
            id: academicYearData.id,
            acadYear: academicYearData.acadYear,
            semesterName: semesterData.semesterName, // data from the sub-collection
            semesterId: semesterId, // id of the semester document
          };
          setActiveSession(sessionInfo);

          // listen for year levels associated with the active academic year ID
          const yearLevelsQuery = collection(
            db,
            `academic_years/${academicYearData.id}/semesters/${semesterId}/year_levels`
          );

          unsubscribeYearLevels = onSnapshot(
            yearLevelsQuery,
            (yearLevelsSnapshot) => {
              const levels = yearLevelsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                //  make editing/deleting easier
                academicYearId: academicYearData.id,
                semesterId: semesterId,
              }));

              const sortOrder = [
                "1st Year",
                "2nd Year",
                "3rd Year",
                "4th Year",
              ];
              levels.sort((a, b) => {
                const indexA = sortOrder.indexOf(a.yearLevelName);
                const indexB = sortOrder.indexOf(b.yearLevelName);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });

              setYearLevels(levels);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error("Error fetching active semester:", error);
          toast.error("Failed to load the active semester.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching active academic year:", error);
        toast.error("Failed to determine the active academic year.");
        setLoading(false);
      }
    );

    // unsubscribe from both listeners
    return () => {
      unsubscribeAcademicYear();
      unsubscribeYearLevels();
    };
  }, []);

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

        <div className="flex items-center gap-2 py-4"></div>

        {/* skeleton for card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8)
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
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Sections</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete sections available in the system.
          </p>
        </div>
      </div>

      {/* year levels active session */}
      <div className="mb-4">
        {loading ? (
          <div className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ) : isNoActiveSession ? (
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-8 w-8 mt-2 text-yellow-600" />
              <div>
                <p className="font-semibold">No Active Academic Year</p>
                <p className="text-sm text-yellow-700">
                  Please go to the Academic Year module and set an active
                  session to manage year levels.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-sidebar-ring" />
              <div>
                <p className="font-normal ">
                  Sections for Active Academic Year and Semester
                </p>
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} | {activeSession.semesterName}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="w-full">
        {yearLevels.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {yearLevels.map((yearLevel) => (
              <AddSectionCard
                key={yearLevel.id}
                yearLevel={yearLevel}
                activeSession={activeSession}
                onEditYearLevel={handleEditYearLevel}
                onDeleteYearLevel={handleDeleteYearLevel}
              />
            ))}
          </div>
        ) : (
          // Empty state - when no year levels
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
              <LibraryBig className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No sections found.</p>
              <p className="text-sm text-muted-foreground">
                Year levels should be added first to manage sections.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
