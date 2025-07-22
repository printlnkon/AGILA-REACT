import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
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

export default function ExportExcelFormat() {
  const [selectedRole, setSelectedRole] = useState("");

  // export format
  const handleExportTemplate = (role) => {
    if (!role) {
      toast.error("Please select a role to export format.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet([
      {
        "First Name": "e.g., Juan",
        "Middle Name": "",
        "Last Name": "Dela Cruz",
        Suffix: "",
        Gender: "Male",
        "Date of Birth": "2004-05-14",
        Department: "Information Technology",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Format");
    XLSX.writeFile(wb, `${role}_format.xlsx`);

    toast.success(`Exported ${role} format successfully!`);
  };

  return (
    <>
      {/* export format */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="cursor-pointer ml-2 flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
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
                <SelectItem value="academic_head">Academic Head</SelectItem>
                <SelectItem value="program_head">Program Head</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
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
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
