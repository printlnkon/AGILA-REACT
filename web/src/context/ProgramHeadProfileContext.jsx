import { useEffect, createContext, useContext, useState } from "react";

const ProgramHeadProfileContext = createContext();

export function ProgramHeadProfileProvider({ children }) {
  const [selectedProgramHead, setSelectedProgramHeadState] = useState(null);

  // load selected program head from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedProgramHead");
    if (stored) {
      setSelectedProgramHead(JSON.parse(stored));
    }
  }, []);

  // set selected program head and update localStorage
  const setSelectedProgramHead = (programHead) => {
    setSelectedProgramHeadState(programHead);
    if (programHead) {
      localStorage.setItem("selectedProgramHead", JSON.stringify(programHead));
    } else {
      localStorage.removeItem("selectedProgramHead");
    }
  };

  return (
    <ProgramHeadProfileContext.Provider
      value={{ selectedProgramHead, setSelectedProgramHead }}
    >
      {children}
    </ProgramHeadProfileContext.Provider>
  );
}

export function useProgramHeadProfile() {
  return useContext(ProgramHeadProfileContext);
}
