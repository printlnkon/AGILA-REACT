import { db } from "@/api/firebase";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
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
      localStorage.setItem(
        "selectedAcademicHead",
        JSON.stringify(academicHead)
      );
    } else {
      localStorage.removeItem("selectedAcademicHead");
    }
  };

  // update academic head data in the database
  const updateAcademicHeadProfile = async (updatedData) => {
    if (!updatedData || !updatedData.id) {
      toast.error("Invalid academic head data.");
      return;
    }

    try {
      const academicHeadDocRef = doc(
        db,
        "users/academic_head/accounts",
        updatedData.id
      );
      await updateDoc(academicHeadDocRef, {
        ...updatedData,
        updatedAt: new Date(),
      });

      setSelectedAcademicHead(updatedData); // update context state
      toast.success("Academic head profile updated successfully.");
      return true;
    } catch (error) {
      toast.error("Failed to update academic head profile.");
      return false;
    }
  };

  return (
    <AcademicHeadProfileContext.Provider
      value={{
        selectedAcademicHead,
        setSelectedAcademicHead,
        updateAcademicHeadProfile,
      }}
    >
      {children}
    </AcademicHeadProfileContext.Provider>
  );
}

export function useAcademicHeadProfile() {
  return useContext(AcademicHeadProfileContext);
}
