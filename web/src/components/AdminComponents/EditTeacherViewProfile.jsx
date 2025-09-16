import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { storage } from "@/api/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowLeft, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditTeacherViewProfile({
  teacher,
  onSave,
  onCancel,
  academicData,
  loading,
}) {
  const [formData, setFormData] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (teacher && academicData) {
      const department = academicData.departments.find(
        (d) => d.departmentName === teacher.departmentName
      );

      const course = department
        ? academicData.courses.find(
            (c) =>
              c.courseName === teacher.courseName &&
              c.departmentId === department.id
          )
        : null;

      const yearLevel = course
        ? academicData.yearLevels.find(
            (y) =>
              y.yearLevelName === teacher.yearLevelName &&
              y.courseId === course.id
          )
        : null;

      const section = yearLevel
        ? academicData.sections.find(
            (s) =>
              s.sectionName === teacher.sectionName &&
              s.yearLevelId === yearLevel.id
          )
        : null;

      setFormData({
        ...teacher,
        departmentId: department?.id || "",
        courseId: course?.id || "",
        yearLevelId: yearLevel?.id || "",
        sectionId: section?.id || "",
      });
    }
  }, [teacher, academicData]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // handler for select inputs
  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "departmentId" && {
        courseId: "",
        yearLevelId: "",
        sectionId: "",
      }),
      ...(field === "courseId" && {
        yearLevelId: "",
        sectionId: "",
      }),
      ...(field === "yearLevelId" && {
        sectionId: "",
      }),
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("First name and last name are required");
      return;
    }

    const updatedTeacherData = {
      ...formData,
      departmentName:
        academicData.departments.find((d) => d.id === formData.departmentId)
          ?.departmentName || "",
      courseName:
        academicData.courses.find((c) => c.id === formData.courseId)
          ?.courseName || "",
      yearLevelName:
        academicData.yearLevels.find((y) => y.id === formData.yearLevelId)
          ?.yearLevelName || "",
      sectionName:
        academicData.sections.find((s) => s.id === formData.sectionId)
          ?.sectionName || "",
    };

    if (selectedImage) {
      const storageRef = ref(
        storage,
        `teachersPhoto/${teacher.employeeNumber}/${selectedImage.name}`
      );
      await uploadBytes(storageRef, selectedImage);
      const photoURL = await getDownloadURL(storageRef);
      updatedTeacherData.photoURL = photoURL;
    }

    onSave(updatedTeacherData);
  };

  if (
    loading ||
    !academicData ||
    !formData ||
    !academicData.departments.length
  ) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-muted-foreground">Loading academic data...</p>
      </div>
    );
  }

  const currentPhotoURL = selectedImage
    ? URL.createObjectURL(selectedImage)
    : formData.photoURL;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between">
        <Button
          variant="outline"
          className="cursor-pointer text-sm gap-2"
          onClick={onCancel}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* edit profile picture */}
        <Card className="w-full max-w-sm mx-auto lg:mx-0">
          <CardHeader>
            <div className="font-semibold text-lg sm:text-xl">
              Edit Profile Picture
            </div>
          </CardHeader>
          {/* edit profile picture */}
          <CardContent className="p-4 sm:p-6 flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4 rounded-full group">
              {selectedImage || formData.photoURL ? (
                <img
                  src={currentPhotoURL}
                  alt="Avatar"
                  className="w-full h-full rounded-full border-4 border-white shadow-md object-cover transition-opacity duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/144x144/b6e3f4/4a4a4a?text=Student";
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold select-none">
                  {`${formData.firstName?.charAt(0) || ""}${
                    formData.lastName?.charAt(0) || ""
                  }`}
                </div>
              )}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="w-8 h-8 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Click the image to change
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="w-full flex flex-col gap-4">
          {/* edit teach info */}
          <Card className="w-full">
            <CardHeader>
              <div className="font-semibold text-lg sm:text-xl">
                Edit Teacher Information
              </div>
            </CardHeader>
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
                {/* suffix */}
                <div>
                  <Label
                    htmlFor="suffix"
                    className="text-xs font-semibold text-muted-foreground mb-2"
                  >
                    Suffix
                  </Label>
                  <Input
                    id="suffix"
                    value={formData.suffix || ""}
                    onChange={handleInputChange}
                    className="text-sm"
                    placeholder="e.g., Jr., Sr., III"
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
                        fromYear={1950}
                        toYear={new Date().getFullYear() - 25} // Minimum age for teachers
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* gender */}
                <div>
                  <Label
                    htmlFor="gender"
                    className="text-xs font-semibold text-muted-foreground mb-2"
                  >
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* edit acad info */}
          <Card className="w-full">
            <CardHeader>
              <div className="font-semibold text-lg sm:text-xl">
                Edit Academic Information
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                {/* department */}
                <div>
                  <Label
                    htmlFor="departmentId"
                    className="text-xs font-semibold text-muted-foreground mb-2"
                  >
                    Department
                  </Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      handleSelectChange("departmentId", value)
                    }
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select a Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...academicData.departments]
                        .sort((a, b) =>
                          a.departmentName.localeCompare(b.departmentName)
                        )
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.departmentName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* course */}
                <div>
                  <Label
                    htmlFor="courseId"
                    className="text-xs font-semibold text-muted-foreground mb-2"
                  >
                    Course
                  </Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) =>
                      handleSelectChange("courseId", value)
                    }
                    disabled={!formData.departmentId}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select a Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicData.courses
                        .filter((c) => c.departmentId === formData.departmentId)
                        .map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.courseName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* year level */}
                <div>
                  <Label
                    htmlFor="yearLevelId"
                    className="text-xs font-semibold text-muted-foreground mb-2"
                  >
                    Year Level
                  </Label>
                  <Select
                    value={formData.yearLevelId}
                    onValueChange={(value) =>
                      handleSelectChange("yearLevelId", value)
                    }
                    disabled={!formData.courseId}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select a Year Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicData.yearLevels
                        .filter((y) => y.courseId === formData.courseId)
                        .sort((a, b) => {
                          const getYearLevel = (name) => {
                            const match = name.match(/^(\d+)/);
                            return match ? parseInt(match[0], 10) : 0;
                          };
                          return (
                            getYearLevel(a.yearLevelName) -
                            getYearLevel(b.yearLevelName)
                          );
                        })
                        .map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.yearLevelName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* section */}
                <div>
                  <Label
                    htmlFor="sectionId"
                    className="text-xs font-semibold text-muted-foreground mb-2"
                  >
                    Section
                  </Label>
                  <Select
                    value={formData.sectionId}
                    onValueChange={(value) =>
                      handleSelectChange("sectionId", value)
                    }
                    disabled={!formData.yearLevelId}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select a Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicData.sections
                        .filter((s) => s.yearLevelId === formData.yearLevelId)
                        .sort((a, b) => {
                          // extract number from section names (e.g., "BT-101" => 101)
                          const getSectionNumber = (name) => {
                            const match = name.match(/\d+/);
                            return match ? parseInt(match[0], 10) : 0;
                          };

                          // sort section prefix (e.g., "BT")
                          const prefixA = a.sectionName.split("-")[0];
                          const prefixB = b.sectionName.split("-")[0];
                          if (prefixA !== prefixB) {
                            return prefixA.localeCompare(prefixB);
                          }

                          // sort by section number
                          return (
                            getSectionNumber(a.sectionName) -
                            getSectionNumber(b.sectionName)
                          );
                        })
                        .map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.sectionName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
