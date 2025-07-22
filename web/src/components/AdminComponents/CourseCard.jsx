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
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddCourseModal from "@/components/AdminComponents/AddCourseModal";

export default function CourseCard({ department, activeSession }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedCode, setEditedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    if (
      !department ||
      !department.id ||
      !activeSession ||
      !department.semesterId
    )
      return;

    setLoading(true);

    const coursesPath = `academic_years/${activeSession.id}/semesters/${department.semesterId}/departments/${department.id}/courses`;
    const coursesRef = collection(db, coursesPath);

    const unsubscribeCourses = onSnapshot(
      coursesRef,
      (snapshot) => {
        const coursesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          academicYearId: activeSession.id,
          semesterId: department.semesterId,
          departmentId: department.id,
        }));

        coursesList.sort((a, b) => a.courseName.localeCompare(b.courseName));

        setCourses(coursesList);
        setCourseCount(coursesList.length);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeCourses();
    };
  }, [department, activeSession]);

  const handleEditCourse = async () => {
    if (!editedCourse || !editedName.trim() || !editedCode.trim()) {
      toast.error("Course name and code cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const coursesRef = collection(
        db,
        `academic_years/${activeSession.id}/semesters/${department.semesterId}/departments/${department.id}/courses`
      );

      const qName = query(
        coursesRef,
        where("courseName", "==", editedName.trim())
      );
      const qCode = query(
        coursesRef,
        where("courseCode", "==", editedCode.trim())
      );

      const [nameSnapshot, codeSnapshot] = await Promise.all([
        getDocs(qName),
        getDocs(qCode),
      ]);

      if (!nameSnapshot.empty && nameSnapshot.docs[0].id !== editedCourse.id) {
        toast.error(`Course "${editedName.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      if (!codeSnapshot.empty && codeSnapshot.docs[0].id !== editedCourse.id) {
        toast.error(`Course code "${editedCode.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      const courseRef = doc(
        db,
        `academic_years/${activeSession.id}/semesters/${department.semesterId}/departments/${department.id}/courses`,
        editedCourse.id
      );

      await updateDoc(courseRef, {
        courseName: editedName.trim(),
        courseCode: editedCode.trim(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Course updated successfully.`);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!editedCourse) return;

    setIsSubmitting(true);

    try {
      const courseRef = doc(
        db,
        `academic_years/${activeSession.id}/semesters/${department.semesterId}/departments/${department.id}/courses`,
        editedCourse.id
      );

      await deleteDoc(courseRef);
      toast.success(
        `Course "${editedCourse.courseName}" deleted successfully.`
      );
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course. Please try again.");
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{department.departmentName}</CardTitle>
          <Badge className="bg-primary">
            {courseCount} {courseCount === 1 ? "Course" : "Courses"}
          </Badge>
        </div>
        <CardDescription className="flex items-center">
          Courses offered by this department.
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span>{course.courseName}</span>
                  <p className="text-xs text-muted-foreground">
                    {course.courseCode}
                  </p>
                </div>
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
                    onClick={() => openEditDialog(course)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(course)}
                    className="text-red-600 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {courses.length === 0 && !loading && (
            <div className="text-center py-4 text-muted-foreground">
              No courses added yet.
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 mt-auto flex">
        <AddCourseModal
          activeSession={activeSession}
          disabled={!activeSession || !activeSession.id}
          department={department}
        />
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Change the course details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseName" className="text-right">
                Course Name
              </Label>
              <Input
                id="courseName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode" className="text-right">
                Course Code
              </Label>
              <Input
                id="courseCode"
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
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
              onClick={handleEditCourse}
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
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete course "{editedCourse?.courseName}
              "? This action cannot be undone.
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
              onClick={handleDeleteCourse}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
