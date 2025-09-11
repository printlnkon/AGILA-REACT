import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import {
  collectionGroup,
  onSnapshot,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SubjectApproval({ programHeadDeptName }) {
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [where("status", "==", "Pending")];
    if (programHeadDeptName) {
      constraints.push(where("departmentName", "==", programHeadDeptName));
    }

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
        console.error("Error fetching pending subjects: ", error);
        toast.error("Failed to fetch subjects. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [programHeadDeptName]);

  const handleUpdateStatus = async (subject, newStatus) => {
    try {
      await updateDoc(subject.ref, { status: newStatus });
      toast.success(`Subject status updated to ${newStatus}`);
    } catch (error) {
      console.error(`Error updating subject status to ${newStatus}: `, error);
      toast.error(
        `Failed to ${newStatus.toLowerCase()} subject. Please try again.`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading subjects...</span>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6">
        <div className="grid auto-rows-min gap-2 sm:gap-4">
          <div>
          <h1 className="text-2xl font-bold sm:text-2xl tracking-tight">
            Manage Subject Approval
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject subjects created.
          </p>
        </div>
        </div>
      </div>
      </div>

      {!programHeadDeptName && (
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

      {pendingSubjects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-2 text-center">
            <Check className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No pending subjects found.</p>
            <p className="text-muted-foreground">
              All subjects have been approved or rejected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSubjects.map((subject) => (
            <Card key={subject.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">{subject.subjectName}</CardTitle>
                <CardDescription className="font-medium">
                  {subject.subjectCode}
                </CardDescription>

                {/* Rich metadata */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge>{subject.departmentName || "Department: —"}</Badge>
                  <Badge variant="secondary">
                    {subject.courseName || "Course: —"}
                  </Badge>
                  <Badge variant="outline">
                    {subject.yearLevelName || "Year Level: —"}
                  </Badge>
                </div>

                {/* Optional description */}
                {subject.description ? (
                  <p className="text-sm text-muted-foreground mt-3">
                    {subject.description}
                  </p>
                ) : null}
              </CardHeader>

              <CardContent className="flex justify-end gap-2">
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => handleUpdateStatus(subject, "Approved")}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleUpdateStatus(subject, "Rejected")}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
