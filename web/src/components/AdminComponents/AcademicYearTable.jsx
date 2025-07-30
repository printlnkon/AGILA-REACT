import { useState, useEffect, useCallback } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import AddAcademicYearModal from "@/components/AdminComponents/AddAcademicYearModal";
import AcademicYearCard from "@/components/AdminComponents/AcademicYearCard";

export default function AcademicYearTable() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingAcadYearId, setActivatingAcadYearId] = useState(null);

  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const acadYearsColRef = collection(db, "academic_years");
      const q = query(acadYearsColRef, orderBy("acadYear", "desc"));
      const querySnapshot = await getDocs(q);
      const acadYearList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by status: Active > Upcoming > Archived
      acadYearList.sort((a, b) => {
        const statusOrder = { Active: 1, Upcoming: 2, Archived: 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      });

      setAcademicYears(acadYearList);
    } catch (error) {
      console.error("Error fetching academic years: ", error);
      toast.error("Failed to fetch academic years.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  const handleSetActive = async (acadYearToActivate) => {
    setActivatingAcadYearId(acadYearToActivate.id);
    const batch = writeBatch(db);
    const acadYearsRef = collection(db, "academic_years");

    // Find the current active year and archive it
    const currentActive = academicYears.find((ay) => ay.status === "Active");
    if (currentActive) {
      const activeDocRef = doc(acadYearsRef, currentActive.id);
      batch.update(activeDocRef, { status: "Archived" });
    }

    // Set the new year to active
    const newActiveDocRef = doc(acadYearsRef, acadYearToActivate.id);
    batch.update(newActiveDocRef, { status: "Active" });

    try {
      await batch.commit();
      toast.success(
        `${acadYearToActivate.acadYear} is now the active academic year.`
      );
      fetchAcademicYears(); // Refresh the list
    } catch (error) {
      console.error("Error setting active academic year: ", error);
      toast.error("Failed to set active academic year.");
    } finally {
      setActivatingAcadYearId(null);
    }
  };

  const handleEditAcademicYear = async (acadYearToEdit, newData) => {
    if (!newData.acadYear) {
      toast.error("Please fill out all fields.");
      return;
    }

    const acadYearRef = doc(db, "academic_years", acadYearToEdit.id);

    try {
      await updateDoc(acadYearRef, {
        ...newData,
        updatedAt: Timestamp.now(),
      });
      toast.success("Academic year updated successfully.");
      fetchAcademicYears(); // Refresh the list
    } catch (error) {
      console.error("Error updating academic year: ", error);
      toast.error("Failed to update academic year.");
    }
  };

  const handleDeleteAcademicYear = async (acadYearToDelete) => {
    if (acadYearToDelete.status === "Active") {
      toast.error(
        "Cannot delete an active academic year. Please set another year as active first."
      );
      return;
    }

    const acadYearRef = doc(db, "academic_years", acadYearToDelete.id);

    try {
      await deleteDoc(acadYearRef);
      toast.success("Academic year deleted successfully.");
      fetchAcademicYears();
    } catch (error) {
      console.error("Error deleting academic year: ", error);
      toast.error("Failed to delete academic year.");
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex items-center gap-2 py-4">
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-4 w-16 mt-1" />
                <div className="space-y-2 pt-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Academic Year</h1>
          <p className="text-muted-foreground">
            Add, edit, or delete academic years available in the system.
          </p>
        </div>
      </div>

      <div className="flex items-center py-4 gap-2">
        <AddAcademicYearModal onAcademicYearAdded={fetchAcademicYears} />
      </div>

      {/* Card Grid Layout */}
      {academicYears.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
          {academicYears.map((acadYear) => (
            <AcademicYearCard
              key={acadYear.id}
              acadYear={acadYear}
              onEdit={handleEditAcademicYear}
              onDelete={handleDeleteAcademicYear}
              onSetActive={handleSetActive}
              isActivating={activatingAcadYearId === acadYear.id}
              isActive={acadYear.status === "Active"}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No academic years found.</p>
            <p className="text-sm text-muted-foreground">
              Click "Add Academic Year" to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
