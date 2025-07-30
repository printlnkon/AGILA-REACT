import { useProgramHeadProfile } from "@/context/ProgramHeadProfileContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  const { selectedProgramHead } = useProgramHeadProfile();

  if (!selectedProgramHead) return <div>No program head selected.</div>;

  return (
    <div className="w-full">
      <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6">
        <div className="grid auto-rows-min gap-2 sm:gap-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Program Head Profile</h1>
              <p className="text-muted-foreground">
                View and manage program head details.
              </p>
            </div>
          </div>
        </div>
        {/* go back btn */}
        <div className="gap-2 space-y-4">
          <Button
            className="bg-primary cursor-pointer"
            onClick={() => window.history.back()}
          >
            <ArrowLeft />
            Go Back
          </Button>
        </div>

        {/* student info */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* profile card */}
          <Card className="w-full max-w-sm mx-auto lg:mx-0">
            <CardContent className="flex flex-col items-center">
              {/* avatar */}
              <img
                src={
                  selectedProgramHead.photoURL ||
                  (selectedProgramHead.gender === "Female"
                    ? "https://api.dicebear.com/9.x/adventurer/svg?seed=Female&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede"
                    : "https://api.dicebear.com/9.x/adventurer/svg?seed=Male&flip=true&earringsProbability=5&skinColor=ecad80&backgroundColor=b6e3f4,c0aede")
                }
                alt="Avatar"
                className="w-32 h-32 mb-2 rounded-full"
              />
              <div className="flex flex-col items-center text-center w-full">
                {/* name */}
                <div className="text-xl font-semibold">
                  {selectedProgramHead.firstName}{" "}
                  {selectedProgramHead.middleName || ""}{" "}
                  {selectedProgramHead.lastName}
                </div>
                {/* employee no. */}
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <span>Employee No. {selectedProgramHead.employeeNumber}</span>
                  <Button
                    className="w-5 h-5 rounded-sm bg-primary/35 cursor-pointer"
                    onClick={() =>
                      handleCopyEmployeeNo(selectedProgramHead.employeeNumber)
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <Separator className="my-2 w-full" />
              </div>
              <div className="flex flex-row w-full mt-2 gap-4 justify-between">
                {/* status */}
                <div className="text-sm flex-1 flex justify-around">
                  <Badge className="capitalize font-medium rounded-full px-4 py-2 bg-green-600 text-white">
                    <span className="font-semibold">Status:</span>{" "}
                    {selectedProgramHead.status || "N/A"}
                  </Badge>
                </div>
                {/* role */}
                <div className="text-sm flex-1 flex justify-around">
                  <Badge className="capitalize font-medium rounded-full px-4 py-2">
                    <span className="font-semibold">Role:</span>{" "}
                    {selectedProgramHead.role || "N/A"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 w-full">
            {/* teacher info */}
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-xl">Student Information</div>
              </CardHeader>
              <CardContent>
                <div className="divide-y ml-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 py-3 gap-y-2">
                    <span className="font-semibold">First Name:</span>
                    <span>{selectedProgramHead.firstName}</span>
                    <span className="font-semibold">Last Name:</span>
                    <span>{selectedProgramHead.lastName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-4 py-3 gap-y-2">
                    <span className="font-semibold">Email:</span>
                    <span>{selectedProgramHead.email}</span>
                    <span className="font-semibold">Birthday:</span>
                    <span>{selectedProgramHead.dateOfBirth}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 py-3 gap-y-2">
                    <span className="font-semibold">Gender:</span>
                    <span>{selectedProgramHead.gender}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* academic info */}
            <Card className="w-full">
              <CardHeader>
                <div className="font-semibold text-xl">
                  Academic Information
                </div>
              </CardHeader>
              <CardContent className="">
                <div className="divide-y ml-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 py-3 lg:grid-cols-2 xl:grid-cols-4 gap-y-2">
                    <span className="font-semibold">TEST:</span>
                    <span>TEEEEEEEEEEEEEESTING</span>
                    <span className="font-bold">TEST:</span>
                    <span>TEEEEEEEEEEEEEESTING</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 py-3 lg:grid-cols-2 xl:grid-cols-4 gap-y-2">
                    <span className="font-semibold">TEST:</span>
                    <span>TEEEEEEEEEEEEEESTING</span>
                    <span className="font-semibold">TEST:</span>
                    <span>TEEEEEEEEEEEEEESTING</span>
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
