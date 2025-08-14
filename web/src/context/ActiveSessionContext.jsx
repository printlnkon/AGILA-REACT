import { toast } from "sonner";
import { db } from "@/api/firebase";
import { createContext, useContext, useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const ActiveSessionContext = createContext(null);

export function useActiveSession() {
  return useContext(ActiveSessionContext);
}

export function ActiveSessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Query for academic years with isActive flag
      const academicYearsRef = collection(db, "academic_years");
      const academicYearQuery = query(
        academicYearsRef,
        where("status", "==", "Active")
      );

      const unsubscribe = onSnapshot(academicYearQuery, async (snapshot) => {
        if (snapshot.empty) {
          setActiveSession(null);
          setLoading(false);
          return;
        }

        // Get the active academic year
        const activeYear = snapshot.docs[0];
        const activeYearData = { id: activeYear.id, ...activeYear.data() };

        // Use onSnapshot for real-time updates on the active semester
        const semestersRef = collection(
          db,
          `academic_years/${activeYear.id}/semesters`
        );
        const semesterQuery = query(
          semestersRef,
          where("status", "==", "Active")
        );

        // Create a nested subscription for semester changes
        const semesterUnsubscribe = onSnapshot(semesterQuery, (semSnapshot) => {
          if (semSnapshot.empty) {
            setActiveSession({
              ...activeYearData,
              semesterId: null,
              semesterName: null,
            });
          } else {
            const activeSemester = semSnapshot.docs[0];
            setActiveSession({
              ...activeYearData,
              semesterId: activeSemester.id,
              semesterName: activeSemester.data().semesterName,
              ...activeSemester.data(),
            });
          }

          setLoading(false);
        });

        // Return a cleanup function that unsubscribes from both listeners
        return () => {
          semesterUnsubscribe();
        };
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching active session:", error);
      toast.error("Failed to load active academic session");
      setLoading(false);
      return () => {};
    }
  }, []);

  const value = {
    activeSession,
    loading,
  };

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
}
