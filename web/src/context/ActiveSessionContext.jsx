import { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

const ActiveSessionContext = createContext();

export function useActiveSession() {
  return useContext(ActiveSessionContext);
}

export function ActiveSessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        // Query for academic years with isActive flag
        const academicYearsRef = collection(db, "academic_years");
        const academicYearQuery = query(academicYearsRef, where("status", "==", "Active"));
        
        const unsubscribe = onSnapshot(academicYearQuery, async (snapshot) => {
          if (snapshot.empty) {
            setActiveSession(null);
            setLoading(false);
            return;
          }
          
          // Get the active academic year
          const activeYear = snapshot.docs[0];
          const activeYearData = { id: activeYear.id, ...activeYear.data() };
          
          // Query for active semester within this academic year
          const semestersRef = collection(db, `academic_years/${activeYear.id}/semesters`);
          const semesterQuery = query(semestersRef, where("status", "==", "Active"));
          const semesterSnapshot = await getDocs(semesterQuery);
          
          if (semesterSnapshot.empty) {
            setActiveSession({
              ...activeYearData,
              semesterId: null,
              semesterName: null,
            });
          } else {
            const activeSemester = semesterSnapshot.docs[0];
            setActiveSession({
              ...activeYearData,
              semesterId: activeSemester.id,
              semesterName: activeSemester.data().semesterName,
              ...activeSemester.data()
            });
          }
          
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching active session:", error);
        toast.error("Failed to load active academic session");
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribe = fetchActiveSession();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
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