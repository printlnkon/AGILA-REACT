import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
  MoreHorizontal,
  Trash2,
  Check,
  LoaderCircle,
} from "lucide-react";
import { db } from "@/api/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddDepartmentCard({ department, onDelete }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedName, setEditedName] = useState(department.departmentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle editing a department
  const handleEditDepartment = async () => {
    if (!editedName.trim()) {
      toast.error("Department name cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const departmentsPath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments`;
      const departmentsRef = collection(db, departmentsPath);

      // Check if the new name already exists
      const q = query(
        departmentsRef,
        where("departmentName", "==", editedName.trim())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0].id !== department.id) {
        toast.error(`Department "${editedName.trim()}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      // Update the department
      const departmentRef = doc(db, departmentsPath, department.id);
      await updateDoc(departmentRef, {
        departmentName: editedName.trim(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Department updated successfully.");
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Failed to update department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a department
  const handleDeleteDepartment = async () => {
    setIsSubmitting(true);

    try {
      const departmentPath = `academic_years/${department.academicYearId}/semesters/${department.semesterId}/departments/${department.id}`;
      const departmentRef = doc(db, departmentPath);

      // Before deleting, you might want to check if there are programs under this department
      // and either prevent deletion or implement cascading delete

      await deleteDoc(departmentRef);
      toast.success(
        `Department "${department.departmentName}" deleted successfully.`
      );
      setShowDeleteDialog(false);

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(department);
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {/* icon - WILL BE IMPLEMENTED SOON */}
            {/* <Building className="h-5 w-5 text-primary" /> */}
            <CardTitle className="text-xl">
              {department.departmentName}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditedName(department.departmentName);
                  setShowEditDialog(true);
                }}
                className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-blue-600" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                <span>Delete Permanently</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>
              {department.createdAt
                ? format(
                    department.createdAt.toDate
                      ? department.createdAt.toDate()
                      : new Date(department.createdAt),
                    "MMMM d, yyyy"
                  )
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>
              {department.updatedAt
                ? format(
                    department.updatedAt.toDate
                      ? department.updatedAt.toDate()
                      : new Date(department.updatedAt),
                    "MMMM d, yyyy"
                  )
                : "-"}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Make changes to the department name.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departmentName" className="text-right">
                Department Name
              </Label>
              <Input
                id="departmentName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Computer Science"
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
              onClick={handleEditDepartment}
              className="bg-primary cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the department "
              <strong>{department.departmentName}</strong>"? This action cannot
              be undone.
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
              onClick={handleDeleteDepartment}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
