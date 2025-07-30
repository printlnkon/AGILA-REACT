import { useEffect, createContext, useContext, useState } from "react";

const AcademicHeadProfileContext = createContext();

export function AcademicHeadProfileProvider({ children }) {
  const [selectedAcademicHead, setSelectedAcademicHeadState] = useState(null);

  // load selected academic head from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedAcademicHead");
    if (stored) {
      setSelectedAcademicHead(JSON.parse(stored));
    }
  }, []);

  // set selected academic head and update localStorage
  const setSelectedAcademicHead = (academicHead) => {
    setSelectedAcademicHeadState(academicHead);
    if (academicHead) {
      localStorage.setItem("selectedAcademicHead", JSON.stringify(academicHead));
    } else {
      localStorage.removeItem("selectedAcademicHead");
    }
  };

  return (
    <AcademicHeadProfileContext.Provider
      value={{ selectedAcademicHead, setSelectedAcademicHead }}
    >
      {children}
    </AcademicHeadProfileContext.Provider>
  );
}

export function useAcademicHeadProfile() {
  return useContext(AcademicHeadProfileContext);
}
