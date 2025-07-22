import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AddDepartmentModal from "@/components/AdminComponents/AddDepartmentModal";
import DepartmentCard from "@/components/AdminComponents/DepartmentCard";

export default function DepartmentsTable() {
  const [departments, setDepartments] = useState([]);
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
          "No active academic year found. Please set one to manage departments."
        );
        setActiveSession({ id: null, name: "No Active Session" });
        setDepartments([]);
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

  const fetchDepartments = useCallback(() => {
    if (!activeSession || !activeSession.id || !activeSession.semesterId) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      const departmentsPath = `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`;
      const departmentsRef = collection(db, departmentsPath);

      // Return the unsubscribe function so we can clean up the listener
      return onSnapshot(
        departmentsRef,
        (snapshot) => {
          const depts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            academicYearId: activeSession.id,
            semesterId: activeSession.semesterId,
          }));

          // Sort departments alphabetically by name
          depts.sort((a, b) =>
            a.departmentName.localeCompare(b.departmentName)
          );
          setDepartments(depts);
          setLoading(false);
        },
        (error) => {
          console.error("Error in departments listener:", error);
          toast.error("Failed to listen for department updates.");
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error setting up departments listener:", error);
      toast.error("Failed to fetch departments.");
      setLoading(false);
    }
  }, [activeSession]);

  // Load data in sequence to improve UX
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const hasActiveSession = await fetchActiveSession();

      // If we have an active session, fetchDepartments will be triggered by its own useEffect
      // If not, we should set loading to false here
      if (!hasActiveSession) {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchActiveSession]);

  useEffect(() => {
    let unsubscribe;

    if (activeSession && activeSession.id && activeSession.semesterId) {
      unsubscribe = fetchDepartments();
    }

    // Clean up the listener when component unmounts or dependencies change
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchDepartments, activeSession]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        {/* skeleton for departments active session */}
        <div>
          <Skeleton className="h-18 w-full" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add department button */}
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
          <h1 className="text-2xl font-bold">Manage Departments</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete departments available in the system.
          </p>
        </div>
      </div>

      {/* departments active session - display after loading completes */}
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
                  ? "Departments for Active Academic Year and Semester"
                  : "No Active Academic Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} | {activeSession.semesterName}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the Academic Year module and set an active
                  session to manage departments.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Only show the add department button and content if there's an active academic year and semester */}
      {!isNoActiveSession ? (
        <>
          <div className="flex items-center py-4 gap-2">
            <AddDepartmentModal
              activeSession={activeSession}
              disabled={isNoActiveSession}
            />
          </div>

          {/* Card Grid Layout */}
          {departments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {departments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                />
              ))}
            </div>
          ) : (
            // Empty state - when no departments
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
                <Building2 className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No departments found.</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Department" to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
