import { useState } from "react";
import { db } from "@/api/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  MoreHorizontal,
  LoaderCircle,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import the new components
import AddCourseModal from "@/components/AdminComponents/AddCourseModal";
import CourseList from "@/components/AdminComponents/CourseList";

export default function DepartmentCard({ department, onDelete }) {
  // State for this component is now much simpler
  const [showDeptEditDialog, setShowDeptEditDialog] = useState(false);
  const [showDeptDeleteDialog, setShowDeptDeleteDialog] = useState(false);
  const [editedDeptName, setEditedDeptName] = useState(
    department.departmentName
  );
  const [courseCount, setCourseCount] = useState(0); // State to hold the course count
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Department Handlers remain here
  const handleEditDepartment = async () => {
    if (!editedDeptName.trim()) {
      toast.error("Department name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const departmentsPath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments`;
      const departmentRef = doc(db, departmentsPath, department.id);
      await updateDoc(departmentRef, {
        departmentName: editedDeptName.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Department updated successfully.");
      setShowDeptEditDialog(false);
    } catch (error) {
      toast.error("Failed to update department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    setIsSubmitting(true);
    // Validation: Check if there are courses before deleting
    if (courseCount > 0) {
      toast.error(
        `Cannot delete "${department.departmentName}" because it has courses. Please remove all courses first.`
      );
      setIsSubmitting(false);
      setShowDeptDeleteDialog(false);
      return;
    }
    try {
      const departmentPath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments/${department.id}`;
      await deleteDoc(doc(db, departmentPath));
      toast.success(
        `Department "${department.departmentName}" deleted successfully.`
      );
      if (onDelete) onDelete(department.id);
      setShowDeptDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">
              {department.departmentName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {courseCount} {courseCount === 1 ? "Course" : "Courses"}
              </Badge>

              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      View More Actions
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowDeptEditDialog(true)}
                      className="text-primary cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4 text-primary" />
                      <span>Edit Department</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeptDeleteDialog(true)}
                      className="text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      <span>Delete Department</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>

          <CardDescription>
            Manage courses offered by this department.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pb-2">
          <CourseList
            department={department}
            onCourseCountChange={setCourseCount}
          />
        </CardContent>

        <CardFooter className="pt-2">
          <AddCourseModal
            department={department}
            activeSession={{
              id: department.academicYearId,
              semesterId: department.semesterId,
            }}
            disabled={!department.academicYearId}
          />
        </CardFooter>
      </Card>

      {/* edit department dialog */}
      <Dialog open={showDeptEditDialog} onOpenChange={setShowDeptEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the name of the department. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="deptName" className="mb-2">
              Department Name
            </Label>
            <Input
              id="deptName"
              value={editedDeptName}
              onChange={(e) => setEditedDeptName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeptEditDialog(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditDepartment}
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

      {/* delete department confirmation dialog */}
      <Dialog
        open={showDeptDeleteDialog}
        onOpenChange={setShowDeptDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              <strong>{department.departmentName}</strong>"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeptDeleteDialog(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
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
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
