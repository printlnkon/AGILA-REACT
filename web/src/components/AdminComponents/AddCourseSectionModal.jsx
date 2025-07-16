import { db } from "@/api/firebase";
import { useState, useCallback, useEffect } from "react";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AddCourseSectionModal({ activeSession }) {
  const [editMode, setEditMode] = useState(false);
  const [yearLevels, setYearLevels] = useState([]);

  // course functions
  const [courses, setCourses] = useState([]);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseData, setCourseData] = useState({
    courseName: "",
    courseCode: "",
  });

  // section functions
  const [sections, setSections] = useState({});
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionData, setSectionData] = useState({
    sectionName: "",
    courseId: "",
    yearLevel: "",
  });

  // fetch course and section data
  const fetchCourseAndSectionData = useCallback(async () => {
    if (!activeSession || !activeSession.id || !activeSession.semesterId) {
      setCourses([]);
      setSections({});
      return;
    }

    try {
      // fetch courses
      const coursesRef = collection(db, "courses");
      const coursesQuery = query(
        coursesRef,
        where("academicYearId", "==", activeSession.id),
        where("semesterId", "==", activeSession.semesterId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);

      // fetch sections per course
      const sectionsRef = collection(db, "sections");
      const sectionsQuery = query(
        sectionsRef,
        where("academicYearId", "==", activeSession.id),
        where("semesterId", "==", activeSession.semesterId)
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
      const sectionsData = {};

      sectionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.courseId) {
          if (!sectionsData[data.courseId]) {
            sectionsData[data.courseId] = [];
          }
          sectionsData[data.courseId].push({
            id: doc.id,
            ...data,
          });
        }
      });
      setSections(sectionsData);

      // fetch year levels from Firestore
      const yearLevelsRef = collection(db, "year_levels");
      const yearLevelsSnapshot = await getDocs(yearLevelsRef);
      if (yearLevelsSnapshot.empty) {
        // if no year levels found, set empty array
        setYearLevels([]);
      } else {
        const yearLevelsData = yearLevelsSnapshot.docs.map(
          (doc) => doc.data().yearLevelName
        );
        setYearLevels(yearLevelsData);
      }
    } catch (error) {
      console.error("Error fetching course and section data:", error);
      toast.error("Failed to load course and section data.");
    }
  }, [activeSession]);

  //   fetch course and section data
  useEffect(() => {
    if (activeSession) {
      fetchCourseAndSectionData();
    }
  }, [activeSession, fetchCourseAndSectionData]);

  const handleOpenCourseModal = (course = null) => {
    if (course) {
      setCourseData({
        courseName: course.courseName || "",
        courseCode: course.courseCode || "",
      });
      setEditMode(true);
      setCurrentCourseId(course.id);
    } else {
      setCourseData({ courseName: "", courseCode: "" });
      setEditMode(false);
      setCurrentCourseId(null);
    }
    setIsCourseModalOpen(true);
  };

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const saveCourse = async () => {
    if (!courseData.courseName || !courseData.courseCode) {
      toast.error("Please fill in all course fields.");
      return;
    }

    if (!activeSession || !activeSession.id || !activeSession.semesterId) {
      toast.error("Cannot add course. No active academic year or semester.");
      return;
    }

    try {
      if (editMode && currentCourseId) {
        // Update existing course
        const courseRef = doc(db, "courses", currentCourseId);
        await updateDoc(courseRef, courseData);
        toast.success("Course updated successfully!");
      } else {
        // Add new course
        const coursesRef = collection(db, "courses");
        await addDoc(coursesRef, {
          ...courseData,
          academicYearId: activeSession.id,
          semesterId: activeSession.semesterId,
        });
        toast.success("Course added successfully!");
      }
      setIsCourseModalOpen(false);
      fetchCourseAndSectionData();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course.");
    }
  };

  const handleOpenSectionModal = (section = null) => {
    if (section) {
      setSectionData({
        sectionName: section.sectionName || "",
        courseId: section.courseId || "",
        yearLevel: section.yearLevel || "",
      });
      setEditMode(true);
      setCurrentSectionId(section.id);
    } else {
      setSectionData({ sectionName: "", courseId: "", yearLevel: "" });
      setEditMode(false);
      setCurrentSectionId(null);
    }
    setIsSectionModalOpen(true);
  };

  const handleSectionInputChange = (e) => {
    const { name, value } = e.target;
    setSectionData((prev) => ({ ...prev, [name]: value }));
  };

  const saveSection = async () => {
    if (
      !sectionData.sectionName ||
      !sectionData.courseId ||
      !sectionData.yearLevel
    ) {
      toast.error("Please fill in all section fields.");
      return;
    }

    if (!activeSession || !activeSession.id || !activeSession.semesterId) {
      toast.error("Cannot add section. No active academic year or semester.");
      return;
    }

    try {
      if (editMode && currentSectionId) {
        // Update existing section
        const sectionRef = doc(db, "sections", currentSectionId);
        await updateDoc(sectionRef, sectionData);
        toast.success("Section updated successfully.");
      } else {
        // Add new section
        const sectionsRef = collection(db, "sections");
        await addDoc(sectionsRef, {
          ...sectionData,
          academicYearId: activeSession.id,
          semesterId: activeSession.semesterId,
        });
        toast.success("Section added successfully.");
      }
      setIsSectionModalOpen(false);
      fetchCourseAndSectionData();
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Failed to save section.");
    }
  };

  return (
    <>
      {/* add course and section btn */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="cursor-pointer mr-2">
            <Plus /> Add New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => handleOpenCourseModal()}
            className="cursor-pointer"
          >
            Add Course
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleOpenSectionModal()}
            className="cursor-pointer"
          >
            Add Section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* course dialog */}
      <Dialog open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Course" : "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              Enter the course details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseName" className="text-right">
                Name
              </Label>
              <Input
                id="courseName"
                name="courseName"
                value={courseData.courseName}
                onChange={handleCourseInputChange}
                className="col-span-3"
                placeholder="e.g., Bachelor of Science in Information Technology"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode" className="text-right">
                Code
              </Label>
              <Input
                id="courseCode"
                name="courseCode"
                value={courseData.courseCode}
                onChange={handleCourseInputChange}
                className="col-span-3"
                placeholder="e.g., BSIT"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="cursor-pointer" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button className="cursor-pointer" onClick={saveCourse}>
              {editMode ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* section dialog */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Section" : "Add New Section"}
            </DialogTitle>
            <DialogDescription>
              Enter the section details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionName" className="text-right">
                Section
              </Label>
              <Input
                id="sectionName"
                name="sectionName"
                value={sectionData.sectionName}
                onChange={handleSectionInputChange}
                className="col-span-3"
                placeholder="e.g., BSIT-1101"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionCourse" className="text-right">
                Course
              </Label>
              <Select
                onValueChange={(value) =>
                  setSectionData((prev) => ({ ...prev, courseId: value }))
                }
                value={sectionData.courseId}
                disabled={!activeSession}
              >
                <SelectTrigger id="sectionCourse" className="col-span-3 w-full">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      // Corrected to use course.id as the value for robust relationship
                      <SelectItem key={course.id} value={course.id}>
                        {course.courseName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-courses" disabled>
                      No courses available for the active session.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionYearLevel" className="text-right">
                Year Level
              </Label>
              <Select
                onValueChange={(value) =>
                  setSectionData((prev) => ({ ...prev, yearLevel: value }))
                }
                value={sectionData.yearLevel}
                disabled={!activeSession}
              >
                <SelectTrigger
                  id="sectionYearLevel"
                  className="col-span-3 w-full"
                >
                  <SelectValue placeholder="Select Year Level" />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels.length > 0 ? (
                    yearLevels.map((yearLevel, index) => (
                      <SelectItem key={index} value={yearLevel}>
                        {yearLevel}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-courses" disabled>
                      No year levels available for the active session.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="cursor-pointer" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button className="cursor-pointer" onClick={saveSection}>
              {editMode ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
