import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function StudentEditViewProfile({ student, onSave, onCancel }) {
  const [formData, setFormData] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData(student);
    }
  }, [student]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = () => {
    onSave(formData); // pass updated data back to parent
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* student information card */}
      <Card className="w-full">
        <CardHeader>
          <div className="font-semibold text-lg sm:text-xl">
            Edit Student Information
          </div>
        </CardHeader>

        {/* student information */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            {/* first name */}
            <div>
              <Label
                htmlFor="firstName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* middle name */}
            <div>
              <Label
                htmlFor="middleName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Middle Name
              </Label>
              <Input
                id="middleName"
                value={formData.middleName || ""}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* last name */}
            <div>
              <Label
                htmlFor="lastName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* email */}
            <div>
              <Label
                htmlFor="email"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* birthday */}
            <div>
              <Label
                htmlFor="dateOfBirth"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Birthday
              </Label>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full text-left font-normal justify-between ${
                      !formData.dateOfBirth && "text-muted-foreground"
                    }`}
                  >
                    {formData.dateOfBirth ? (
                      format(new Date(formData.dateOfBirth), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="mr-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.dateOfBirth
                        ? new Date(formData.dateOfBirth)
                        : null
                    }
                    onSelect={(date) => {
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: format(date, "yyyy-MM-dd"),
                      }));
                      setIsDatePickerOpen(false);
                    }}
                    captionLayout="dropdown"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label
                htmlFor="gender"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Gender
              </Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* academic information card */}
      <Card className="w-full">
        <CardHeader>
          <div className="font-semibold text-lg sm:text-xl">
            Edit Academic Information
          </div>
        </CardHeader>
        {/* academic information */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            {/* department */}
            <div>
              <Label
                htmlFor="departmentName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Department
              </Label>
              <Input
                id="departmentName"
                value={formData.departmentName}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* course */}
            <div>
              <Label
                htmlFor="courseName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Course
              </Label>
              <Input
                id="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* year level */}
            <div>
              <Label
                htmlFor="yearLevelName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Year Level
              </Label>
              <Input
                id="yearLevelName"
                value={formData.yearLevelName}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            {/* section */}
            <div>
              <Label
                htmlFor="sectionName"
                className="text-xs font-semibold text-muted-foreground mb-2"
              >
                Section
              </Label>
              <Input
                id="sectionName"
                value={formData.sectionName}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" className="cursor-pointer" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="cursor-pointer" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
