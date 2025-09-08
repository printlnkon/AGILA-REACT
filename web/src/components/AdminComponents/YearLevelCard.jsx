import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Edit,
  MoreHorizontal,
  Trash2,
  LoaderCircle,
  Book,
} from "lucide-react";
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
  const [sectionCount, setSectionCount] = useState(yearLevel.sections?.length || 0);

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

  const handleSectionsLoaded = (count) => {
    setSectionCount(count);
  }
  
  return (
    <>
      <Card className="transition-all hover:shadow-lg overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Book className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold">
                {yearLevel.yearLevelName}
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="flex items-center gap-1">
                <span>
                  {sectionCount} {sectionCount === 1 ? "Section" : "Sections"}
                </span>
              </Badge>

              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer rounded-full hover:bg-primary/10"
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
          </div>
        </CardHeader>

        <CardContent className="m-4">
          {/* render the list of sections */}
          <SectionList
            yearLevel={yearLevel}
            course={course}
            session={session}
            onSectionsLoaded={handleSectionsLoaded}
          />
        </CardContent>
      </Card>

      {/* edit year level dialog*/}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
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
          <DialogFooter className="gap-2">
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
              {isSubmitting ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete year level dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-destructive">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              <span className="font-semibold">{yearLevel.yearLevelName}</span>"?
              This action cannot be undone and will remove all associated
              sections.
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
              {isSubmitting ? (
                <>
                  <span className="animate-spin">
                    <LoaderCircle />
                  </span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
