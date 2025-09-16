import { db } from "@/api/firebase";
import {
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, X, LoaderCircle, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="text-sm text-destructive mt-1 flex items-center gap-1">
      <X className="w-4 h-4" />
      {message}
    </div>
  );
};

const validateForm = (data) => {
  const errors = {};

  if (!data.subjectCode || data.subjectCode.trim() === "") {
    errors.subjectCode = "Subject code is required";
  } else if (data.subjectCode.length < 2) {
    errors.subjectCode = "Subject code must be at least 2 characters";
  }

  if (!data.subjectName || data.subjectName.trim() === "") {
    errors.subjectName = "Subject name is required";
  } else if (data.subjectName.length < 3) {
    errors.subjectName = "Subject name must be at least 3 characters";
  }

  if (!data.units || data.units === "") {
    errors.units = "Please select a unit value";
  }

  return errors;
};

const updateScheduleReferences = async (
  academicYearId,
  semesterId,
  subjectId,
  updatedSubjectData
) => {
  try {
    const schedulesPath = `academic_years/${academicYearId}/semesters/${semesterId}/schedules`;

    // query all schedule entries that reference this subject
    const scheduleQuery = query(
      collection(db, schedulesPath),
      where("subjectId", "==", subjectId)
    );

    const scheduleSnapshot = await getDocs(scheduleQuery);

    // Update each schedule document with the new subject information
    const updatePromises = scheduleSnapshot.docs.map((scheduleDoc) => {
      return updateDoc(doc(db, schedulesPath, scheduleDoc.id), {
        subjectCode: updatedSubjectData.subjectCode,
        subjectName: updatedSubjectData.subjectName,
      });
    });

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    if (updatePromises.length > 0) {
      toast.success(
        `Updated ${updatePromises.length} schedule entries with new subject data`
      );
    }
  } catch (error) {
    console.error("Error updating schedule references:", error);
    toast.error("Failed to update schedule references");
    throw error;
  }
};

const handleScheduleReferencesForDeletion = async (
  academicYearId,
  semesterId,
  subjectId
) => {
  try {
    const schedulesPath = `academic_years/${academicYearId}/semesters/${semesterId}/schedules`;

    // Query all schedule entries that reference this subject
    const scheduleQuery = query(
      collection(db, schedulesPath),
      where("subjectId", "==", subjectId)
    );

    const scheduleSnapshot = await getDocs(scheduleQuery);

    const updatePromises = scheduleSnapshot.docs.map((scheduleDoc) => {
      return updateDoc(doc(db, schedulesPath, scheduleDoc.id), {
        subjectId: "deleted",
        subjectCode: "[DELETED]",
        subjectName: "Deleted Subject",
        isSubjectDeleted: true,
      });
    });

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    if (updatePromises.length > 0) {
      console.log(
        `Updated ${updatePromises.length} schedule entries for deleted subject`
      );
    }
  } catch (error) {
    console.error("Error handling schedule references for deletion:", error);
    throw error;
  }
};

const sendProgramHeadNotification = async (subject, actionType) => {
  try {
    const programHeadsQuery = query(
      collection(db, "users/program_head/accounts"),
      where("departmentName", "==", subject.departmentName)
    );

    const programHeadsSnapshot = await getDocs(programHeadsQuery);

    if (programHeadsSnapshot.empty) {
      console.log(
        "No program head found for department:",
        subject.departmentName
      );
      return;
    }

    // create notifications for each program head
    const notificationPromises = programHeadsSnapshot.docs.map(
      async (phDoc) => {
        const programHeadId = phDoc.id;

        // create notification
        return addDoc(collection(db, "notifications"), {
          userId: programHeadId,
          userType: "program_head",
          title: `Subject ${actionType === "edit" ? "Modified" : "Deleted"}`,
          message: `An administrator has ${
            actionType === "edit" ? "modified" : "deleted"
          } the approved subject "${subject.subjectCode} - ${
            subject.subjectName
          }"`,
          subjectId: subject.id,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          departmentName: subject.departmentName,
          courseName: subject.courseName,
          yearLevelName: subject.yearLevelName,
          createdAt: serverTimestamp(),
          read: false,
        });
      }
    );

    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error("Error sending program head notification:", error);
    return false;
  }
};

