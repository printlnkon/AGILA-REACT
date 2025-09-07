import { db } from "@/api/firebase";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useState, useEffect } from "react";

const StudentProfileContext = createContext();

export function StudentProfileProvider({ children }) {
  const [selectedStudent, setSelectedStudentState] = useState(null);

  // load selected student from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedStudent");
    if (stored) {
      setSelectedStudent(JSON.parse(stored));
    }
  }, []);

  // set selected student and update localStorage
  const setSelectedStudent = (student) => {
    setSelectedStudentState(student);
    if (student) {
      localStorage.setItem("selectedStudent", JSON.stringify(student));
    } else {
      localStorage.removeItem("selectedStudent");
    }
  };

  // update student data in the database
  const updateStudentProfile = async (updatedData) => {
    if (!updatedData || !updatedData.id) {
      toast.error("Invalid student data.");
      return;
    }

    try {
      const studentDocRef = doc(db, "users/student/accounts", updatedData.id);
      await updateDoc(studentDocRef, { ...updatedData, updatedAt: new Date() });

      setSelectedStudent(updatedData); // update context state
      toast.success("Student profile updated successfully.");
      return true;
    } catch (error) {
      toast.error("Failed to update student profile.");
      return false;
    }
  };

  return (
    <StudentProfileContext.Provider
      value={{ selectedStudent, setSelectedStudent, updateStudentProfile }}
    >
      {children}
    </StudentProfileContext.Provider>
  );
}

export function useStudentProfile() {
  return useContext(StudentProfileContext);
}
