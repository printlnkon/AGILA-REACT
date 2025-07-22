import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit, MoreHorizontal, Trash2, Check } from "lucide-react";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function YearLevelCard({ yearLevel, onEdit, onDelete }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedName, setEditedName] = useState(yearLevel.yearLevelName);

  const handleEdit = () => {
    onEdit(yearLevel, editedName);
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    onDelete(yearLevel);
    setShowDeleteDialog(false);
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{yearLevel.yearLevelName}</CardTitle>
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
                  setEditedName(yearLevel.yearLevelName);
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
              {yearLevel.createdAt
                ? format(
                    yearLevel.createdAt.toDate
                      ? yearLevel.createdAt.toDate()
                      : new Date(yearLevel.createdAt),
                    "MMMM d, yyyy"
                  )
                : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>
              {yearLevel.updatedAt
                ? format(
                    yearLevel.updatedAt.toDate
                      ? yearLevel.updatedAt.toDate()
                      : new Date(yearLevel.updatedAt),
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
            <DialogTitle>Edit Year Level</DialogTitle>
            <DialogDescription>
              Make changes to the year level name.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Year Name
              </Label>
              <Select
                value={editedName}
                onValueChange={(value) => {
                  setEditedName(value);
                }}
                placeholder="e.g., 1st Year"
              >
                <SelectTrigger
                  id="yearLevelEditedSelect"
                  className="col-span-3 w-full"
                >
                  <SelectValue placeholder="Select a year level" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-primary cursor-pointer">
              <Check />
              Save Changes
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
              Are you sure you want to delete the year level "
              <strong>{yearLevel.yearLevelName}</strong>"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
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
              <Trash2 />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
