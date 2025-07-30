import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  BookOpen,
  LoaderCircle,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CourseList({ department, onCourseCountChange }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedCode, setEditedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!department?.id || !department.academicYearId || !department.semesterId)
      return;

    setLoading(true);
    const coursesPath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments/${department.id}/courses`;
    const coursesRef = collection(db, coursesPath);

    const unsubscribe = onSnapshot(
      coursesRef,
      (snapshot) => {
        const coursesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        coursesList.sort((a, b) => a.courseName.localeCompare(b.courseName));

        setCourses(coursesList);
        onCourseCountChange(coursesList.length); // Send count back to parent
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [department, onCourseCountChange]);

  const handleEditCourse = async () => {
    if (!editedCourse || !editedName.trim() || !editedCode.trim()) {
      toast.error("Course name and code cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const coursesPath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments/${department.id}/courses`;
      const courseRef = doc(db, coursesPath, editedCourse.id);
      await updateDoc(courseRef, {
        courseName: editedName.trim(),
        courseCode: editedCode.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Course updated successfully.");
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!editedCourse) return;
    setIsSubmitting(true);
    try {
      const coursePath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments/${department.id}/courses/${editedCourse.id}`;
      await deleteDoc(doc(db, coursePath));
      toast.success(
        `Course "${editedCourse.courseName}" deleted successfully.`
      );
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (course) => {
    setEditedCourse(course);
    setEditedName(course.courseName);
    setEditedCode(course.courseCode);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (course) => {
    setEditedCourse(course);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No courses added yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="font-medium text-sm">{course.courseName}</span>
                <p className="text-xs text-muted-foreground">
                  {course.courseCode}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">View More Actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  {/* add list of student's menu */}
                  <DropdownMenuItem
                    onClick={() => openEditDialog(course)}
                    className="text-primary cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4 text-primary" />
                    <span>Edit Course</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(course)}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                    <span>Delete Course</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        ))}
      </div>

      {/* edit course dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Make changes to the course name and code here. Click save when
              you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="courseName" className="mb-2">
                Course Name
              </Label>
              <Input
                id="courseName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="courseCode" className="mb-2">
                Course Code
              </Label>
              <Input
                id="courseCode"
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
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
              onClick={handleEditCourse}
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

      {/* delete course dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              <strong>{editedCourse?.courseName}</strong>"?
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
              onClick={handleDeleteCourse}
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
                  <Trash2 />
                  Delete Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
