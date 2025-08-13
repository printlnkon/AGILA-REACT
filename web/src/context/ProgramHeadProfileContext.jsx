import { db } from "@/api/firebase";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
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

  // update  program head data in the database
  const updateProgramHeadProfile = async (updatedData) => {
    if (!updatedData || !updatedData.id) {
      toast.error("Invalid program head data.");
      return;
    }

    try {
      const programHeadDocRef = doc(
        db,
        "users/program_head/accounts",
        updatedData.id
      );
      await updateDoc(programHeadDocRef, {
        ...updatedData,
        updatedAt: new Date(),
      });

      setSelectedProgramHead(updatedData); // update context state
      toast.success("Program head profile updated successfully.");
      return true;
    } catch (error) {
      toast.error("Failed to update program head profile.");
      return false;
    }
  };

  return (
    <ProgramHeadProfileContext.Provider
      value={{
        selectedProgramHead,
        setSelectedProgramHead,
        updateProgramHeadProfile,
      }}
    >
      {children}
    </ProgramHeadProfileContext.Provider>
  );
}

export function useProgramHeadProfile() {
  return useContext(ProgramHeadProfileContext);
}
