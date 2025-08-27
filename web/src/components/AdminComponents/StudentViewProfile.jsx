import { useState, useEffect } from "react";
import { useStudentProfile } from "@/context/StudentProfileContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import StudentEditViewProfile from "@/components/AdminComponents/StudentEditViewProfile";
import { db } from "@/api/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// A helper function to handle copying text to the clipboard.
const handleCopyStudentNumber = (studentNumber) => {
  if (!studentNumber) {
    toast.error("Student Number not found");
    return;
  }
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
  const [activeSession, setActiveSession] = useState(null);
  const [academicData, setAcademicData] = useState({
    departments: [],
    courses: [],
    yearLevels: [],
    sections: [],
  });
  const [loadingAcademicData, setLoadingAcademicData] = useState(true);

  // 1. Fetch the active session first
  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const academicYearsRef = collection(db, "academic_years");
        const activeYearQuery = query(
          academicYearsRef,
          where("status", "==", "Active")
        );
        const yearSnapshot = await getDocs(activeYearQuery);

        if (!yearSnapshot.empty) {
          const activeYear = yearSnapshot.docs[0];
          const activeYearId = activeYear.id;

          const semestersRef = collection(
            db,
            `academic_years/${activeYearId}/semesters`
          );
          const activeSemesterQuery = query(
            semestersRef,
            where("status", "==", "Active")
          );
          const semesterSnapshot = await getDocs(activeSemesterQuery);

          if (!semesterSnapshot.empty) {
            const activeSemester = semesterSnapshot.docs[0];
            setActiveSession({
              id: activeYearId,
              semesterId: activeSemester.id,
              ...activeYear.data(),
              ...activeSemester.data(),
            });
          } else {
            // No active semester found, so set activeSession to a specific value
            setActiveSession(null);
            setLoadingAcademicData(false); // Stop loading and show the error
            toast.error("No active semester found for this academic year.");
          }
        } else {
          // No active academic year found
          setActiveSession(null);
          setLoadingAcademicData(false); // Stop loading and show the error
          toast.error("No active academic year found.");
        }
      } catch (error) {
        console.error("Error fetching active session:", error);
        setActiveSession(null);
        setLoadingAcademicData(false); // Stop loading and show the error
        toast.error("Failed to load active academic session.");
      }
    };

    fetchActiveSession();
  }, []);

  // 2. Fetch academic data once the active session is available
  useEffect(() => {
    const fetchAcademicData = async () => {
      if (!activeSession) return;

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
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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

  const handleSaveChanges = async (updatedStudentData) => {
    const success = await updateStudentProfile(updatedStudentData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">No student selected.</p>
      </div>
    );
  }

  // edit profile mode
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
            academicData={academicData}
            loading={loadingAcademicData}
          />
        </div>
      </div>
    );
  }

  // view profile mode
  return (
    <div className="w-full p-4 lg:p-6">
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid auto-rows-min gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-2xl font-bold">Student Profile</h1>
              <p className="text-sm text-muted-foreground">
                View student details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            className="cursor-pointer text-sm gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
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
          {/* display profile picture */}
          <Card className="w-full max-w-sm mx-auto lg:mx-0">
            <CardContent className="p-4 md:p-1 flex flex-col items-center">
              {selectedStudent.photoURL ? (
                <img
                  src={selectedStudent.photoURL}
                  alt="Avatar"
                  className="w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-full border-4 border-white shadow-md object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/128x128/b6e3f4/4a4a4a?text=Student";
                  }}
                />
              ) : (
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold select-none"
                  aria-label="Avatar"
                >
                  {`${(selectedStudent.firstName?.charAt(0) || "")}${(selectedStudent.lastName?.charAt(0) || "")}`}
                </div>
              )}
              <div className="flex flex-col items-center text-center w-full">
                <div className="text-lg sm:text-xl font-semibold">
                  {selectedStudent.firstName} {selectedStudent.middleName || ""}
                  {selectedStudent.lastName}
                </div>
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
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1 bg-green-100 text-green-800">
                    <span className="font-semibold mr-1">Status:</span>
                    {selectedStudent.status || "N/A"}
                  </Badge>
                </div>
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1">
                    <span className="font-semibold mr-1">Role:</span>
                    {selectedStudent.role || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full flex flex-col gap-4">
            {/* display stud info */}
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
                      Suffix
                    </p>
                    <p className="text-sm">{selectedStudent.suffix || "N/A"}</p>
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
            {/* display acad info */}
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
