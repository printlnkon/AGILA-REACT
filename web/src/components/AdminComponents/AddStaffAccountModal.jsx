import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// These components for embedding the actual form content
import { useActiveSession } from "@/context/ActiveSessionContext";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  CircleAlert,
  Info,
  LoaderCircle,
  UserRoundPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Import the necessary components but don't render them directly
import AddAcademicHeadModal from "./AddAcademicHeadModal";
import AddProgramHeadModal from "./AddProgramHeadModal";
import AddTeacherModal from "./AddTeacherModal";

export default function AddStaffAccountModal({ onUserAdded }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Academic Head");

  const handleDialogChange = useCallback((isOpen) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      setSelectedRole("Academic Head");
    }
  }, []);

  const handleRoleChange = useCallback((role) => {
    setSelectedRole(role);
  }, []);

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <UserRoundPlus />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-2xl xl:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Staff Account</DialogTitle>
          <DialogDescription>
            Create a new staff account in the system.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={selectedRole}
          onValueChange={handleRoleChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="Academic Head">Academic Head</TabsTrigger>
            <TabsTrigger value="Program Head">Program Head</TabsTrigger>
            <TabsTrigger value="Teacher">Teacher</TabsTrigger>
          </TabsList>

          <TabsContent value="Academic Head" className="mt-4">
            {/* Embed Academic Head Form Content */}
            <EmbeddedAcademicHeadForm
              onUserAdded={() => {
                if (onUserAdded) onUserAdded();
                setDialogOpen(false);
              }}
            />
          </TabsContent>

          <TabsContent value="Program Head" className="mt-4">
            {/* Embed Program Head Form Content */}
            <EmbeddedProgramHeadForm
              onUserAdded={(userInfo) => {
                if (onUserAdded) onUserAdded(userInfo); 
                setDialogOpen(false);
              }}
            />
          </TabsContent>

          <TabsContent value="Teacher" className="mt-4">
            {/* Embed Teacher Form Content */}
            <EmbeddedTeacherForm
              onUserAdded={(userInfo) => {
                if (onUserAdded) onUserAdded(userInfo); 
                setDialogOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="cursor-pointer">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper components to embed the form content from each modal
function EmbeddedAcademicHeadForm({ onUserAdded }) {
  return (
    <div className="academic-head-form-wrapper">
      <AddAcademicHeadModalContent onUserAdded={onUserAdded} />
    </div>
  );
}

function EmbeddedProgramHeadForm({ onUserAdded }) {
  return (
    <div className="program-head-form-wrapper">
      <AddProgramHeadModalContent onUserAdded={onUserAdded} />
    </div>
  );
}

function EmbeddedTeacherForm({ onUserAdded }) {
  return (
    <div className="teacher-form-wrapper">
      <AddTeacherModalContent onUserAdded={onUserAdded} />
    </div>
  );
}

function AddAcademicHeadModalContent({ onUserAdded }) {
  // This component would use the same form and logic as AddAcademicHeadModal
  // but without the Dialog wrapper
  const academicHeadModalInstance = (
    <AddAcademicHeadModal onUserAdded={onUserAdded} embedded={true} />
  );

  return academicHeadModalInstance;
}

function AddProgramHeadModalContent({ onUserAdded }) {
  const programHeadModalInstance = (
    <AddProgramHeadModal onUserAdded={onUserAdded} embedded={true} />
  );

  return programHeadModalInstance;
}

function AddTeacherModalContent({ onUserAdded }) {
  const teacherModalInstance = (
    <AddTeacherModal onUserAdded={onUserAdded} embedded={true} />
  );

  return teacherModalInstance;
}
