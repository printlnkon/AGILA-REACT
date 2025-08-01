import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { Edit, Trash2, MoreVertical, LoaderCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddSectionModal from "@/components/AdminComponents/AddSectionModal";

export default function SectionList({ yearLevel, course, session }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedSection, setEditedSection] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // this check ensures the component doesn't crash if props are temporarily missing during render
  if (!session?.id || !course?.id || !yearLevel?.id) {
    return (
      <div className="text-center text-xs text-muted-foreground">
        Loading sections...
      </div>
    );
  }

  const sectionsPath = `academic_years/${session.id}/semesters/${session.semesterId}/departments/${session.departmentId}/courses/${course.id}/year_levels/${yearLevel.id}/sections`;

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, sectionsPath),
      (snapshot) => {
        const sectionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSections(
          sectionsList.sort((a, b) =>
            a.sectionName.localeCompare(b.sectionName)
          )
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sections:", error);
        toast.error("Failed to load sections.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [sectionsPath]);

  const handleEditSection = async () => {
    if (!editedName.trim()) return;
    setIsSubmitting(true);
    const sectionRef = doc(db, sectionsPath, editedSection.id);
    await updateDoc(sectionRef, {
      sectionName: editedName.trim(),
      updatedAt: serverTimestamp(),
    });
    toast.success("Section updated successfully.");
    setShowEditDialog(false);
    setIsSubmitting(false);
  };

  const handleDeleteSection = async () => {
    setIsSubmitting(true);
    const sectionRef = doc(db, sectionsPath, editedSection.id);
    await deleteDoc(sectionRef);
    toast.success("Section deleted successfully.");
    setShowDeleteDialog(false);
    setIsSubmitting(false);
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
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-lg">Sections</h4>
          <Badge className="rounded-md">{sections.length}</Badge>
        </div>

        {sections.length === 0 && !loading && (
          <p className="text-sm text-center text-muted-foreground py-2">
            No sections yet. Click "Add Section" to get started.
          </p>
        )}
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
          >
            <p className="text-sm">{section.sectionName}</p>

            <TooltipProvider>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">View More Actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => openEditDialog(section)}
                    className="text-primary cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(section)}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <AddSectionModal
          course={course}
          yearLevel={yearLevel}
          session={session}
        />
      </div>

      {/* edit section dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the name of the section.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2">Section Name</Label>
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
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
                <>
                  <span className="animate-spin">
                    <LoaderCircle />
                  </span>
                  Saving...
                </>
              ) : (
                <>
                  <Check /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete section dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              <strong>{editedSection?.sectionName}</strong>"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
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
                <>
                  <span className="animate-spin">
                    <LoaderCircle />
                  </span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 /> Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