export default function SubjectCard({
  subject,
  onSubjectUpdated,
  onSubjectDeleted,
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [subjectFormData, setSubjectFormData] = useState({
    ...subject,
    units: subject.units.toString(),
    withLaboratory: subject.withLaboratory || false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if the subject is approved to conditionally disable actions
  const isApproved = subject.status === "Approved";

  // Reset form data when dialog opens or closes
  useEffect(() => {
    if (editDialogOpen) {
      setSubjectFormData({
        ...subject,
        units: subject.units.toString(),
        withLaboratory: subject.withLaboratory || false,
      });
      setFormErrors({});
    }
  }, [editDialogOpen, subject]);

  // Handle form input changes for edit dialog
  const handleChange = (e) => {
    const { id, value } = e.target;
    setSubjectFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value) => {
    setSubjectFormData((prev) => ({ ...prev, units: value }));
    if (formErrors.units) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.units;
        return newErrors;
      });
    }
  };

  // edit subject form submission
  const handleEditSubject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm(subjectFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      toast.error("Please fix the form errors");
      return;
    }

    try {
      // Validate that all required path segments are available
      if (
        !subject.academicYearId ||
        !subject.semesterId ||
        !subject.departmentId ||
        !subject.courseId ||
        !subject.yearLevelId ||
        !subject.id
      ) {
        throw new Error("Missing required metadata for subject update");
      }

      const updateData = {
        subjectCode: subjectFormData.subjectCode,
        subjectName: subjectFormData.subjectName,
        description: subjectFormData.description,
        units: parseFloat(subjectFormData.units),
        withLaboratory: subjectFormData.withLaboratory,
        status: "Pending",
      };

      const subjectPath = `academic_years/${subject.academicYearId}/semesters/${subject.semesterId}/departments/${subject.departmentId}/courses/${subject.courseId}/year_levels/${subject.yearLevelId}/subjects/${subject.id}`;

      await updateDoc(doc(db, subjectPath), updateData);

      await updateScheduleReferences(
        subject.academicYearId,
        subject.semesterId,
        subject.id,
        {
          subjectCode: subjectFormData.subjectCode,
          subjectName: subjectFormData.subjectName,
        }
      );

      onSubjectUpdated({
        id: subject.id,
        ...updateData,
      });

      toast.success("Subject updated successfully");
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating subject:", err);
      toast.error("Failed to update subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  // delete subject confirmation
  const handleDeleteSubject = async () => {
    try {
      const subjectPath = `academic_years/${subject.academicYearId}/semesters/${subject.semesterId}/departments/${subject.departmentId}/courses/${subject.courseId}/year_levels/${subject.yearLevelId}/subjects/${subject.id}`;

      await handleScheduleReferencesForDeletion(
        subject.academicYearId,
        subject.semesterId,
        subject.id
      );

      await deleteDoc(doc(db, subjectPath));

      onSubjectDeleted(subject.id);

      toast.success("Subject deleted successfully");
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Error deleting subject:", err);
      toast.error("Failed to delete subject");
    }
  };

  // initiating edit for approved subjects
  const handleInitiateEdit = () => {
    if (isApproved) {
      setActionType("edit");
      setApprovalDialogOpen(true);
    } else {
      setEditDialogOpen(true);
    }
  };

  // initiating delete for approved subjects
  const handleInitiateDelete = () => {
    if (isApproved) {
      setActionType("delete");
      setApprovalDialogOpen(true);
    } else {
      setShowDeleteDialog(true);
    }
  };

  // confirmation of action on approved subject
  const handleApprovedAction = async () => {
    setApprovalDialogOpen(false);

    // Notify program head
    const notificationSent = await sendProgramHeadNotification(
      subject,
      actionType
    );

    if (!notificationSent) {
      toast.warning(
        "Could not notify Program Head, but proceeding with action."
      );
    } else {
      toast.success("Program Head has been notified of this action.");
    }

    // proceed with the selected action
    if (actionType === "edit") {
      setEditDialogOpen(true);
    } else if (actionType === "delete") {
      setShowDeleteDialog(true);
    }
  };

    return (
    <>
      <Card className="w-full transition-all hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">
                {subject.subjectCode} - {subject.subjectName}
              </CardTitle>
            </div>

            {/* actions and badges container */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                className={
                  subject.status === "Approved"
                    ? "bg-green-600 text-white"
                    : subject.status === "Pending"
                    ? "bg-orange-600 text-white"
                    : subject.status === "Rejected"
                    ? "bg-red-600 text-white"
                    : "bg-gray-300 text-black"
                }
              >
                {subject.status || "Pending"}
              </Badge>
              <Badge className="font-medium">Units: {subject.units}</Badge>
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
                  {/* edit & delete actions */}
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleInitiateEdit}
                      className="text-primary cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4 text-primary" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleInitiateDelete}
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
          <CardDescription className="pt-2">
            {subject.withLaboratory && (
              <Badge variant="secondary" className="mb-2">
                w/ Laboratory
              </Badge>
            )}
            <div>{subject.description}</div>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* approval confirmation dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              Modifying Approved Subject
            </DialogTitle>
            <DialogDescription>
              You are about to {actionType === "edit" ? "modify" : "delete"} an
              approved subject. This action will notify the Program Head and
              change the subject's status back to Pending.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                setApprovalDialogOpen(false);
                toast.info(
                  `Action to ${actionType} this approved subject has been cancelled.`
                );
              }}
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleApprovedAction}>
              Proceed and Notify
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* edit subject dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-full sm:max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject information. All fields marked with{" "}
              <span className="text-destructive">*</span> are required.
              {isApproved && (
                <div className="mt-2 text-amber-600">
                  This subject was previously approved. After editing, it will
                  return to Pending status and require re-approval.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubject}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* subject code */}
              <div className="space-y-1">
                <Label htmlFor="subjectCode">
                  Subject Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subjectCode"
                  placeholder="e.g. CS101"
                  required
                  value={subjectFormData.subjectCode}
                  onChange={handleChange}
                />
                <FormError message={formErrors.subjectCode} />
              </div>

              {/* subject name */}
              <div className="space-y-1">
                <Label htmlFor="subjectName">
                  Subject Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subjectName"
                  placeholder="e.g. Introduction to Programming"
                  required
                  value={subjectFormData.subjectName}
                  onChange={handleChange}
                />
                <FormError message={formErrors.subjectName} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* units */}
              <div className="space-y-1">
                <Label htmlFor="units">
                  Units <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={subjectFormData.units.toString()}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select unit value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="1.5">1.5</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
                <FormError message={formErrors.units} />
              </div>
              {/* w/ laboratory checkbox */}
              <div className="space-y-1 flex items-center gap-2 mt-2">
                <Label htmlFor="withLaboratory">W/ Laboratory</Label>
                <Checkbox
                  id="withLaboratory"
                  checked={subjectFormData.withLaboratory}
                  onCheckedChange={(checked) => {
                    setSubjectFormData((prev) => ({
                      ...prev,
                      withLaboratory: checked,
                    }));
                  }}
                />
              </div>
            </div>

            {/* description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter a brief description of the subject"
                value={subjectFormData.description}
                onChange={handleChange}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => {
                  setEditDialogOpen(false);
                  toast.info(
                    `Editing "${subject.subjectCode} - ${subject.subjectName}" has been cancelled.`
                  );
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">
                      <LoaderCircle />
                    </span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {subject.subjectName} ({subject.subjectCode})
              </strong>
              ? This action cannot be undone.
              {isApproved && (
                <p className="mt-2 text-amber-600">
                  This is an approved subject. The Program Head has been
                  notified of this deletion.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteSubject}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}