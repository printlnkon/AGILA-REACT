import { useEffect, useState } from "react";
import SubjectApproval from "@/components/ProgramHeadComponents/SubjectApproval";
import { useProgramHeadProfile } from "@/context/ProgramHeadProfileContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/api/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export default function ProgramHeadSubjectApproval() {
  const { selectedProgramHead, setSelectedProgramHead } = useProgramHeadProfile();
  const { currentUser } = useAuth();

  // Only trust cached profile if it belongs to the current user
  const cacheMatchesUser =
    !!selectedProgramHead &&
    !!currentUser?.email &&
    selectedProgramHead.email === currentUser.email;

  const [deptName, setDeptName] = useState(
    cacheMatchesUser ? selectedProgramHead.departmentName || null : null
  );

  // If the cached profile doesn't match this user, drop it
  useEffect(() => {
    if (!cacheMatchesUser && selectedProgramHead) {
      setSelectedProgramHead(null); // clears localStorage via your context
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheMatchesUser]);

  // If context later provides a matching profile, adopt it
  useEffect(() => {
    if (cacheMatchesUser && selectedProgramHead?.departmentName) {
      setDeptName(selectedProgramHead.departmentName);
    }
  }, [cacheMatchesUser, selectedProgramHead]);

  // Fallback: fetch Program Head doc by the signed-in user's email
  useEffect(() => {
    const run = async () => {
      if (deptName) return;
      if (!currentUser?.email) return;

      try {
        const q = query(
          collection(db, "users/program_head/accounts"), // your real path
          where("email", "==", currentUser.email),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          if (docData?.departmentName) {
            setDeptName(docData.departmentName);
            // cache the correct profile for this user
            setSelectedProgramHead(docData);
          }
        }
      } catch (e) {
        console.warn("[PH fallback] lookup failed:", e);
      }
    };
    run();
  }, [deptName, currentUser, setSelectedProgramHead]);

  return <SubjectApproval programHeadDeptName={deptName || undefined} />;
}
