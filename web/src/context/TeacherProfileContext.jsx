import { useEffect, createContext, useContext, useState } from "react";

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

  return (
    <TeacherProfileContext.Provider
      value={{ selectedTeacher, setSelectedTeacher }}
    >
      {children}
    </TeacherProfileContext.Provider>
  );
}

export function useTeacherProfile() {
  return useContext(TeacherProfileContext);
}
