import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_DISPLAY_NAMES = {
  academic_head: "Academic Head",
  program_head: "Program Head",
  teacher: "Teacher",
  student: "Student",
};

export default function ExportExcelFormat() {
  const [selectedRole, setSelectedRole] = useState("");

  // export format
  const handleExportTemplate = (role) => {
    if (!role) {
      toast.error("Please select a role to export format.");
      return;
    }

    const displayRoleName = ROLE_DISPLAY_NAMES[role] || "Unknown Role";

    const ws = XLSX.utils.json_to_sheet([
      {
        "First Name": "e.g., Juan",
        "Middle Name": "",
        "Last Name": "Dela Cruz",
        "Suffix": "",
        "Gender": "Male",
        "Date of Birth": "2004-05-14",
        "Department": "Information Technology",
        "Role": displayRoleName,
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Format");
    XLSX.writeFile(wb, `${displayRoleName.replace(/\s/g, "_")}_format.xlsx`);

    toast.success(`Exported ${displayRoleName} format successfully!`);
  };

  return (
    <>
      {/* export format */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mr-2 cursor-pointer">
            <FileDown />
            Export Format
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          {/* header */}
          <DialogHeader>
            <DialogTitle>Export Template</DialogTitle>
            <DialogDescription>
              Select a role to download the format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_DISPLAY_NAMES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="cursor-pointer">
                Close
              </Button>
            </DialogClose>
            <Button
              onClick={() => handleExportTemplate(selectedRole)}
              disabled={!selectedRole}
              className="cursor-pointer"
            >
              <Download /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
