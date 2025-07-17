import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Edit,
  MoreHorizontal,
  Trash2,
  Check,
  LoaderCircle,
} from "lucide-react";

export default function AddAcademicYearCard({
  acadYear,
  onEdit,
  onDelete,
  onSetActive,
  isActivating = false,
  isActive = false,
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toDate = (timestamp) => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  };

  const [editedAcadYear, setEditedAcadYear] = useState({
    acadYear: acadYear.acadYear,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAcadYear((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    onEdit(acadYear, editedAcadYear);
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    onDelete(acadYear);
    setShowDeleteDialog(false);
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      Active: {
        variant: "default",
        className: "bg-green-600 text-white",
      },
      Archived: {
        variant: "default",
        className: "bg-red-600 text-white",
      },
      Upcoming: {
        variant: "outline",
        className: "bg-blue-900 text-white",
      },
    };
    return statusConfig[status] || statusConfig.Upcoming;
  };

  // Use the isActive prop that is passed from the parent
  const statusConfig = getStatusConfig(acadYear.status);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{acadYear.acadYear}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 cursor-pointer"
                disabled={isActivating}
              >
                <span className="sr-only">Open menu</span>
                {isActivating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-6 w-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isActive && (
                <>
                  <DropdownMenuItem
                    onClick={() => onSetActive(acadYear)}
                    className="text-green-600 hover:text-green-700 focus:text-green-700 hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                    disabled={isActive || isActivating}
                  >
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    <span>Set as Active</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setShowEditDialog(true)}
                className="text-blue-600 hover:text-blue-700 focus:text-blue-700 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4 text-blue-600" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                disabled={isActive}
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          <Badge
            variant={statusConfig.variant}
            className={statusConfig.className}
          >
            {acadYear.status}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date Created:</span>
            <span>
              {acadYear.createdAt
                ? format(toDate(acadYear.createdAt), "MMMM d, yyyy")
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>
              {acadYear.updatedAt
                ? format(toDate(acadYear.updatedAt), "MMMM d, yyyy")
                : "-"}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-blue-900">
              Edit Academic Year
            </DialogTitle>
            <DialogDescription>
              Make changes to the academic year details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acadYear" className="text-right">
                Academic Year
              </Label>
              <Input
                id="acadYear"
                name="acadYear"
                value={editedAcadYear.acadYear}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g., S.Y - 2024-2025"
              />
            </div>
          </div>
          {/* cancel and save btn */}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowEditDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} className="cursor-pointer bg-primary">
              <Check /> Save Changes
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
              Are you sure you want to delete the academic year "
              <strong>{acadYear.acadYear}</strong>"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
