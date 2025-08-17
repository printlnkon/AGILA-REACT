import { createContext, useContext, useState } from "react";

const ClassListContext = createContext(null);

export function ClassListProvider({ children }) {
  const [selectedSection, setSelectedSection] = useState(null);
  const [filterState, setFilterState] = useState({
    yearLevel: "all",
    department: "all",
    course: "all",
    // can add any other filters
  });

  return (
    <ClassListContext.Provider 
      value={{ 
        selectedSection, 
        setSelectedSection,
        filterState,
        setFilterState
      }}
    >
      {children}
    </ClassListContext.Provider>
  );
}

export const useClassList = () => useContext(ClassListContext);