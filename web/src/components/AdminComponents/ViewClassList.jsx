import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/api/firebase";
import { toast } from "sonner";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Users, LoaderCircle, ArrowLeft, Copy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClassList } from "@/context/ClassListContext";

// function to handle copying to clipboard
const handleCopy = (text, label = "Text") => {
  if (!text) {
    toast.error(`${label} not found`);
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(`${label} copied to clipboard`);
    })
    .catch(() => {
      toast.error(`Failed to copy ${label}`);
    });
};

export default function ViewClassList() {
  const { selectedSection } = useClassList();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1, {
      state: {
        preserveScroll: true,
        preserveFilters: true,
      },
    });
  };

  // redirect if no section is selected
  useEffect(() => {
    if (!selectedSection) {
      toast.error("No section selected");
      navigate(-1);
      return;
    }

    // fetch students when section data is available
    fetchStudents();
  }, [selectedSection, navigate]);

  const fetchStudents = async () => {
    if (!selectedSection) return;

    try {
      const studentsRef = collection(db, "users/student/accounts");
      const q = query(studentsRef, where("section", "==", selectedSection.id));

      const querySnapshot = await getDocs(q);
      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(studentsList);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load students for this class.");
      setLoading(false);
    }
  };

  if (!selectedSection) return null;

  return (
    <div className="w-full p-4 lg:p-6">
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid auto-rows-min gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-2xl font-bold">
                Class List | {selectedSection?.sectionName || "Loading..."}
              </h1>
              <p className="text-sm text-muted-foreground">
                Students enrolled in{" "}
                {selectedSection?.sectionName || "this section"} for the current
                semester.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            className="cursor-pointer gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
        </div>

        <div>
          {loading ? (
            <Card className="w-full flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-2">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                <span className="text-muted-foreground">
                  Loading class list...
                </span>
              </div>
            </Card>
          ) : students.length > 0 ? (
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-lg sm:text-xl flex items-center justify-between">
                  <h1 className="text-xl font-semibold">Students List</h1>
                  <Badge className="text-sm font-normal">
                    Total: {students.length} student
                    {students.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              {/* table */}
              <ScrollArea className="h-[400px] w-full">
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary">
                        <TableHead className="w-[80px] text-center">
                          #
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Student No
                        </TableHead>
                        <TableHead className="min-w-[200px]">Name</TableHead>
                        <TableHead className="min-w-[180px]">Course</TableHead>
                        <TableHead className="min-w-[100px]">
                          Year Level
                        </TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            {student.studentNumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {student.firstName || ""}{" "}
                            {student.middleName
                              ? student.middleName.charAt(0) + ". "
                              : ""}
                            {student.lastName || ""}
                            {student.name || ""}
                          </TableCell>
                          <TableCell>{student.courseName || "N/A"}</TableCell>
                          <TableCell>
                            {student.yearLevelName || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() =>
                                handleCopy(
                                  student.studentNumber || student.studentId,
                                  "Student ID"
                                )
                              }
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          ) : (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <Users className="h-16 w-16 text-muted-foreground opacity-20" />
                <p className="text-xl font-medium">No students found</p>
                <p className="text-center text-muted-foreground max-w-md">
                  There are no students enrolled in this section yet. Students
                  will appear here once they are assigned to this section.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
