import { db } from "@/api/firebase";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  getDoc,
  where,
} from "firebase/firestore";
import AddAcademicYearModal from "@/components/AdminComponents/AddAcademicYearModal";
import AddSemesterModal from "@/components/AdminComponents/AddSemesterModal";
import AcademicYearCard from "@/components/AdminComponents/AcademicYearCard";

export default function AcademicYearAndSemesterTable() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [isAddAcadYearModalOpen, setAddAcadYearModalOpen] = useState(false);
  const [isAddSemesterModalOpen, setAddSemesterModalOpen] = useState(false);
  const [currentAcadYear, setCurrentAcadYear] = useState(null);

  const fetchAcademicData = useCallback(async () => {
    setLoading(true);
    try {
      const acadYearsColRef = collection(db, "academic_years");
      const q = query(acadYearsColRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const acadYearList = await Promise.all(
        querySnapshot.docs.map(async (acadDoc) => {
          const acadYearData = {
            id: acadDoc.id,
            ...acadDoc.data(),
            semesters: [],
          };

          const semestersColRef = collection(
            db,
            "academic_years",
            acadDoc.id,
            "semesters"
          );
          const semestersQuery = query(
            semestersColRef,
            orderBy("createdAt", "asc")
          );
          const semesterSnapshot = await getDocs(semestersQuery);

          acadYearData.semesters = semesterSnapshot.docs.map((semDoc) => ({
            id: semDoc.id,
            ...semDoc.data(),
          }));

          acadYearData.semesters.sort((a, b) => {
            if (a.status === "Active") return -1;
            if (b.status === "Active") return 1;
            return 0;
          });

          return acadYearData;
        })
      );

      acadYearList.sort((a, b) => {
        const statusOrder = { Active: 1, Upcoming: 2, Archived: 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      });

      setAcademicYears(acadYearList);
    } catch (error) {
      console.error("Error fetching academic data: ", error);
      toast.error("Failed to fetch academic data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  const handleAddAcademicYear = async (yearName, copyData = null) => {
    try {
      const acadYearRef = await addDoc(collection(db, "academic_years"), {
        acadYear: yearName,
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

        if (copyData && copyData.copyFrom) {
        const sourceYearId = copyData.copyFrom;
        
        toast.info(
          "Copying configurations from previous school year, please wait...",
          {
            duration: 5000,
          }
        );

        // Copy all configurations in sequence
        await copySemesters(sourceYearId, acadYearRef.id);
        await copyDepartments(sourceYearId, acadYearRef.id);
        await copyCourses(sourceYearId, acadYearRef.id);
        await copyYearLevels(sourceYearId, acadYearRef.id);
        await copySections(sourceYearId, acadYearRef.id);
        await copySubjects(sourceYearId, acadYearRef.id);
      }

      toast.success(`School Year "${yearName}" added successfully!`, 
        {
          duration: 5000,
        }
      );
      fetchAcademicData();
      return true;
    } catch (error) {
      console.error("Error adding school year: ", error);
      toast.error("Failed to add school year.");
      return false;
    }
  };

  // function to copy semesters
  const copySemesters = async (sourceYearId, targetYearId) => {
    try {
      const semestersRef = collection(
        db,
        "academic_years",
        sourceYearId,
        "semesters"
      );
      const semestersSnapshot = await getDocs(semestersRef);

      if (!semestersSnapshot.empty) {
        const batch = writeBatch(db);

        semestersSnapshot.docs.forEach((semDoc) => {
          const semData = semDoc.data();
          const newSemRef = doc(
            collection(db, "academic_years", targetYearId, "semesters")
          );

          // copy with "Upcoming" status regardless of original status
          batch.set(newSemRef, {
            semesterName: semData.semesterName,
            startDate: semData.startDate || null,
            endDate: semData.endDate || null,
            status: "Upcoming",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
        toast.success("Semesters copied successfully.");
      }
    } catch (error) {
      console.error("Error copying semesters: ", error);
      toast.error("Failed to copy semesters.");
      return false;
    }
  };

  // function to copy departments
  const copyDepartments = async (sourceYearId, targetYearId) => {
    try {
      const sourceSemestersRef = collection(db, "academic_years", sourceYearId, "semesters");
      let sourceSemesterId;

      const activeSemQuery = query(sourceSemestersRef, where("status", "==", "Active"));
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(sourceSemestersRef, orderBy("createdAt", "desc"), limit(1));
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy departments from.");
          return false; // No semesters to copy from
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }
      
      // get departments from the determined source semester
      const deptRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments");
      const deptSnapshot = await getDocs(deptRef);

      if (deptSnapshot.empty) {
        return false; // Nothing to copy
      }

      // get target semesters
      const targetSemestersRef = collection(db, "academic_years", targetYearId, "semesters");
      const targetSemSnapshot = await getDocs(targetSemestersRef);

      if (!targetSemSnapshot.empty) {
        const batch = writeBatch(db);

        // copy departments to each target semester
        for (const targetSemDoc of targetSemSnapshot.docs) {
          const targetSemId = targetSemDoc.id;

          for (const deptDoc of deptSnapshot.docs) {
            const deptData = deptDoc.data();
            const newDeptRef = doc(collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments"));

            batch.set(newDeptRef, {
              academicYearId: targetYearId,
              semesterId: targetSemId,
              departmentName: deptData.departmentName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
        await batch.commit();
        toast.success("Departments copied successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error copying departments: ", error);
      toast.error("Failed to copy departments.");
      return false;
    }
  };

 // function to copy courses
  const copyCourses = async (sourceYearId, targetYearId) => {
    try {
      
      const sourceSemestersRef = collection(db, "academic_years", sourceYearId, "semesters");
      let sourceSemesterId;

      const activeSemQuery = query(sourceSemestersRef, where("status", "==", "Active"));
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(sourceSemestersRef, orderBy("createdAt", "desc"), limit(1));
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy courses from.");
          return false;
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }
      

      const sourceDeptRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments");
      const sourceDeptSnapshot = await getDocs(sourceDeptRef);

      if (sourceDeptSnapshot.empty) {
        return false; // No departments to copy courses from
      }

      const batch = writeBatch(db);
      const targetSemestersRef = collection(db, "academic_years", targetYearId, "semesters");
      const targetSemSnapshot = await getDocs(targetSemestersRef);

      if (targetSemSnapshot.empty) {
        return false; // No target semesters to copy to
      }

      for (const targetSemDoc of targetSemSnapshot.docs) {
        const targetSemId = targetSemDoc.id;
        const targetDeptRef = collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments");
        const targetDeptSnapshot = await getDocs(targetDeptRef);

        const deptNameToIdMap = {};
        targetDeptSnapshot.docs.forEach(dept => {
          deptNameToIdMap[dept.data().departmentName] = dept.id;
        });

        for (const sourceDeptDoc of sourceDeptSnapshot.docs) {
          const sourceDeptData = sourceDeptDoc.data();
          const sourceDeptId = sourceDeptDoc.id;
          const targetDeptId = deptNameToIdMap[sourceDeptData.departmentName];

          if (targetDeptId) {
            const sourceCoursesRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments", sourceDeptId, "courses");
            const sourceCoursesSnapshot = await getDocs(sourceCoursesRef);

            sourceCoursesSnapshot.docs.forEach(courseDoc => {
              const courseData = courseDoc.data();
              const newCourseRef = doc(collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments", targetDeptId, "courses"));

              batch.set(newCourseRef, {
                departmentId: targetDeptId,
                departmentName: sourceDeptData.departmentName,
                courseCode: courseData.courseCode,
                courseName: courseData.courseName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
          }
        }
      }

      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Courses copied successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error copying courses:", error);
      toast.error("Failed to copy courses.");
      return false;
    }
  };

  // function to copy year levels
  const copyYearLevels = async (sourceYearId, targetYearId) => {
    try {
      const sourceSemestersRef = collection(db, "academic_years", sourceYearId, "semesters");
      let sourceSemesterId;

      const activeSemQuery = query(sourceSemestersRef, where("status", "==", "Active"));
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(sourceSemestersRef, orderBy("createdAt", "desc"), limit(1));
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy year levels from.");
          return false;
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }
      

      const sourceDeptRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments");
      const sourceDeptSnapshot = await getDocs(sourceDeptRef);

      if (sourceDeptSnapshot.empty) {
        return false;
      }

      const targetSemestersRef = collection(db, "academic_years", targetYearId, "semesters");
      const targetSemSnapshot = await getDocs(targetSemestersRef);

      if (targetSemSnapshot.empty) {
        return false;
      }

      const batch = writeBatch(db);

      for (const targetSemDoc of targetSemSnapshot.docs) {
        const targetSemId = targetSemDoc.id;
        const targetDeptRef = collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments");
        const targetDeptSnapshot = await getDocs(targetDeptRef);

        for (const targetDeptDoc of targetDeptSnapshot.docs) {
          const targetDeptId = targetDeptDoc.id;
          const targetDeptData = targetDeptDoc.data();

          const sourceDeptDoc = sourceDeptSnapshot.docs.find(
            dept => dept.data().departmentName === targetDeptData.departmentName
          );

          if (sourceDeptDoc) {
            const sourceDeptId = sourceDeptDoc.id;
            const targetCoursesRef = collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments", targetDeptId, "courses");
            const targetCoursesSnapshot = await getDocs(targetCoursesRef);
            const sourceCoursesRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments", sourceDeptId, "courses");
            const sourceCoursesSnapshot = await getDocs(sourceCoursesRef);

            for (const targetCourseDoc of targetCoursesSnapshot.docs) {
              const targetCourseId = targetCourseDoc.id;
              const targetCourseData = targetCourseDoc.data();

              const sourceCourseDoc = sourceCoursesSnapshot.docs.find(
                course => course.data().courseName === targetCourseData.courseName
              );

              if (sourceCourseDoc) {
                const sourceCourseId = sourceCourseDoc.id;
                const sourceYearLevelsRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments", sourceDeptId, "courses", sourceCourseId, "year_levels");
                const sourceYearLevelsSnapshot = await getDocs(sourceYearLevelsRef);

                sourceYearLevelsSnapshot.docs.forEach(yearLevelDoc => {
                  const yearLevelData = yearLevelDoc.data();
                  const newYearLevelRef = doc(collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments", targetDeptId, "courses", targetCourseId, "year_levels"));

                  batch.set(newYearLevelRef, {
                    courseId: targetCourseId,
                    departmentId: targetDeptId,
                    yearLevelName: yearLevelData.yearLevelName,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                });
              }
            }
          }
        }
      }

      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Year Levels copied successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error copying year levels:", error);
      toast.error("Failed to copy year levels.");
      return false;
    }
  };

  // function to copy subjects
  const copySubjects = async (sourceYearId, targetYearId) => {
    try {
      // Find the source semester to copy from. Prioritize the 'Active' semester,
      // but fall back to the most recently created one if none are active.
      const sourceSemestersRef = collection(db, "academic_years", sourceYearId, "semesters");
      let sourceSemesterId;

      const activeSemQuery = query(sourceSemestersRef, where("status", "==", "Active"));
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(sourceSemestersRef, orderBy("createdAt", "desc"), limit(1));
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy subjects from.");
          return false;
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }

      // Get all semesters in the new academic year where we'll copy the subjects to.
      const targetSemestersRef = collection(db, "academic_years", targetYearId, "semesters");
      const targetSemSnapshot = await getDocs(targetSemestersRef);
      if (targetSemSnapshot.empty) {
        return false; // No target semesters to copy to.
      }

      const batch = writeBatch(db);

      // Get all departments from the source semester just once to avoid re-fetching.
      const sourceDeptRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments");
      const sourceDeptSnapshot = await getDocs(sourceDeptRef);
      if (sourceDeptSnapshot.empty) {
        return false; // Nothing to copy if there are no departments.
      }

      // Loop through each semester in the new academic year.
      for (const targetSemDoc of targetSemSnapshot.docs) {
        const targetSemId = targetSemDoc.id;

        // Get the corresponding departments in the target semester.
        const targetDeptRef = collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments");
        const targetDeptSnapshot = await getDocs(targetDeptRef);
        const targetDeptMap = new Map(
          targetDeptSnapshot.docs.map(doc => [doc.data().departmentName, doc.id])
        );

        // Match source departments with target departments by name.
        for (const sourceDeptDoc of sourceDeptSnapshot.docs) {
          const sourceDeptData = sourceDeptDoc.data();
          const sourceDeptId = sourceDeptDoc.id;
          const targetDeptId = targetDeptMap.get(sourceDeptData.departmentName);

          if (!targetDeptId) continue; // Skip if department doesn't exist in the target.

          // Match courses within the matched department.
          const sourceCoursesRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments", sourceDeptId, "courses");
          const sourceCoursesSnapshot = await getDocs(sourceCoursesRef);
          const targetCoursesRef = collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments", targetDeptId, "courses");
          const targetCoursesSnapshot = await getDocs(targetCoursesRef);
          const targetCourseMap = new Map(
            targetCoursesSnapshot.docs.map(doc => [doc.data().courseName, doc.id])
          );

          for (const sourceCourseDoc of sourceCoursesSnapshot.docs) {
            const sourceCourseData = sourceCourseDoc.data();
            const sourceCourseId = sourceCourseDoc.id;
            const targetCourseId = targetCourseMap.get(sourceCourseData.courseName);
            
            if (!targetCourseId) continue; // Skip if course doesn't exist in the target.

            // Match year levels within the matched course.
            const sourceYearLevelsRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments", sourceDeptId, "courses", sourceCourseId, "year_levels");
            const sourceYearLevelsSnapshot = await getDocs(sourceYearLevelsRef);
            const targetYearLevelsRef = collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments", targetDeptId, "courses", targetCourseId, "year_levels");
            const targetYearLevelsSnapshot = await getDocs(targetYearLevelsRef);
            const targetYearLevelMap = new Map(
              targetYearLevelsSnapshot.docs.map(doc => [doc.data().yearLevelName, doc.id])
            );

            for (const sourceYearLevelDoc of sourceYearLevelsSnapshot.docs) {
              const sourceYearLevelData = sourceYearLevelDoc.data();
              const sourceYearLevelId = sourceYearLevelDoc.id;
              const targetYearLevelId = targetYearLevelMap.get(sourceYearLevelData.yearLevelName);

              if (!targetYearLevelId) continue; // Skip if year level doesn't exist.

              // Finally, get the subjects from the source and add them to the batch.
              const sourceSubjectsRef = collection(db, "academic_years", sourceYearId, "semesters", sourceSemesterId, "departments", sourceDeptId, "courses", sourceCourseId, "year_levels", sourceYearLevelId, "subjects");
              const sourceSubjectsSnapshot = await getDocs(sourceSubjectsRef);
              
              sourceSubjectsSnapshot.docs.forEach(subjectDoc => {
                const subjectData = subjectDoc.data();
                // Define the path for the new subject document in the target location.
                const newSubjectRef = doc(collection(db, "academic_years", targetYearId, "semesters", targetSemId, "departments", targetDeptId, "courses", targetCourseId, "year_levels", targetYearLevelId, "subjects"));
                
                batch.set(newSubjectRef, {
                  academicYearId: targetYearId,
                  semesterId: targetSemId,
                  departmentId: targetDeptId,
                  departmentName: subjectData.departmentName,
                  courseId: targetCourseId,
                  courseName: sourceCourseData.courseName,
                  yearLevelId: targetYearLevelId,
                  yearLevelName: sourceYearLevelData.yearLevelName,
                  createdBy: subjectData.createdBy || null,
                  description: subjectData.description || "",
                  subjectName: subjectData.subjectName,
                  subjectCode: subjectData.subjectCode,
                  status: subjectData.status || "Approved",
                  statusComment: subjectData.statusComment || "",
                  statusHistory: subjectData.statusHistory || [],
                  units: subjectData.units || 0,
                  updatedBy: subjectData.updatedBy || null,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              });
            }
          }
        }
      }

      // Commit all the batched writes to Firestore.
      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Subjects copied successfully.");
      }
      return true;

    } catch (error) {
      console.error("Error copying subjects:", error);
      toast.error("Failed to copy subjects.");
      return false;
    }
  };

  // function to copy sections
  const copySections = async (sourceYearId, targetYearId) => {
    try {
      const sourceSemestersRef = collection(db, "academic_years", sourceYearId, "semesters");
      let sourceSemesterId;

      const activeSemQuery = query(sourceSemestersRef, where("status", "==", "Active"));
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(sourceSemestersRef, orderBy("createdAt", "desc"), limit(1));
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy sections from.");
          return false;
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }
      

      const targetSemestersRef = collection(db, "academic_years", targetYearId, "semesters");
      const targetSemSnapshot = await getDocs(targetSemestersRef);

      if (targetSemSnapshot.empty) {
        return false; // No target semesters to copy to
      }

      const batch = writeBatch(db);

      for (const targetSemDoc of targetSemSnapshot.docs) {
        const targetSemId = targetSemDoc.id;

        await processNestedCollections(
          batch,
          db,
          sourceYearId,
          sourceSemesterId,
          targetYearId,
          targetSemId
        );
      }

      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Sections copied successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error copying sections:", error);
      toast.error("Failed to copy sections.");
      return false;
    }
  };

  // helper function to process nested collections (sections)
  const processNestedCollections = async (
    batch,
    db,
    sourceYearId,
    sourceSemesterId,
    targetYearId,
    targetSemId,
    sourcePath = [],
    targetPath = [],
    collectionLevel = 0
  ) => {
    const collectionHierarchy = ["departments", "courses", "year_levels", "sections"];

    if (collectionLevel >= collectionHierarchy.length) {
      return; // Base case
    }

    const currentCollection = collectionHierarchy[collectionLevel];

    // --- START: Corrected Path Building Logic ---
    const sourceBaseRef = doc(db, "academic_years", sourceYearId, "semesters", sourceSemesterId);
    const targetBaseRef = doc(db, "academic_years", targetYearId, "semesters", targetSemId);

    const sourceCollectionRef = sourcePath.length > 0
      ? collection(doc(sourceBaseRef, ...sourcePath), currentCollection)
      : collection(sourceBaseRef, currentCollection);

    const targetCollectionRef = targetPath.length > 0
      ? collection(doc(targetBaseRef, ...targetPath), currentCollection)
      : collection(targetBaseRef, currentCollection);
    // --- END: Corrected Path Building Logic ---

    const sourceDocsSnapshot = await getDocs(sourceCollectionRef);
    const targetDocsSnapshot = await getDocs(targetCollectionRef);

    if (currentCollection === "sections") {
      sourceDocsSnapshot.docs.forEach(sectionDoc => {
        const sectionData = sectionDoc.data();
        const newSectionRef = doc(targetCollectionRef);

        batch.set(newSectionRef, {
          sectionName: sectionData.sectionName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      return;
    }

    const targetDocs = {};
    targetDocsSnapshot.docs.forEach((doc) => {
      const nameField =
        currentCollection === "departments"
          ? "departmentName"
          : currentCollection === "courses"
          ? "courseName"
          : "yearLevelName";
      targetDocs[doc.data()[nameField]] = { id: doc.id };
    });

    for (const sourceDoc of sourceDocsSnapshot.docs) {
      const sourceData = sourceDoc.data();
      const nameField =
        currentCollection === "departments"
          ? "departmentName"
          : currentCollection === "courses"
          ? "courseName"
          : "yearLevelName";

      if (targetDocs[sourceData[nameField]]) {
        const targetDocId = targetDocs[sourceData[nameField]].id;

        const newSourcePath = [...sourcePath, currentCollection, sourceDoc.id];
        const newTargetPath = [...targetPath, currentCollection, targetDocId];

        await processNestedCollections(
          batch,
          db,
          sourceYearId,
          sourceSemesterId,
          targetYearId,
          targetSemId,
          newSourcePath,
          newTargetPath,
          collectionLevel + 1
        );
      }
    }
  };

  const handleSetActiveAcademicYear = async (acadYearToActivate) => {
    setActionLoading(acadYearToActivate.id);
    const batch = writeBatch(db);
    const acadYearsRef = collection(db, "academic_years");
    const currentActiveYear = academicYears.find(
      (ay) => ay.status === "Active"
    );

    if (currentActiveYear) {
      const activeYearDocRef = doc(acadYearsRef, currentActiveYear.id);
      batch.update(activeYearDocRef, { status: "Archived" });

      if (
        currentActiveYear.semesters &&
        currentActiveYear.semesters.length > 0
      ) {
        toast.info(
          `Archiving all semesters for ${currentActiveYear.acadYear}.`
        );
        currentActiveYear.semesters.forEach((semester) => {
          const semesterDocRef = doc(
            db,
            "academic_years",
            currentActiveYear.id,
            "semesters",
            semester.id
          );
          if (semester.status !== "Archived") {
            batch.update(semesterDocRef, { status: "Archived" });
          }
        });
      }
    }

    const newActiveDocRef = doc(acadYearsRef, acadYearToActivate.id);
    batch.update(newActiveDocRef, { status: "Active" });

    try {
      await batch.commit();
      toast.success(
        `${acadYearToActivate.acadYear} is now the active academic year.`
      );
      fetchAcademicData();
    } catch (error) {
      console.error("Error setting active academic year: ", error);
      toast.error("Failed to set active academic year.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateAcademicYear = async (id, editedYearName) => {
    try {
      const acadYearRef = doc(db, "academic_years", id);
      await updateDoc(acadYearRef, {
        acadYear: editedYearName,
        updatedAt: serverTimestamp(),
      });
      toast.success(`School Year updated to "${editedYearName}"`);
      fetchAcademicData();
    } catch (error) {
      console.error("Error updating academic year: ", error);
      toast.error("Failed to update academic year.");
    }
  };

  const handleDeleteAcademicYear = async (acadYearToDelete) => {
    if (acadYearToDelete.status === "Active") {
      toast.error("Cannot delete an active academic year.");
      return;
    }

    if (acadYearToDelete.semesters && acadYearToDelete.semesters.length > 0) {
      toast.error(
        "Cannot delete this academic year. Please remove all semesters first."
      );
      return;
    }

    const acadYearRef = doc(db, "academic_years", acadYearToDelete.id);
    try {
      await deleteDoc(acadYearRef);
      toast.success("Academic year deleted successfully.");
      fetchAcademicData();
    } catch (error) {
      toast.error("Failed to delete academic year.");
      console.error("Error deleting academic year:", error);
    }
  };

  const handleAddSemester = async (formData) => {
    if (!currentAcadYear) {
      toast.error("No academic year selected.");
      return false;
    }
    try {
      const semestersColRef = collection(
        db,
        "academic_years",
        currentAcadYear.id,
        "semesters"
      );
      await addDoc(semestersColRef, {
        ...formData,
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(
        `Semester "${formData.semesterName}" added to ${currentAcadYear.acadYear}.`
      );
      fetchAcademicData();
      return true;
    } catch (error) {
      console.error("Error adding semester: ", error);
      toast.error("Failed to add semester.");
      return false;
    }
  };

  const handleSetActiveSemester = async (
    semesterToActivate,
    academicYearId
  ) => {
    const academicYear = academicYears.find((ay) => ay.id === academicYearId);

    if (!academicYear) {
      toast.error("Associated school year not found.");
      return;
    }

    if (academicYear.status !== "Active") {
      toast.error(
        "A semester can only be set as active within the active school year."
      );
      return;
    }

    setActionLoading(semesterToActivate.id);
    const batch = writeBatch(db);
    const semestersRef = collection(
      db,
      "academic_years",
      academicYearId,
      "semesters"
    );
    if (!academicYear) return;

    academicYear.semesters.forEach((sem) => {
      const semRef = doc(semestersRef, sem.id);
      if (sem.id === semesterToActivate.id) {
        batch.update(semRef, { status: "Active" });
      } else if (sem.status === "Active") {
        batch.update(semRef, { status: "Archived" });
      }
    });

    try {
      await batch.commit();
      toast.success(
        `${semesterToActivate.semesterName} is now the active semester.`
      );
      fetchAcademicData();
    } catch (error) {
      console.error("Error setting active semester:", error);
      toast.error("Failed to set active semester.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSemester = async (semesterToDelete, academicYearId) => {
    if (semesterToDelete.status === "Active") {
      toast.error("Cannot delete an active semester.");
      return;
    }
    const semRef = doc(
      db,
      "academic_years",
      academicYearId,
      "semesters",
      semesterToDelete.id
    );
    try {
      await deleteDoc(semRef);
      toast.success("Semester deleted successfully.");
      fetchAcademicData();
    } catch (error) {
      toast.error("Failed to delete semester.");
      console.error("Error deleting semester:", error);
    }
  };

  const openAddSemesterModal = (acadYear) => {
    setCurrentAcadYear(acadYear);
    setAddSemesterModalOpen(true);
  };

  // skeleton loading state
  if (loading) {
    return (
      <div className="w-full p-4 space-y-4">
        <div className="mb-4">
          {/* header */}
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="flex items-center gap-2 py-4">
          <Skeleton className="h-9 w-40" />
        </div>
        {/* skeleton for academicyearcard */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-9 w-full mt-2" />
              {/* skeleton for semestercard */}
              <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Manage School Year and Semester
          </h1>
          <p className="text-muted-foreground">
            Manage school years and their corresponding semesters.
          </p>
        </div>
      </div>

      <div className="flex items-center py-4 gap-2">
        <AddAcademicYearModal
          onOpenChange={setAddAcadYearModalOpen}
          open={isAddAcadYearModalOpen}
          onAcademicYearAdded={handleAddAcademicYear}
          existingYears={academicYears.map((ay) => ay.acadYear)}
          academicYearsList={academicYears}
        />
      </div>

      <AddSemesterModal
        open={isAddSemesterModalOpen}
        onOpenChange={setAddSemesterModalOpen}
        activeAcadYear={currentAcadYear}
        existingSemesters={currentAcadYear?.semesters || []}
        onSemesterAdded={handleAddSemester}
      />

      {academicYears.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {academicYears.map((acadYear) => (
            <AcademicYearCard
              key={acadYear.id}
              acadYear={acadYear}
              onSetActive={handleSetActiveAcademicYear}
              onUpdate={handleUpdateAcademicYear}
              onDelete={handleDeleteAcademicYear}
              onAddSemesterClick={() => openAddSemesterModal(acadYear)}
              isActivating={actionLoading === acadYear.id}
              handleSetActiveSemester={handleSetActiveSemester}
              handleDeleteSemester={handleDeleteSemester}
              actionLoading={actionLoading}
              onDataRefresh={fetchAcademicData}
              existingYears={academicYears.map((ay) => ay.acadYear)}
            />
          ))}
        </div>
      ) : (
        <Card className="py-12 mt-4">
          <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No school years found.</p>
            <p className="text-sm text-muted-foreground">
              Click "Add School Year" to create one.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
