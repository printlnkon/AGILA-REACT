import { useState } from "react";
import { useAcademicHeadProfile } from "@/context/AcademicHeadProfileContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AcademicHeadEditViewProfile from "@/components/AdminComponents/AcademicHeadEditViewProfile";

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

export default function AcademicHeadViewProfile() {
  const { selectedAcademicHead, updateAcademicHeadProfile } =
    useAcademicHeadProfile();
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveChanges = async (updatedAcademicHeadData) => {
    const success = await updateAcademicHeadProfile(updatedAcademicHeadData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (!selectedAcademicHead) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">No academic head selected.</p>
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
              Edit Academic Head Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Update and manage academic head details.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <AcademicHeadEditViewProfile
            academicHead={selectedAcademicHead}
            onSave={handleSaveChanges}
            onCancel={handleCancelEdit}
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
              <h1 className="text-xl sm:text-2xl font-bold">
                Academic Head Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                View and manage academic head details.
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
              {selectedAcademicHead.photoURL ? (
                <img
                  src={selectedAcademicHead.photoURL}
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
                  {`${(selectedAcademicHead.firstName?.charAt(0) || "")}${(selectedAcademicHead.lastName?.charAt(0) || "")}`}
                </div>
              )}
              <div className="flex flex-col items-center text-center w-full">
                <div className="text-lg sm:text-xl font-semibold">
                  {selectedAcademicHead.firstName}{" "}
                  {selectedAcademicHead.middleName || " "}
                  {selectedAcademicHead.lastName}{" "}
                  {selectedAcademicHead.suffix || ""}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                  <span>
                    Employee No. {selectedAcademicHead.employeeNumber}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-md cursor-pointer"
                    onClick={() =>
                      handleCopyEmployeeNo(selectedAcademicHead.employeeNumber)
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
                    {selectedAcademicHead.status || "N/A"}
                  </Badge>
                </div>
                <div className="text-sm flex-1 flex justify-center">
                  <Badge className="capitalize font-medium rounded-md px-3 py-1">
                    <span className="font-semibold mr-1">Role:</span>
                    {selectedAcademicHead.role || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-lg sm:text-xl">
                  Academic Head Information
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      First Name
                    </p>
                    <p className="text-sm">{selectedAcademicHead.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Middle Name
                    </p>
                    <p className="text-sm">
                      {selectedAcademicHead.middleName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Last Name
                    </p>
                    <p className="text-sm">{selectedAcademicHead.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Suffix
                    </p>
                    <p className="text-sm">
                      {selectedAcademicHead.suffix || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm break-all">
                      {selectedAcademicHead.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Birthday
                    </p>
                    <p className="text-sm">
                      {selectedAcademicHead.dateOfBirth}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Gender
                    </p>
                    <p className="text-sm">{selectedAcademicHead.gender}</p>
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
