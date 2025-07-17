import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  MoreVertical,
  Check,
  BookOpen,
  Users,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddSectionModal from "@/components/AdminComponents/AddSectionModal";

export default function AddSectionCard({ yearLevel, activeSession }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedSection, setEditedSection] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionCount, setSectionCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    if (!yearLevel || !yearLevel.id || !activeSession || !yearLevel.semesterId)
      return;

    setLoading(true);

    // query sections under year level
    const sectionsRef = collection(
      db,
      `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/year_levels/${yearLevel.id}/sections`
    );

    const unsubscribeSections = onSnapshot(
      sectionsRef,
      (snapshot) => {
        const sectionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          academicYearId: activeSession.id,
          semesterId: yearLevel.semesterId,
          yearLevelId: yearLevel.id,
        }));

        // Sort sections alphabetically by name
        sectionsList.sort((a, b) => a.sectionName.localeCompare(b.sectionName));

        setSections(sectionsList);
        setSectionCount(sectionsList.length);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sections:", error);
        toast.error("Failed to load sections.");
        setLoading(false);
      }
    );

    // Get approximate student count (could be simplified or removed if not needed)
    // Update this to use the hierarchical path if students are also stored hierarchically
    const getStudentCount = async () => {
      try {
        const studentsQuery = query(
          collection(db, "students"),
          where("yearLevelId", "==", yearLevel.id)
        );
        const snapshot = await getDocs(studentsQuery);
        setStudentCount(snapshot.size);
      } catch (error) {
        console.error("Error getting student count:", error);
      }
    };

    getStudentCount();

    return () => {
      unsubscribeSections();
    };
  }, [yearLevel, activeSession]);

  // edit function
  const handleEditSection = async () => {
    if (!editedSection || !editedName.trim()) {
      toast.error("Section name cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Updated: Check if section name already exists in this year level
      const sectionsRef = collection(
        db,
        `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/year_levels/${yearLevel.id}/sections`
      );

      const q = query(
        sectionsRef,
        where("sectionName", "==", editedName.trim())
      );

      const querySnapshot = await getDocs(q);

      if (
        !querySnapshot.empty &&
        querySnapshot.docs[0].id !== editedSection.id
      ) {
        toast.error(`Section "${editedName.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      // Updated: Reference the section in the hierarchical path
      const sectionRef = doc(
        db,
        `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/year_levels/${yearLevel.id}/sections`,
        editedSection.id
      );

      await updateDoc(sectionRef, {
        sectionName: editedName.trim(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Section updated successfully to "${editedName}".`);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // delete function
  const handleDeleteSection = async () => {
    if (!editedSection) return;

    setIsSubmitting(true);

    try {
      // Updated: Reference the section in the hierarchical path
      const sectionRef = doc(
        db,
        `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/year_levels/${yearLevel.id}/sections`,
        editedSection.id
      );

      await deleteDoc(sectionsRef);
      toast.success(
        `Section "${editedSection.sectionName}" deleted successfully.`
      );
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (section) => {
    setEditedSection(section);
    setEditedName(section.sectionName);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (section) => {
    setEditedSection(section);
    setShowDeleteDialog(true);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{yearLevel.yearLevelName}</CardTitle>
          <Badge className="bg-primary">
            {sectionCount} {sectionCount === 1 ? "Section" : "Sections"}
          </Badge>
        </div>
        <CardDescription className="flex items-center">
          <Users className="h-3.5 w-3.5 mr-1" />
          {studentCount} Students
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{section.sectionName}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => openEditDialog(section)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(section)}
                    className="text-red-600 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {sections.length === 0 && !loading && (
            <div className="text-center py-4 text-muted-foreground">
              No sections added yet.
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <AddSectionModal
          activeSession={activeSession}
          disabled={!activeSession || !activeSession.id}
          yearLevel={yearLevel}
        />
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Change the section name below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionName" className="text-right">
                Section Name
              </Label>
              <Input
                id="sectionName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSection}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete section "
              {editedSection?.sectionName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSection}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
