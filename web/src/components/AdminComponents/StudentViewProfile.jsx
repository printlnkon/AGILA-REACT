import { useState } from "react";
import { useStudentProfile } from "@/context/StudentProfileContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import StudentEditViewProfile from "@/components/AdminComponents/StudentEditViewProfile";

// A helper function to handle copying text to the clipboard.
const handleCopyStudentNumber = (studentNumber) => {
  if (!studentNumber) {
    toast.error("Student Number not found");
    return;
  }
  // Using the Clipboard API for modern browsers.
  navigator.clipboard
    .writeText(studentNumber)
    .then(() => {
      toast.success("Student Number copied to clipboard");
    })
    .catch(() => {
      toast.error("Failed to copy Student Number");
    });
};

export default function StudentViewProfile() {
  const { selectedStudent, updateStudentProfile } = useStudentProfile();
  const [isEditing, setIsEditing] = useState(false);

  // save changes to the student profile
  const handleSaveChanges = async (updatedStudentData) => {
    const success = await updateStudentProfile(updatedStudentData);
    if (success) {
      setIsEditing(false); // switch back to view mode after saving
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false); // switch back to view mode without saving
    toast.info("Editing cancelled.");
  };

  // Display a message if no student data is available.
  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">No student selected.</p>
      </div>
    );
  }

  // render edit profile view
  if (isEditing) {
    return (
      <div className="w-full p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Edit Student Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Update and manage student details.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <StudentEditViewProfile
            student={selectedStudent}
            onSave={handleSaveChanges}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid auto-rows-min gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Student Profile</h1>
              <p className="text-sm text-muted-foreground">
                View and manage student details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          {/* go back button */}
          <Button
            className="bg-primary cursor-pointer text-sm gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          {/* edit profle */}
          <div className="ml-2">
            <Button
              onClick={() => setIsEditing(true)}
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* profile card */}
          <Card className="w-full max-w-sm mx-auto lg:mx-0">
            <CardContent className="p-4 sm:p-6 flex flex-col items-center">
              {/* avatar */}
              <img
                src={
                  selectedStudent.photoURL ||
                  (selectedStudent.gender === "Female"
                    ? "https://api.dicebear.com/9.x/adventurer/svg?seed=Female&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede"
                    : "https://api.dicebear.com/9.x/adventurer/svg?seed=Male&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede")
                }
                alt="Avatar"
                className="w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-full border-4 border-white shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/128x128/b6e3f4/4a4a4a?text=Student";
                }}
              />
              <div className="flex flex-col items-center text-center w-full">
                {/* name */}
                <div className="text-lg sm:text-xl font-semibold">
                  {selectedStudent.firstName} {selectedStudent.middleName || ""}
                  {selectedStudent.lastName}
                </div>
                {/* student no. */}
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                  <span>Student No. {selectedStudent.studentNumber}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-md cursor-pointer"
                    onClick={() =>
                      handleCopyStudentNumber(selectedStudent.studentNumber)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Separator className="w-full" />
              </div>

              <div className="flex flex-col sm:flex-row w-full mt-4 gap-2">
                {/* status */}
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1 bg-green-100 text-green-800">
                    <span className="font-semibold mr-1">Status:</span>
                    {selectedStudent.status || "N/A"}
                  </Badge>
                </div>
                <div className="text-sm flex-1 flex justify-center">
                  {/* role */}
                  <Badge className="capitalize font-medium rounded-md px-3 py-1">
                    <span className="font-semibold mr-1">Role:</span>
                    {selectedStudent.role || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 w-full">
            {/* student information card */}
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-lg sm:text-xl">
                  Student Information
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      First Name
                    </p>
                    <p className="text-sm">{selectedStudent.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Middle Name
                    </p>
                    <p className="text-sm">
                      {selectedStudent.middleName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Last Name
                    </p>
                    <p className="text-sm">{selectedStudent.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm break-all">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Birthday
                    </p>
                    <p className="text-sm">{selectedStudent.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Gender
                    </p>
                    <p className="text-sm">{selectedStudent.gender}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* academic information card */}
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-lg sm:text-xl">
                  Academic Information
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Department
                    </p>
                    <p className="text-sm">{selectedStudent.departmentName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Course
                    </p>
                    <p className="text-sm">{selectedStudent.courseName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Year Level
                    </p>
                    <p className="text-sm">{selectedStudent.yearLevelName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Section
                    </p>
                    <p className="text-sm">{selectedStudent.sectionName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
