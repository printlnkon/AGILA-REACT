import { useState, useEffect } from "react";
import { useProgramHeadProfile } from "@/context/ProgramHeadProfileContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProgramHeadEditViewProfile from "@/components/AdminComponents/ProgramHeadEditViewProfile";
import { db } from "@/api/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useActiveSession } from "@/context/ActiveSessionContext";

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

export default function ProgramHeadViewProfile() {
  const { selectedProgramHead, updateProgramHeadProfile } =
    useProgramHeadProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { activeSession } = useActiveSession();
  const [academicData, setAcademicData] = useState({
    departments: [],
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

        setAcademicData({ departments });
      } catch (error) {
        console.error("Error fetching academic data:", error);
        toast.error("Failed to load academic data.");
      } finally {
        setLoadingAcademicData(false);
      }
    };

    fetchAcademicData();
  }, [activeSession]);

  const handleSaveChanges = async (updatedProgramHeadData) => {
    const success = await updateProgramHeadProfile(updatedProgramHeadData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!selectedProgramHead) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">No program head selected.</p>
      </div>
    );
  }

  // Edit profile mode
  if (isEditing) {
    return (
      <div className="w-full p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Edit Program Head Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Update and manage program head details.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgramHeadEditViewProfile
            programHead={selectedProgramHead}
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
    <div className="w-full p-4 lg:p-6">
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid auto-rows-min gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Program Head Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                View and manage program head details.
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
          <Card className="w-full max-w-sm mx-auto lg:mx-0">
            <CardContent className="p-4 md:p-1 flex flex-col items-center">
              <img
                src={
                  selectedProgramHead.photoURL ||
                  (selectedProgramHead.gender === "Female"
                    ? "https://api.dicebear.com/9.x/adventurer/svg?seed=Female&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede"
                    : "https://api.dicebear.com/9.x/adventurer/svg?seed=Male&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede")
                }
                alt="Avatar"
                className="w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-full border-4 border-white shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/128x128/b6e3f4/4a4a4a?text=Program Head";
                }}
              />
              <div className="flex flex-col items-center text-center w-full">
                <div className="text-lg sm:text-xl font-semibold">
                  {selectedProgramHead.firstName}{" "}
                  {selectedProgramHead.middleName || " "}
                  {selectedProgramHead.lastName}{" "}
                  {selectedProgramHead.suffix || ""}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                  <span>Employee No. {selectedProgramHead.employeeNumber}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-md cursor-pointer"
                    onClick={() =>
                      handleCopyEmployeeNo(selectedProgramHead.employeeNumber)
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
                    {selectedProgramHead.status || "N/A"}
                  </Badge>
                </div>
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1">
                    <span className="font-semibold mr-1">Role:</span>
                    {selectedProgramHead.role || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-lg sm:text-xl">
                  Program Head Information
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      First Name
                    </p>
                    <p className="text-sm">{selectedProgramHead.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Middle Name
                    </p>
                    <p className="text-sm">
                      {selectedProgramHead.middleName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Last Name
                    </p>
                    <p className="text-sm">{selectedProgramHead.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Suffix
                    </p>
                    <p className="text-sm">
                      {selectedProgramHead.suffix || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm break-all">
                      {selectedProgramHead.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Birthday
                    </p>
                    <p className="text-sm">{selectedProgramHead.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Gender
                    </p>
                    <p className="text-sm">{selectedProgramHead.gender}</p>
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
                      {selectedProgramHead.departmentName || "N/A"}
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
