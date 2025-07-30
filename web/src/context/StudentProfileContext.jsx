import { useEffect } from "react";
import { createContext, useContext, useState } from "react";

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

  return (
    <StudentProfileContext.Provider
      value={{ selectedStudent, setSelectedStudent }}
    >
      {children}
    </StudentProfileContext.Provider>
  );
}

export function useStudentProfile() {
  return useContext(StudentProfileContext);
}
