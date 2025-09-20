import { db } from "@/api/firebase";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Check,
  X,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  History,
  Layers,
  ChevronDown,
  BookText,
} from "lucide-react";
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  where,
  updateDoc,
  getDocs,
  serverTimestamp,
  limit,
  addDoc,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination";
import { useProgramHeadProfile } from "@/context/ProgramHeadProfileContext";
import SubjectApprovalCard from "@/components/ProgramHeadComponents/SubjectApprovalCard";

// A reusable skeleton placeholder component
const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      {...props}
    />
  );
};

// layout of SubjectApprovalCard
const SkeletonCard = () => (
  <div className="border bg-background rounded-lg p-4 flex flex-col justify-between h-full">
    {/* Card Header */}
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3 w-full">
        <Skeleton className="h-5 w-5 rounded mt-1" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>

    {/* Card Content */}
    <div className="space-y-2 py-4 pl-8">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>

    {/* Card Footer */}
    <div className="flex justify-end gap-2 border-t pt-4">
      <Skeleton className="h-9 w-24 rounded-md" />
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
  </div>
);

// The main skeleton layout for the entire page
const SubjectApprovalSkeleton = () => {
  return (
    <div className="w-full p-4 space-y-4">
      {/* Header */}
      <div className="mb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* Department Card */}
      <Skeleton className="h-18 w-full" />

      {/* Filter/Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <Skeleton className="h-10 w-full sm:w-64 rounded-md" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-md" />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-4 gap-2">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
};

// status badge
const StatusBadge = ({ status }) => {
  const statusMap = {
    Pending: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-3 w-3" />,
    },
    Approved: {
      color: "bg-green-100 text-green-800",
      icon: <Check className="h-3 w-3" />,
    },
    Rejected: {
      color: "bg-red-100 text-red-800",
      icon: <X className="h-3 w-3" />,
    },
  };

  const style = statusMap[status] || statusMap["Pending"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.color}`}
    >
      {style.icon}
      <span className="ml-1">{status}</span>
    </span>
  );
};

// detailed subject view modal component
const SubjectDetailModal = ({
  subject,
  onClose,
  onApprove,
  onReject,
  isLoading,
}) => {
  if (!subject) return null;

  const Field = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center">
      <p className="w-full sm:w-1/3 text-sm text-muted-foreground">{label}</p>
      <div className="w-full sm:w-2/3 font-medium">{children}</div>
    </div>
  );

  return (
    <Dialog open={!!subject} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {subject.subjectCode} - {subject.subjectName}
          </DialogTitle>
          <DialogDescription>
            Detailed information of the subject.
          </DialogDescription>
        </DialogHeader>

        {/* scrollable content area */}
        <div className="max-h-[65vh] overflow-y-auto pr-4 space-y-6 py-2">
          {/* basic information section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">
              Basic Information
            </h3>
            <div className="space-y-2">
              <Field label="Department">
                <p>{subject.departmentName || "—"}</p>
              </Field>
              <Field label="Course">
                <p>{subject.courseName || "—"}</p>
              </Field>
              <Field label="Year Level">
                <p>{subject.yearLevelName || "—"}</p>
              </Field>
              <Field label="Units">
                <p>{subject.units || "—"}</p>
              </Field>
              {subject.withLaboratory && (
                <Field label="Laboratory">
                  <p>w/ Laboratory</p>
                </Field>
              )}
            </div>
          </div>

          {/* description section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">Description</h3>
            <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">
              {subject.description || "No description provided."}
            </p>
          </div>

          {/* status & history section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">
              Status Information
            </h3>
            <div className="space-y-2">
              <Field label="Current Status">
                <StatusBadge status={subject.status} />
              </Field>
              <Field label="Created By">
                <div className="flex items-center">
                  {subject.createdBy.userRole && (
                    <span>{subject.createdBy.userName}</span>
                  )}
                </div>
              </Field>
              <Field label="Created At">
                <p>
                  {subject.createdAt
                    ? subject.createdAt.toDate().toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true, // AM/PM
                      })
                    : "—"}
                </p>
              </Field>
            </div>

            {/* status history timeline */}
            {subject.statusHistory && subject.statusHistory.length > 0 && (
              <div className="pt-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <History className="h-4 w-4" />
                  Status History
                </h4>
                <div className="border-l-2 pl-6 relative space-y-4">
                  {subject.statusHistory.map((item, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[33px] top-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
                      <p className="text-sm font-medium">
                        <StatusBadge status={item.status} />
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.timestamp
                            ? item.timestamp.toDate().toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true, // AM/PM
                              })
                            : "—"}
                        </span>
                      </p>
                      {item.comment && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{item.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pb-2 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">
            Close
          </Button>

          <div className="flex gap-2">
            {/* conditionally render approve/reject buttons */}
            {subject.status === "Pending" && (
              <>
                <Button
                  onClick={() => onReject(subject)}
                  className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button
                  onClick={() => onApprove(subject)}
                  className="bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// confirmation dialog for subject actions
const ConfirmActionDialog = ({
  isOpen,
  onClose,
  subject,
  action,
  onConfirm,
  isLoading,
}) => {
  const [remarks, setRemarks] = useState("");

  // reset remarks when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRemarks("");
    }
  }, [isOpen]);

  if (!subject) return null;

  const isApprove = action === "Approved";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Approve Subject" : "Reject Subject"}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? "This subject will be available for scheduling and other operations."
              : "This subject will be marked as rejected and won't be available for use."}
          </DialogDescription>
        </DialogHeader>

        {/* display subject details */}
        <div className="py-4 space-y-4">
          <Card className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-4">
              <div className="pt-0.5">
                <BookText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">
                  {subject.subjectCode} - {subject.subjectName}
                </p>
                <p className="text-sm text-muted-foreground">
                  • {subject.departmentName}
                </p>
                <p className="text-sm text-muted-foreground">
                  • {subject.courseName}
                </p>
                <p className="text-sm text-muted-foreground">
                  • {subject.yearLevelName}
                </p>
              </div>
            </div>
          </Card>

          {/* Remarks section */}
          <div className="space-y-1.5">
            <label htmlFor="remarks" className="text-sm font-medium">
              Remarks (Optional)
            </label>
            <p className="text-xs text-muted-foreground">
              Your remarks will be recorded in the subject's status history.
            </p>
            <Textarea
              id="remarks"
              placeholder="Provide a reason for your decision..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            className={
              isApprove
                ? "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                : "bg-red-500 text-white cursor-pointer hover:bg-red-600"
            }
            onClick={() => onConfirm(subject, action, remarks)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isApprove ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {isApprove ? "Approve Subject" : "Reject Subject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// conflict resolution dialog
const ConflictDialog = ({
  conflicts,
  subject,
  onClose,
  onProceed,
  onCancel,
  isLoading,
}) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <Dialog open={!!conflicts.length} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Conflict Subject Detected
          </DialogTitle>
          <DialogDescription>
            Approving this subject may create duplicates. Please review the
            conflicts below.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-auto pr-2">
          <div className="space-y-4">
            <div className="p-3 border rounded-md">
              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  <BookText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">
                    {subject.subjectCode} - {subject.subjectName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • {subject.departmentName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • {subject.courseName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • {subject.yearLevelName}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="font-medium">
              Conflicting Subjects ({conflicts.length}):
            </h3>
            <div className="space-y-3">
              {conflicts.map((conflict, i) => (
                <div key={i} className="border rounded-md p-3 relative pl-5">
                  {/* red accent bar */}
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-destructive rounded-l-md" />
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-semibold text-destructive mb-1.5">
                        {conflict.conflictType}
                      </p>
                      <p>
                        {/* conditionally display only the conflicting information */}
                        {conflict.conflictType
                          .toLowerCase()
                          .includes("code") ? (
                          <>
                            <span className="font-semibold">
                              {conflict.subjectCode}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">
                              {conflict.subjectName}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={conflict.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            variant="destructive"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// batch action confirmation dialog
const BatchActionDialog = ({
  isOpen,
  onClose,
  selectedCount,
  action,
  onConfirm,
  isLoading,
}) => {
  const [remarks, setRemarks] = useState("");

  // reset remarks when the dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRemarks("");
    }
  }, [isOpen]);

  // handle pluralization of the word "subject"
  const subjectText = `Subject${selectedCount > 1 ? "s" : ""}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "Approved"
              ? `Batch Approve ${subjectText}`
              : `Batch Reject ${subjectText}`}
          </DialogTitle>
          <DialogDescription>
            You are about to {action === "Approved" ? "approve" : "reject"}{" "}
            {selectedCount} {subjectText.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <label htmlFor="batchRemarks" className="text-sm font-medium">
              Remarks (Optional - will be applied to all selected subjects)
            </label>
            <Textarea
              id="batchRemarks"
              placeholder="Add remarks for all subjects..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            className={
              action === "Approved"
                ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                : "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
            }
            onClick={() => onConfirm(remarks)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : action === "Approved" ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {action === "Approved"
              ? `Approve ${selectedCount} ${subjectText}`
              : `Reject ${selectedCount} ${subjectText}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SubjectApproval() {
  const { currentUser } = useAuth();
  const { selectedProgramHead, setSelectedProgramHead } =
    useProgramHeadProfile();
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [detailSubject, setDetailSubject] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  // batch actions
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState(null);

  // Filtering and sorting
  const [filters, setFilters] = useState({
    search: "",
    yearLevel: "",
    sortOrder: "desc",
    status: "Pending",
  });

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectsPerPage, setSubjectsPerPage] = useState(6);

  // for filtering options
  const [availableYearLevels, setAvailableYearLevels] = useState([]);

  // filter popover
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // Logic to get department name
  const cacheMatchesUser =
    !!selectedProgramHead &&
    !!currentUser?.email &&
    selectedProgramHead.email === currentUser.email;

  const [deptName, setDeptName] = useState(
    cacheMatchesUser ? selectedProgramHead.departmentName || null : null
  );

  // If the cached profile doesn't match this user, drop it
  useEffect(() => {
    if (!cacheMatchesUser && selectedProgramHead) {
      setSelectedProgramHead(null); // clears localStorage via your context
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheMatchesUser]);

  // If context later provides a matching profile, adopt it
  useEffect(() => {
    if (cacheMatchesUser && selectedProgramHead?.departmentName) {
      setDeptName(selectedProgramHead.departmentName);
    }
  }, [cacheMatchesUser, selectedProgramHead]);

  // Fallback: fetch Program Head doc by the signed-in user's email
  useEffect(() => {
    const run = async () => {
      if (deptName) return;
      if (!currentUser?.email) return;

      try {
        const q = query(
          collection(db, "users/program_head/accounts"),
          where("email", "==", currentUser.email),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          if (docData?.departmentName) {
            setDeptName(docData.departmentName);
            // cache the correct profile for this user
            setSelectedProgramHead(docData);
          }
        }
      } catch (e) {
        console.warn("[PH fallback] lookup failed:", e);
      }
    };
    run();
  }, [deptName, currentUser, setSelectedProgramHead]);

  // Extract unique year levels for filtering
  useEffect(() => {
    if (pendingSubjects.length > 0) {
      const yearLevels = [
        ...new Set(pendingSubjects.map((s) => s.yearLevelName).filter(Boolean)),
      ];

      setAvailableYearLevels(
        yearLevels.sort((a, b) => {
          // Sort year levels numerically if they start with numbers
          const aMatch = a.match(/^(\d+)/);
          const bMatch = b.match(/^(\d+)/);
          if (aMatch && bMatch) {
            return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
          }
          return a.localeCompare(b);
        })
      );
    }
  }, [pendingSubjects]);

  // Fetch subjects based on filters
  useEffect(() => {
    // Do not run the query if there is no department name.
    if (!deptName) {
      setLoading(false);
      return;
    }

    const constraints = [];

    // Add status filter - only if not set to "All"
    if (filters.status !== "All") {
      constraints.push(where("status", "==", filters.status));
    }

    constraints.push(where("departmentName", "==", deptName));

    const q = query(collectionGroup(db, "subjects"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subjectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
        }));
        setPendingSubjects(subjectsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching subjects: ", error);
        toast.error("Failed to fetch subjects. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deptName, filters.status]);

  // Apply filters and sorting to subjects
  const filteredSubjects = useMemo(() => {
    return pendingSubjects
      .filter((subject) => {
        // Text search filter
        const matchesSearch =
          !filters.search ||
          subject.subjectName
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          subject.subjectCode
            .toLowerCase()
            .includes(filters.search.toLowerCase());

        // Year level filter
        const matchesYearLevel =
          !filters.yearLevel || subject.yearLevelName === filters.yearLevel;

        return matchesSearch && matchesYearLevel;
      })
      .sort((a, b) => {
        const direction = filters.sortOrder === "asc" ? 1 : -1;
        // Simplified sorting by creation date
        return (
          direction *
          ((a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0))
        );
      });
  }, [pendingSubjects, filters]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, subjectsPerPage]);

  // Toggle subject selection for batch actions
  const toggleSelectSubject = (subjectId) => {
    const newSelection = new Set(selectedSubjects);
    if (newSelection.has(subjectId)) {
      newSelection.delete(subjectId);
    } else {
      newSelection.add(subjectId);
    }
    setSelectedSubjects(newSelection);
  };

  // Select or deselect all visible subjects
  const toggleSelectAll = () => {
    if (selectedSubjects.size === filteredSubjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(filteredSubjects.map((s) => s.id)));
    }
  };

  // Open the detail view for a subject
  const openDetailView = (subject) => {
    setDetailSubject(subject);
  };

  // Close the detail view
  const closeDetailView = () => {
    setDetailSubject(null);
  };

  // Initiate subject approval/rejection process
  const initiateAction = (subject, action) => {
    setSelectedSubject(subject);
    setSelectedAction(action);
    setConfirmDialogOpen(true);
  };

  // Check for conflicts before approving a subject
  const checkForConflicts = async (subject) => {
    try {
      const potentialConflicts = [];

      // Check for duplicate subject code in approved subjects
      const subjectCodeQuery = query(
        collectionGroup(db, "subjects"),
        where("subjectCode", "==", subject.subjectCode),
        where("status", "==", "Approved")
      );

      const subjectCodeSnapshot = await getDocs(subjectCodeQuery);

      if (!subjectCodeSnapshot.empty) {
        const conflictingSubjects = subjectCodeSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            conflictType: "Duplicate subject code",
          }))
          .filter((s) => s.id !== subject.id);

        potentialConflicts.push(...conflictingSubjects);
      }

      // Check for duplicate subject name in the same department
      if (subject.departmentName) {
        const subjectNameQuery = query(
          collectionGroup(db, "subjects"),
          where("subjectName", "==", subject.subjectName),
          where("departmentName", "==", subject.departmentName),
          where("status", "==", "Approved")
        );

        const subjectNameSnapshot = await getDocs(subjectNameQuery);

        if (!subjectNameSnapshot.empty) {
          const conflictingSubjects = subjectNameSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              conflictType: "Duplicate subject name in the same department",
            }))
            .filter((s) => s.id !== subject.id);

          potentialConflicts.push(...conflictingSubjects);
        }
      }

      return potentialConflicts;
    } catch (error) {
      console.error("Error checking for conflicts:", error);
      return [];
    }
  };

  // Handle the confirmation of a subject action (approve/reject)
  const handleConfirmAction = async (subject, action, comment) => {
    setIsSubmitting(true);

    try {
      // For approvals, check for conflicts first
      if (action === "Approved") {
        const conflictResults = await checkForConflicts(subject);

        if (conflictResults.length > 0) {
          setConflicts(conflictResults);
          setConfirmDialogOpen(false);
          return; // Stop here and wait for user to resolve conflicts
        }
      }

      await updateSubjectStatus(subject, action, comment);
      setConfirmDialogOpen(false);

      toast.success(`Subject ${action.toLowerCase()} successfully`);
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} subject:`, error);
      toast.error(
        `Failed to ${action.toLowerCase()} subject. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel the conflict resolution
  const handleCancelConflictResolution = () => {
    setConflicts([]);
  };

  // Update subject status in Firestore
  const updateSubjectStatus = async (subject, newStatus, comment = "") => {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    await updateDoc(subject.ref, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid,
      statusComment: comment || "",
      statusHistory: [
        ...(subject.statusHistory || []),
        {
          status: newStatus,
          timestamp: new Date(),
          updatedBy: currentUser.uid,
          comment: comment || "",
        },
      ],
    });

    try {
      await addDoc(collection(db, "notifications"), {
        recipientRole: "admin",
        message: `Subject ${
          subject.subjectCode
        } has been ${newStatus.toLowerCase()}.`,
        type:
          newStatus === "Approved" ? "subject_approved" : "subject_rejected",
        link: "/admin/subject",
        timestamp: serverTimestamp(),
        isRead: false,
        triggeredBy: {
          uid: currentUser.uid,
          name: currentUser.firstName || "A Program Head",
        },
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast.error("Failed to send notification to admin.");
    }
  };

  // Initiate batch action
  const initiateBatchAction = (action) => {
    setBatchAction(action);
    setBatchDialogOpen(true);
  };

  // Handle batch action confirmation
  const handleBatchAction = async (comment) => {
    setIsSubmitting(true);

    try {
      // Get the selected subjects' full data
      const selectedSubjectsData = pendingSubjects.filter((s) =>
        selectedSubjects.has(s.id)
      );

      // Process in batches to avoid overwhelming Firestore
      const batchSize = 10;
      for (let i = 0; i < selectedSubjectsData.length; i += batchSize) {
        const batch = selectedSubjectsData.slice(i, i + batchSize);

        // Process batch in parallel
        await Promise.all(
          batch.map((subject) =>
            updateSubjectStatus(subject, batchAction, comment)
          )
        );
      }

      setBatchDialogOpen(false);
      setSelectedSubjects(new Set());

      toast.success(
        `${
          selectedSubjectsData.length
        } subjects ${batchAction.toLowerCase()} successfully`
      );
    } catch (error) {
      console.error(`Error in batch ${batchAction}:`, error);
      toast.error(`Failed to process batch action. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      yearLevel: "",
      sortOrder: "desc",
      status: "All",
    });
    setFilterPopoverOpen(false);
  };

  if (loading) {
    return <SubjectApprovalSkeleton />;
  }

  return (
    <div className="w-full p-4 space-y-4">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Subject Approval</h1>
          <p className="text-muted-foreground">
            Review and approve or reject subject proposals.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold">
              Showing subjects for your department
            </p>
            {deptName ? (
              <p className="text-muted-foreground">
                Only proposals for the{" "}
                <span className="font-semibold text-primary">{deptName}</span>{" "}
                are displayed below.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Loading your department details...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
        {/* select all checkbox */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {filteredSubjects.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedSubjects.size === filteredSubjects.length &&
                  filteredSubjects.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium whitespace-nowrap"
              >
                Select All
              </label>
            </div>
          )}
          {/* batch approve or reject */}
          {selectedSubjects.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto cursor-pointer">
                  <Layers /> Batch Action <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => initiateBatchAction("Approved")}
                  className="cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Approve
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={() => initiateBatchAction("Rejected")}
                >
                  <X className="h-4 w-4" /> Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* search, filter */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          {/* search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code or name..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
            {/* clear button */}
            {filters.search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer hover:bg-primary/10 rounded-full"
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* advanced filters popover */}
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button className="w-full sm:w-auto cursor-pointer">
                <Filter /> Filter & Sort <ChevronDown />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Year Level</h5>
                  <Select
                    value={filters.yearLevel}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        yearLevel: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Year Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Year Levels</SelectItem>
                      {availableYearLevels.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Sort by Date</h5>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortOrder: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    className="flex-1 cursor-pointer"
                    onClick={resetFilters}
                  >
                    Reset
                  </Button>
                  <Button
                    className="flex-1 cursor-pointer"
                    onClick={() => setFilterPopoverOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* status filter tabs */}
      <Tabs
        value={filters.status}
        onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}
      >
        <TabsList className="grid grid-cols-4">
          <TabsTrigger className="cursor-pointer" value="All">
            All
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="Pending">
            Pending
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="Approved">
            Approved
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="Rejected">
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* warning for missing department */}
      {!deptName && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                No department filter applied
              </p>
              <p className="text-amber-800">
                Program Head department is missing. Showing all pending subjects
                across departments.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* content area */}
      <div>
        {filteredSubjects.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Search className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No subjects found.</p>
              <p className="text-muted-foreground">
                {filters.search || filters.yearLevel
                  ? "Try adjusting your filters."
                  : filters.status === "Pending"
                  ? "All subjects have been reviewed."
                  : `No ${filters.status.toLowerCase()} subjects match the criteria.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          (() => {
            const totalPages = Math.ceil(
              filteredSubjects.length / subjectsPerPage
            );
            const indexOfLastSubject = currentPage * subjectsPerPage;
            const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage;
            const currentSubjects = filteredSubjects.slice(
              indexOfFirstSubject,
              indexOfLastSubject
            );

            return (
              <>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3">
                  {currentSubjects.map((subject) => (
                    <SubjectApprovalCard
                      key={subject.id}
                      subject={subject}
                      isSelected={selectedSubjects.has(subject.id)}
                      onSelect={toggleSelectSubject}
                      onViewDetails={openDetailView}
                      onApprove={(s) => initiateAction(s, "Approved")}
                      onReject={(s) => initiateAction(s, "Rejected")}
                    />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                  {/* showing 1 of x subjects */}
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {Math.min(indexOfLastSubject, filteredSubjects.length)} of{" "}
                    {filteredSubjects.length} subjects.
                  </div>
                  <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-4">
                    {/* subjects per page selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium whitespace-nowrap">
                        Subjects per page
                      </Label>
                      <Select
                        value={`${subjectsPerPage}`}
                        onValueChange={(value) => {
                          setSubjectsPerPage(Number(value));
                        }}
                      >
                        <SelectTrigger className="h-8 w-16 cursor-pointer">
                          <SelectValue placeholder={subjectsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[6, 9, 12, 15, 18].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* pagination */}
                    <Pagination className="flex items-center">
                      <PaginationContent className="flex flex-wrap justify-center gap-1">
                        {/* pagination buttons on left */}
                        <PaginationItem>
                          <PaginationFirst
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer h-8 w-8 p-0"
                            }
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer h-8 w-8 p-0"
                            }
                          />
                        </PaginationItem>

                        {/* show ellipsis */}
                        {currentPage > 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        {/* show page numbers */}
                        <PaginationItem>
                          <span className="text-sm font-medium mx-2 whitespace-nowrap">
                            Page {currentPage} of {totalPages}
                          </span>
                        </PaginationItem>

                        {/* pagination buttons on right */}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer h-8 w-8 p-0"
                            }
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLast
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer h-8 w-8 p-0"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              </>
            );
          })()
        )}
      </div>

      {/* Modals */}
      <SubjectDetailModal
        subject={detailSubject}
        onClose={closeDetailView}
        onApprove={(subject) => initiateAction(subject, "Approved")}
        onReject={(subject) => initiateAction(subject, "Rejected")}
        isLoading={isSubmitting}
      />
      <ConfirmActionDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        subject={selectedSubject}
        action={selectedAction}
        onConfirm={handleConfirmAction}
        isLoading={isSubmitting}
      />
      <BatchActionDialog
        isOpen={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        selectedCount={selectedSubjects.size}
        action={batchAction}
        onConfirm={handleBatchAction}
        isLoading={isSubmitting}
      />
      <ConflictDialog
        conflicts={conflicts}
        subject={selectedSubject}
        onClose={() => setConflicts([])}
        onCancel={handleCancelConflictResolution}
        isLoading={isSubmitting}
      />
    </div>
  );
}
