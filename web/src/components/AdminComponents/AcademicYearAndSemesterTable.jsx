import { db } from "@/api/firebase";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import AddAcademicYearModal from "@/components/AdminComponents/AddAcademicYearModal";
import AddSemesterModal from "@/components/AdminComponents/AddSemesterModal";
import AcademicYearCard from "@/components/AdminComponents/AcademicYearCard";

export default function AcademicYearAndSemesterTable() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [isAddAcadYearModalOpen, setAddAcadYearModalOpen] = useState(false);
  const [isAddSemesterModalOpen, setAddSemesterModalOpen] = useState(false);
  const [currentAcadYear, setCurrentAcadYear] = useState(null);

  const fetchAcademicData = useCallback(async () => {
    setLoading(true);
    try {
      const acadYearsColRef = collection(db, "academic_years");
      const q = query(acadYearsColRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const acadYearList = await Promise.all(
        querySnapshot.docs.map(async (acadDoc) => {
          const acadYearData = {
            id: acadDoc.id,
            ...acadDoc.data(),
            semesters: [],
          };

          const semestersColRef = collection(
            db,
            "academic_years",
            acadDoc.id,
            "semesters"
          );
          const semestersQuery = query(
            semestersColRef,
            orderBy("createdAt", "asc")
          );
          const semesterSnapshot = await getDocs(semestersQuery);

          acadYearData.semesters = semesterSnapshot.docs.map((semDoc) => ({
            id: semDoc.id,
            ...semDoc.data(),
          }));

          acadYearData.semesters.sort((a, b) => {
            if (a.status === "Active") return -1;
            if (b.status === "Active") return 1;
            return 0;
          });

          return acadYearData;
        })
      );

      acadYearList.sort((a, b) => {
        const statusOrder = { Active: 1, Upcoming: 2, Archived: 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      });

      setAcademicYears(acadYearList);
    } catch (error) {
      console.error("Error fetching academic data: ", error);
      toast.error("Failed to fetch academic data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  const handleAddAcademicYear = async (yearName) => {
    try {
      await addDoc(collection(db, "academic_years"), {
        acadYear: yearName,
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Academic Year "${yearName}" added successfully!`);
      fetchAcademicData();
      return true;
    } catch (error) {
      console.error("Error adding academic year: ", error);
      toast.error("Failed to add academic year.");
      return false;
    }
  };

  const handleSetActiveAcademicYear = async (acadYearToActivate) => {
    setActionLoading(acadYearToActivate.id);
    const batch = writeBatch(db);
    const acadYearsRef = collection(db, "academic_years");
    const currentActiveYear = academicYears.find(
      (ay) => ay.status === "Active"
    );

    if (currentActiveYear) {
      const activeYearDocRef = doc(acadYearsRef, currentActiveYear.id);
      batch.update(activeYearDocRef, { status: "Archived" });

      if (
        currentActiveYear.semesters &&
        currentActiveYear.semesters.length > 0
      ) {
        toast.info(
          `Archiving all semesters for ${currentActiveYear.acadYear}.`
        );
        currentActiveYear.semesters.forEach((semester) => {
          const semesterDocRef = doc(
            db,
            "academic_years",
            currentActiveYear.id,
            "semesters",
            semester.id
          );
          if (semester.status !== "Archived") {
            batch.update(semesterDocRef, { status: "Archived" });
          }
        });
      }
    }

    const newActiveDocRef = doc(acadYearsRef, acadYearToActivate.id);
    batch.update(newActiveDocRef, { status: "Active" });

    try {
      await batch.commit();
      toast.success(
        `${acadYearToActivate.acadYear} is now the active academic year.`
      );
      fetchAcademicData();
    } catch (error) {
      console.error("Error setting active academic year: ", error);
      toast.error("Failed to set active academic year.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateAcademicYear = async (id, editedYearName) => {
    try {
      const acadYearRef = doc(db, "academic_years", id);
      await updateDoc(acadYearRef, {
        acadYear: editedYearName,
        updatedAt: serverTimestamp(),
      });
      toast.success(`School Year updated to "${editedYearName}"`);
      fetchAcademicData();
    } catch (error) {
      console.error("Error updating academic year: ", error);
      toast.error("Failed to update academic year.");
    }
  };

  const handleDeleteAcademicYear = async (acadYearToDelete) => {
    if (acadYearToDelete.status === "Active") {
      toast.error("Cannot delete an active academic year.");
      return;
    }

    if (acadYearToDelete.semesters && acadYearToDelete.semesters.length > 0) {
      toast.error(
        "Cannot delete this academic year. Please remove all semesters first."
      );
      return;
    }

    const acadYearRef = doc(db, "academic_years", acadYearToDelete.id);
    try {
      await deleteDoc(acadYearRef);
      toast.success("Academic year deleted successfully.");
      fetchAcademicData();
    } catch (error) {
      toast.error("Failed to delete academic year.");
      console.error("Error deleting academic year:", error);
    }
  };

  const handleAddSemester = async (formData) => {
    if (!currentAcadYear) {
      toast.error("No academic year selected.");
      return false;
    }
    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        currentAcadYear.id,
        "semesters"
      );
      await addDoc(semestersColRef, {
        ...formData,
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(
        `Semester "${formData.semesterName}" added to ${currentAcadYear.acadYear}.`
      );
      fetchAcademicData();
      return true;
    } catch (error) {
      console.error("Error adding semester: ", error);
      toast.error("Failed to add semester.");
      return false;
    }
  };

  const handleSetActiveSemester = async (
    semesterToActivate,
    academicYearId
  ) => {
    setActionLoading(semesterToActivate.id);
    const batch = writeBatch(db);
    const semestersRef = collection(
      db,
      "academic_years",
      academicYearId,
      "semesters"
    );
    const academicYear = academicYears.find((ay) => ay.id === academicYearId);
    if (!academicYear) return;

    academicYear.semesters.forEach((sem) => {
      const semRef = doc(semestersRef, sem.id);
      if (sem.id === semesterToActivate.id) {
        batch.update(semRef, { status: "Active" });
      } else if (sem.status === "Active") {
        batch.update(semRef, { status: "Archived" });
      }
    });

    try {
      await batch.commit();
      toast.success(
        `${semesterToActivate.semesterName} is now the active semester.`
      );
      fetchAcademicData();
    } catch (error) {
      console.error("Error setting active semester:", error);
      toast.error("Failed to set active semester.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSemester = async (semesterToDelete, academicYearId) => {
    if (semesterToDelete.status === "Active") {
      toast.error("Cannot delete an active semester.");
      return;
    }
    const semRef = doc(
      db,
      "academic_years",
      academicYearId,
      "semesters",
      semesterToDelete.id
    );
    try {
      await deleteDoc(semRef);
      toast.success("Semester deleted successfully.");
      fetchAcademicData();
    } catch (error) {
      toast.error("Failed to delete semester.");
      console.error("Error deleting semester:", error);
    }
  };

  const openAddSemesterModal = (acadYear) => {
    setCurrentAcadYear(acadYear);
    setAddSemesterModalOpen(true);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Manage School Year and Semester
          </h1>
          <p className="text-muted-foreground">
            Manage school years and their corresponding semesters.
          </p>
        </div>
      </div>

      <div className="flex items-center py-4 gap-2">
        <AddAcademicYearModal
          onOpenChange={setAddAcadYearModalOpen}
          open={isAddAcadYearModalOpen}
          onAcademicYearAdded={handleAddAcademicYear}
          existingYears={academicYears.map((ay) => ay.acadYear)}
        />
      </div>

      <AddSemesterModal
        open={isAddSemesterModalOpen}
        onOpenChange={setAddSemesterModalOpen}
        activeAcadYear={currentAcadYear}
        existingSemesters={currentAcadYear?.semesters || []}
        onSemesterAdded={handleAddSemester}
      />

      {academicYears.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {academicYears.map((acadYear) => (
            <AcademicYearCard
              key={acadYear.id}
              acadYear={acadYear}
              onSetActive={handleSetActiveAcademicYear}
              onUpdate={handleUpdateAcademicYear}
              onDelete={handleDeleteAcademicYear}
              onAddSemesterClick={() => openAddSemesterModal(acadYear)}
              isActivating={actionLoading === acadYear.id}
              handleSetActiveSemester={handleSetActiveSemester}
              handleDeleteSemester={handleDeleteSemester}
              actionLoading={actionLoading}
              onDataRefresh={fetchAcademicData}
              existingYears={academicYears.map((ay) => ay.acadYear)}
            />
          ))}
        </div>
      ) : (
        <Card className="py-12 mt-4">
          <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No school years found.</p>
            <p className="text-sm text-muted-foreground">
              Click "Add School Year" to create one.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="w-full">
      <div className="mb-4">
        {/* header */}
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="flex items-center gap-2 py-4">
        <Skeleton className="h-9 w-40" />
      </div>
      {/* skeleton for academicyearcard */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-full mt-2" />
            {/* skeleton for semestercard */}
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
