import { useState, useEffect } from "react";
import { useTeacherProfile } from "@/context/TeacherProfileContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import TeacherEditViewProfile from "@/components/AdminComponents/TeacherEditViewProfile";
import { db } from "@/api/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useActiveSession } from "@/context/ActiveSessionContext";

// A helper function to handle copying text to the clipboard.
const handleCopyEmployeeNo = (employeeNo) => {
  if (!employeeNo) {
    toast.error("Employee Number not found");
    return;
  }
  navigator.clipboard
    .writeText(employeeNo)
    .then(() => {
      toast.success("Employee Number copied to clipboard");
    })
    .catch(() => {
      toast.error("Failed to copy Employee Number");
    });
};

export default function TeacherViewProfile() {
  const { selectedTeacher, updateTeacherProfile } = useTeacherProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { activeSession } = useActiveSession();
  const [academicData, setAcademicData] = useState({
    departments: [],
    courses: [],
    yearLevels: [],
    sections: [],
  });
  const [loadingAcademicData, setLoadingAcademicData] = useState(true);

  // Fetch academic data once the active session is available
  useEffect(() => {
    const fetchAcademicData = async () => {
      if (!activeSession) {
        setLoadingAcademicData(false);
        return;
      }

      setLoadingAcademicData(true);
      try {
        const departmentsRef = collection(
          db,
          `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments`
        );
        const departmentsSnapshot = await getDocs(departmentsRef);
        const departments = departmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Use Promise.all to run all nested fetches concurrently
        const coursesPromises = departments.map((dept) =>
          getDocs(
            collection(
              db,
              `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${dept.id}/courses`
            )
          ).then((snapshot) =>
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              departmentId: dept.id,
            }))
          )
        );

        const allCoursesArrays = await Promise.all(coursesPromises);
        const courses = allCoursesArrays.flat(); // Flatten the array of arrays

        const yearLevelsPromises = courses.map((course) =>
          getDocs(
            collection(
              db,
              `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${course.departmentId}/courses/${course.id}/year_levels`
            )
          ).then((snapshot) =>
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              departmentId: course.departmentId,
              courseId: course.id,
            }))
          )
        );

        const allYearLevelsArrays = await Promise.all(yearLevelsPromises);
        const yearLevels = allYearLevelsArrays.flat();

        const sectionsPromises = yearLevels.map((yearLevel) =>
          getDocs(
            collection(
              db,
              `academic_years/${activeSession.id}/semesters/${activeSession.semesterId}/departments/${yearLevel.departmentId}/courses/${yearLevel.courseId}/year_levels/${yearLevel.id}/sections`
            )
          ).then((snapshot) =>
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              departmentId: yearLevel.departmentId,
              courseId: yearLevel.courseId,
              yearLevelId: yearLevel.id,
            }))
          )
        );

        const allSectionsArrays = await Promise.all(sectionsPromises);
        const sections = allSectionsArrays.flat();

        setAcademicData({ departments, courses, yearLevels, sections });
      } catch (error) {
        console.error("Error fetching academic data:", error);
        toast.error("Failed to load academic data.");
      } finally {
        setLoadingAcademicData(false);
      }
    };

    fetchAcademicData();
  }, [activeSession]);

  const handleSaveChanges = async (updatedTeacherData) => {
    const success = await updateTeacherProfile(updatedTeacherData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!selectedTeacher) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">No teacher selected.</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="w-full p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Edit Teacher Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Update and manage teacher details.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <TeacherEditViewProfile
            teacher={selectedTeacher}
            onSave={handleSaveChanges}
            onCancel={handleCancelEdit}
            academicData={academicData}
            loading={loadingAcademicData}
          />
        </div>
      </div>
    );
  }

  // View profile mode
  return (
    <div className="w-full">
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid auto-rows-min gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Teacher Profile</h1>
              <p className="text-sm text-muted-foreground">
                View and manage teacher details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            className="bg-primary cursor-pointer text-sm gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
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
          <Card className="w-full max-w-sm mx-auto lg:mx-0">
            <CardContent className="p-4 sm:p-6 flex flex-col items-center">
              <img
                src={
                  selectedTeacher.photoURL ||
                  (selectedTeacher.gender === "Female"
                    ? "https://api.dicebear.com/9.x/adventurer/svg?seed=Female&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede"
                    : "https://api.dicebear.com/9.x/adventurer/svg?seed=Male&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede")
                }
                alt="Avatar"
                className="w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-full border-4 border-white shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/128x128/b6e3f4/4a4a4a?text=Teacher";
                }}
              />
              <div className="flex flex-col items-center text-center w-full">
                <div className="text-lg sm:text-xl font-semibold">
                  {selectedTeacher.firstName}{" "}
                  {selectedTeacher.middleName || " "}
                  {selectedTeacher.lastName} {selectedTeacher.suffix || ""}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                  <span>Employee No. {selectedTeacher.employeeNumber}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-md cursor-pointer"
                    onClick={() =>
                      handleCopyEmployeeNo(selectedTeacher.employeeNumber)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Separator className="w-full" />
              </div>

              <div className="flex flex-col sm:flex-row w-full mt-4 gap-2">
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1 bg-green-100 text-green-800">
                    <span className="font-semibold mr-1">Status:</span>
                    {selectedTeacher.status || "N/A"}
                  </Badge>
                </div>
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1">
                    <span className="font-semibold mr-1">Role:</span>
                    {selectedTeacher.role || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-lg sm:text-xl">
                  Teacher Information
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      First Name
                    </p>
                    <p className="text-sm">{selectedTeacher.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Middle Name
                    </p>
                    <p className="text-sm">
                      {selectedTeacher.middleName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Last Name
                    </p>
                    <p className="text-sm">{selectedTeacher.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Suffix
                    </p>
                    <p className="text-sm">{selectedTeacher.suffix || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm break-all">{selectedTeacher.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Birthday
                    </p>
                    <p className="text-sm">{selectedTeacher.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Gender
                    </p>
                    <p className="text-sm">{selectedTeacher.gender}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <p className="text-sm">
                      {selectedTeacher.departmentName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Course
                    </p>
                    <p className="text-sm">
                      {selectedTeacher.courseName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Year Level
                    </p>
                    <p className="text-sm">
                      {selectedTeacher.yearLevelName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Section
                    </p>
                    <p className="text-sm">
                      {selectedTeacher.sectionName || "N/A"}
                    </p>
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
