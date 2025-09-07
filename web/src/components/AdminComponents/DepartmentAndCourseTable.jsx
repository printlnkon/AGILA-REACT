import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertTriangle, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveSession } from "@/context/ActiveSessionContext";
import AddDepartmentModal from "@/components/AdminComponents/AddDepartmentModal";
import DepartmentCard from "@/components/AdminComponents/DepartmentCard";

export default function DepartmentAndCourseTable() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Wait for the session data to load
    if (sessionLoading) {
      setLoading(true);
      return;
    }

    let unsubscribe;
    if (activeSession && activeSession.id && activeSession.semesterId) {
      unsubscribe = fetchDepartments();
    } else {
      // No active session or missing required fields
      setDepartments([]);
      setLoading(false);
    }

    // Clean up the listener when component unmounts or dependencies change
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchDepartments, activeSession, sessionLoading]);

  const isNoActiveSession = !activeSession || !activeSession.id;
  const isNoActiveSemester = activeSession && !activeSession.semesterId;

  if (loading || sessionLoading) {
    return (
      <div className="w-full p-4 space-y-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        {/* skeleton for department active session */}
        <div>
          <Skeleton className="h-18 w-full" />
        </div>
        <div className="flex items-center gap-2 py-4">
          {/* skeleton for add department button */}
          <Skeleton className="h-9 w-28" />
        </div>

        {/* skeleton for departmentcard grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 flex flex-col space-y-2"
              >
                {/* cardheader skeleton */}
                <div className="flex justify-between items-start pb-2">
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
                {/* cardcontent skeleton (CourseList) */}
                <div className="flex-grow pb-2">
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-8 w-full mb-2" />
                </div>
                {/* cardfooter skeleton (AddCourseModal) */}
                <div>
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Department and Course</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete departments and courses available in the
            system.
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
                  ? "Departments and Courses for Active School Year and Semester"
                  : "No Active School Year"}
              </p>
              {!isNoActiveSession ? (
                <p className="text-sm font-bold text-primary">
                  {activeSession.acadYear} |{" "}
                  {!isNoActiveSemester
                    ? activeSession.semesterName
                    : "No Active Semester"}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Please go to the School Year module and set an active session
                  to manage departments and courses.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* only show the add department button and content if there's an active academic year and semester */}
      {!isNoActiveSession && !isNoActiveSemester ? (
        <>
          <div className="flex items-center gap-2">
            <AddDepartmentModal
              activeSession={activeSession}
              disabled={isNoActiveSession || isNoActiveSemester}
            />
          </div>

          {/* card grid layout */}
          {departments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {departments.map((department) => (
                <DepartmentCard key={department.id} department={department} />
              ))}
            </div>
          ) : (
            // empty state - when no departments
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-2">
                <Building2 className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">
                  No department and course found.
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Department" to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : isNoActiveSemester && !isNoActiveSession ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-2">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">No Active Semester</p>
            <p className="text-center text-muted-foreground">
              Please set an active semester in the School Year module to manage
              departments and courses.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
