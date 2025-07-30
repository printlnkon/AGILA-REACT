import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, MoreHorizontal, Trash2, LoaderCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SectionList from "@/components/AdminComponents/SectionList";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function YearLevelCard({
  yearLevel,
  course,
  session,
  onEdit,
  onDelete,
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedName, setEditedName] = useState(yearLevel.yearLevelName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = async () => {
    setIsSubmitting(true);
    await onEdit(yearLevel, editedName);
    setIsSubmitting(false);
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await onDelete(yearLevel);
    setIsSubmitting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="transition-all hover:shadow-md flex flex-col">
        {/* card header */}
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{yearLevel.yearLevelName}</CardTitle>

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
                  <TooltipContent side="top">View More Actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowEditDialog(true)}
                    className="text-primary cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4 text-primary" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>
        </CardHeader>

        <Card className="flex flex-col w-full max-w-3xl mx-auto">
          <CardContent className="flex-grow">
            {/* render the list of sections */}
            <SectionList
              yearLevel={yearLevel}
              course={course}
              session={session}
            />
          </CardContent>
        </Card>
      </Card>

      {/* edit year level dialog*/}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Year Level</DialogTitle>
            <DialogDescription>
              Make changes to the year level name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2">Year Name</Label>
            <Select
              value={editedName}
              onValueChange={setEditedName}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
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
              onClick={handleEdit}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete year level dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              <strong>{yearLevel.yearLevelName}</strong>"? This action cannot be
              undone.
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
              onClick={handleDelete}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting && <LoaderCircle className="animate-spin" />}
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
