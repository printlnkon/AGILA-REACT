import { db } from "@/api/firebase";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useState, useEffect } from "react";

const TeacherProfileContext = createContext();

export function TeacherProfileProvider({ children }) {
  const [selectedTeacher, setSelectedTeacherState] = useState(null);

  // load selected teacher from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedTeacher");
    if (stored) {
      setSelectedTeacher(JSON.parse(stored));
    }
  }, []);

  // set selected teacher and update localStorage
  const setSelectedTeacher = (teacher) => {
    setSelectedTeacherState(teacher);
    if (teacher) {
      localStorage.setItem("selectedTeacher", JSON.stringify(teacher));
    } else {
      localStorage.removeItem("selectedTeacher");
    }
  };

  // update teacher data in the database
  const updateTeacherProfile = async (updatedData) => {
    if (!updatedData || !updatedData.id) {
      toast.error("Invalid teacher data.");
      return;
    }

    try {
      const teacherDocRef = doc(db, "users/teacher/accounts", updatedData.id);
      await updateDoc(teacherDocRef, { ...updatedData, updatedAt: new Date() });

      setSelectedTeacher(updatedData); // update context state
      toast.success("Teacher profile updated successfully.");
      return true;
    } catch (error) {
      toast.error("Failed to update teacher profile.");
      return false;
    }
  };

  return (
    <TeacherProfileContext.Provider
      value={{ selectedTeacher, setSelectedTeacher, updateTeacherProfile }}
    >
      {children}
    </TeacherProfileContext.Provider>
  );
}

export function useTeacherProfile() {
  return useContext(TeacherProfileContext);
}
