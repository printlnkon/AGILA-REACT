import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Info, AlertTriangle, LibraryBig } from "lucide-react";
import AddSectionCard from "@/components/AdminComponents/AddSectionCard";

export default function SectionsTable() {
  const [yearLevels, setYearLevels] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    try {
      const academicYearsRef = collection(db, "academic_years");
      const qAcademicYear = query(
        academicYearsRef,
        where("status", "==", "Active")
      );
      const yearSnapshot = await getDocs(qAcademicYear);

      if (yearSnapshot.empty) {
        toast.error(
          "No active academic year found. Please set one to manage sections."
        );
        setActiveSession({ id: null, name: "No Active Session" });
        setYearLevels([]);
        return null;
      }

      const academicYearDoc = yearSnapshot.docs[0];
      const academicYearData = {
        id: academicYearDoc.id,
        ...academicYearDoc.data(),
      };

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
        setYearLevels([]);
        return null;
      }

      const semesterDoc = semesterSnapshot.docs[0];
      const semesterData = semesterDoc.data();
      const sessionInfo = {
        id: academicYearData.id,
        acadYear: academicYearData.acadYear,
        semesterName: semesterData.semesterName,
        semesterId: semesterDoc.id,
      };

      setActiveSession(sessionInfo);
      return sessionInfo;
    } catch (error) {
      console.error("Error fetching active session:", error);
      toast.error("Failed to determine the active session.");
      setActiveSession({ id: null, name: "No Active Session" });
      setYearLevels([]);
      return null;
    }
  }, []);

  const fetchYearLevels = useCallback(async (session) => {
    if (!session || !session.id || !session.semesterId) {
      setYearLevels([]);
      return;
    }

    try {
      const yearLevelsPath = `academic_years/${session.id}/semesters/${session.semesterId}/year_levels`;
      const yearLevelsRef = collection(db, yearLevelsPath);
      const yearLevelsSnapshot = await getDocs(yearLevelsRef);

      const levels = yearLevelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        academicYearId: session.id,
        semesterId: session.semesterId,
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
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const session = await fetchActiveSession();
      if (session) {
        await fetchYearLevels(session);
      }
      setLoading(false);
    };

    loadData();
  }, [fetchActiveSession, fetchYearLevels]);

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
          <h1 className="text-2xl font-bold">Manage Sections</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete sections for each year level.
          </p>
        </div>
      </div>

      {/* year levels active session - display after loading completes*/}
      <div className="mb-4">
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            {!isNoActiveSession ? (
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-ring" />
            ) : (
              <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
            )}
            <div>
              <p className="font-semibold">
                {!isNoActiveSession
                  ? "Sections for Active Academic Year and Semester"
                  : "No Active Academic Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} | {activeSession.semesterName}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the Academic Year module and set an active
                  session to manage sections.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Only show the sections and content if there's an active academic year and semester */}

      {!isNoActiveSession && (
        <div className="w-full">
          {yearLevels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {yearLevels.map((yearLevel) => (
                <AddSectionCard
                  key={yearLevel.id}
                  yearLevel={yearLevel}
                  activeSession={activeSession}
                />
              ))}
            </div>
          ) : (
            // Empty state - when no year levels
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
                <LibraryBig className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No Year Levels Found</p>
                <p className="text-sm text-muted-foreground">
                  Please add year levels first before managing sections.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
