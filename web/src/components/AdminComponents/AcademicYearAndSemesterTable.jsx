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
  where,
  limit,
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
            // Active semester always comes first
            if (a.status === "Active" && b.status !== "Active") return -1;
            if (b.status === "Active" && a.status !== "Active") return 1;

            // Then sort by semester name to place "1st" before "2nd"
            const aName = a.semesterName || "";
            const bName = b.semesterName || "";

            if (aName.includes("1st") && !bName.includes("1st")) return -1;
            if (bName.includes("1st") && !aName.includes("1st")) return 1;

            // Fallback to default sort for other names
            return aName.localeCompare(bName);
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
      toast.success(`School Year "${yearName}" created successfully!`, {
        duration: 3000,
      });

      if (copyData && copyData.copyFrom) {
        (async () => {
          const toastId = toast.loading(
            `Starting copy for ${yearName}...`
          );
          
          try {
            const sourceYearId = copyData.copyFrom;
            const targetYearId = acadYearRef.id;

            // update the toast after each step completes
            await copySemesters(sourceYearId, targetYearId);
            toast.loading(`Copying Departments for ${yearName}...`, { id: toastId });

            await copyDepartments(sourceYearId, targetYearId);
            toast.loading(`Copying Courses for ${yearName}...`, { id: toastId });

            await copyCourses(sourceYearId, targetYearId);
            toast.loading(`Copying Year Levels for ${yearName}...`, { id: toastId });

            await copyYearLevels(sourceYearId, targetYearId);
            toast.loading(`Copying Sections for ${yearName}...`, { id: toastId });

            await copySections(sourceYearId, targetYearId);
            toast.loading(`Copying Subjects for ${yearName}...`, { id: toastId });

            await copySubjects(sourceYearId, targetYearId);
            
            // update to a final success message
            toast.success(
              `All configurations for ${yearName} have been copied!`,
              {
                id: toastId,
                duration: 5000,
              }
            );

          } catch (error) {
            // if any step fails, update to an error message
            console.error("A failure occurred during the copy process: ", error);
            toast.error(
              `Failed to copy all configurations for ${yearName}.`,
              {
                id: toastId,
                duration: 5000,
              }
            );
          } finally {
            // refresh data regardless of success or failure
            fetchAcademicData();
          }
        })();
      } else {
        // if not copying, just refresh the data
        fetchAcademicData();
      }

      // return true immediately to close the modal
      return true;

    } catch (error) {
      console.error("Error adding school year: ", error);
      toast.error("Failed to create school year.");
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

          // copy semesters with "Upcoming" status regardless of original status
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

  // helper function to find the source semester (Active or latest)
  const findSourceSemesterId = async (sourceYearId) => {
    const sourceSemestersRef = collection(
      db,
      "academic_years",
      sourceYearId,
      "semesters"
    );
    let sourceSemesterId;

    const activeSemQuery = query(
      sourceSemestersRef,
      where("status", "==", "Active"),
      limit(1)
    );
    const activeSemSnapshot = await getDocs(activeSemQuery);

    if (!activeSemSnapshot.empty) {
      sourceSemesterId = activeSemSnapshot.docs[0].id;
    } else {
      const anySemQuery = query(
        sourceSemestersRef,
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const anySemSnapshot = await getDocs(anySemQuery);
      if (anySemSnapshot.empty) {
        console.log(
          `No source semesters found in academic year ${sourceYearId}.`
        );
        return null;
      }
      sourceSemesterId = anySemSnapshot.docs[0].id;
    }
    return sourceSemesterId;
  };

  // function to copy departments
  const copyDepartments = async (sourceYearId, targetYearId) => {
    try {
      const sourceSemestersRef = collection(
        db,
        "academic_years",
        sourceYearId,
        "semesters"
      );
      let sourceSemesterId;

      const activeSemQuery = query(
        sourceSemestersRef,
        where("status", "==", "Active")
      );
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(
          sourceSemestersRef,
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy departments from.");
          return false;
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }

      // get departments from the determined source semester
      const deptRef = collection(
        db,
        "academic_years",
        sourceYearId,
        "semesters",
        sourceSemesterId,
        "departments"
      );
      const deptSnapshot = await getDocs(deptRef);

      if (deptSnapshot.empty) {
        return false;
      }

      // get target semesters
      const targetSemestersRef = collection(
        db,
        "academic_years",
        targetYearId,
        "semesters"
      );
      const targetSemSnapshot = await getDocs(targetSemestersRef);

      if (!targetSemSnapshot.empty) {
        const batch = writeBatch(db);

        // copy departments to each target semester
        for (const targetSemDoc of targetSemSnapshot.docs) {
          const targetSemId = targetSemDoc.id;

          for (const deptDoc of deptSnapshot.docs) {
            const deptData = deptDoc.data();
            const newDeptRef = doc(
              collection(
                db,
                "academic_years",
                targetYearId,
                "semesters",
                targetSemId,
                "departments"
              )
            );
            // copy the departments
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
      const sourceSemesterId = await findSourceSemesterId(sourceYearId);
      if (!sourceSemesterId) {
        console.log("No source semester found to copy courses from.");
        return false;
      }

      // pre-fetch all source departments and their courses into a map
      const sourceDeptsMap = new Map();
      const sourceDeptsSnap = await getDocs(
        collection(
          db,
          "academic_years",
          sourceYearId,
          "semesters",
          sourceSemesterId,
          "departments"
        )
      );

      for (const deptDoc of sourceDeptsSnap.docs) {
        const deptData = deptDoc.data();
        const coursesSnap = await getDocs(collection(deptDoc.ref, "courses"));
        const courses = coursesSnap.docs.map((doc) => doc.data());
        if (courses.length > 0) {
          sourceDeptsMap.set(deptData.departmentName, courses);
        }
      }

      if (sourceDeptsMap.size === 0) {
        return true;
      }

      // pre-fetch all target semesters and their departments into a map
      const targetSemsMap = new Map();
      const targetSemsSnap = await getDocs(
        collection(db, "academic_years", targetYearId, "semesters")
      );

      for (const semDoc of targetSemsSnap.docs) {
        const deptsSnap = await getDocs(collection(semDoc.ref, "departments"));
        const depts = deptsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        targetSemsMap.set(semDoc.id, depts);
      }

      if (targetSemsMap.size === 0) {
        return false;
      }

      const batch = writeBatch(db);
      for (const [targetSemId, targetDepts] of targetSemsMap.entries()) {
        for (const targetDept of targetDepts) {
          const sourceCourses = sourceDeptsMap.get(targetDept.departmentName);
          if (sourceCourses) {
            for (const courseData of sourceCourses) {
              const newCourseRef = doc(
                collection(
                  db,
                  "academic_years",
                  targetYearId,
                  "semesters",
                  targetSemId,
                  "departments",
                  targetDept.id,
                  "courses"
                )
              );
              // copy the courses
              batch.set(newCourseRef, {
                departmentId: targetDept.id,
                departmentName: targetDept.departmentName,
                courseCode: courseData.courseCode,
                courseName: courseData.courseName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }

      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Courses copied successfully.");
      }
      return true;
    } catch (error) {
      console.error("Error copying courses:", error);
      toast.error("Failed to copy courses.");
      return false;
    }
  };

  // function to copy year levels
  const copyYearLevels = async (sourceYearId, targetYearId) => {
    try {
      const sourceSemesterId = await findSourceSemesterId(sourceYearId);
      if (!sourceSemesterId) {
        console.log("No source semester found to copy year levels from.");
        return false;
      }

      // Pre-fetch SOURCE structure: Dept -> Course -> YearLevels
      const sourceStructure = new Map();
      const sourceDeptsSnap = await getDocs(
        collection(
          db,
          "academic_years",
          sourceYearId,
          "semesters",
          sourceSemesterId,
          "departments"
        )
      );

      for (const deptDoc of sourceDeptsSnap.docs) {
        const deptData = deptDoc.data();
        const coursesMap = new Map();
        const coursesSnap = await getDocs(collection(deptDoc.ref, "courses"));

        for (const courseDoc of coursesSnap.docs) {
          const courseData = courseDoc.data();
          const yearLevelsSnap = await getDocs(
            collection(courseDoc.ref, "year_levels")
          );
          const yearLevels = yearLevelsSnap.docs.map((doc) => doc.data());
          if (yearLevels.length > 0) {
            coursesMap.set(courseData.courseName, yearLevels);
          }
        }
        if (coursesMap.size > 0) {
          sourceStructure.set(deptData.departmentName, coursesMap);
        }
      }

      if (sourceStructure.size === 0) {
        return true; // Nothing to copy
      }

      // Pre-fetch TARGET structure: Sem -> Dept -> Course
      const targetStructure = new Map();
      const targetSemsSnap = await getDocs(
        collection(db, "academic_years", targetYearId, "semesters")
      );

      for (const semDoc of targetSemsSnap.docs) {
        const deptsMap = new Map();
        const deptsSnap = await getDocs(collection(semDoc.ref, "departments"));

        for (const deptDoc of deptsSnap.docs) {
          const deptData = deptDoc.data();
          const coursesArray = [];
          const coursesSnap = await getDocs(collection(deptDoc.ref, "courses"));
          coursesSnap.forEach((courseDoc) => {
            coursesArray.push({ id: courseDoc.id, ...courseDoc.data() });
          });
          if (coursesArray.length > 0) {
            deptsMap.set(deptData.departmentName, {
              id: deptDoc.id,
              courses: coursesArray,
            });
          }
        }
        if (deptsMap.size > 0) {
          targetStructure.set(semDoc.id, deptsMap);
        }
      }

      if (targetStructure.size === 0) {
        return false; // No target to copy to
      }

      const batch = writeBatch(db);
      for (const [targetSemId, targetDeptsMap] of targetStructure.entries()) {
        for (const [
          targetDeptName,
          targetDeptData,
        ] of targetDeptsMap.entries()) {
          const sourceCoursesMap = sourceStructure.get(targetDeptName);
          if (sourceCoursesMap) {
            for (const targetCourse of targetDeptData.courses) {
              const sourceYearLevels = sourceCoursesMap.get(
                targetCourse.courseName
              );
              if (sourceYearLevels) {
                for (const yearLevelData of sourceYearLevels) {
                  const newYearLevelRef = doc(
                    collection(
                      db,
                      "academic_years",
                      targetYearId,
                      "semesters",
                      targetSemId,
                      "departments",
                      targetDeptData.id,
                      "courses",
                      targetCourse.id,
                      "year_levels"
                    )
                  );
                  batch.set(newYearLevelRef, {
                    courseId: targetCourse.id,
                    departmentId: targetDeptData.id,
                    yearLevelName: yearLevelData.yearLevelName,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                }
              }
            }
          }
        }
      }

      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Year Levels copied successfully.");
      }
      return true;
    } catch (error) {
      console.error("Error copying year levels:", error);
      toast.error("Failed to copy year levels.");
      return false;
    }
  };

  const copySubjects = async (sourceYearId, targetYearId) => {
    try {
      // Find the single source semester to copy FROM
      const sourceSemestersRef = collection(
        db,
        "academic_years",
        sourceYearId,
        "semesters"
      );
      let sourceSemesterId;

      const activeSemQuery = query(
        sourceSemestersRef,
        where("status", "==", "Active"),
        limit(1)
      );
      const activeSemSnapshot = await getDocs(activeSemQuery);

      if (!activeSemSnapshot.empty) {
        sourceSemesterId = activeSemSnapshot.docs[0].id;
      } else {
        const anySemQuery = query(
          sourceSemestersRef,
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const anySemSnapshot = await getDocs(anySemQuery);
        if (anySemSnapshot.empty) {
          console.log("No source semesters found to copy subjects from.");
          return false;
        }
        sourceSemesterId = anySemSnapshot.docs[0].id;
      }

      // Pre-fetch ALL relevant data from the TARGET year and build a lookup map.
      const targetStructure = {};
      const targetSemestersSnap = await getDocs(
        collection(db, "academic_years", targetYearId, "semesters")
      );

      if (targetSemestersSnap.empty) {
        return false;
      }

      for (const semDoc of targetSemestersSnap.docs) {
        const semId = semDoc.id;
        targetStructure[semId] = { departments: {} };

        const deptsSnap = await getDocs(
          collection(
            db,
            "academic_years",
            targetYearId,
            "semesters",
            semId,
            "departments"
          )
        );
        for (const deptDoc of deptsSnap.docs) {
          const deptData = deptDoc.data();
          targetStructure[semId].departments[deptData.departmentName] = {
            id: deptDoc.id,
            courses: {},
          };

          const coursesSnap = await getDocs(
            collection(
              db,
              "academic_years",
              targetYearId,
              "semesters",
              semId,
              "departments",
              deptDoc.id,
              "courses"
            )
          );
          for (const courseDoc of coursesSnap.docs) {
            const courseData = courseDoc.data();
            targetStructure[semId].departments[deptData.departmentName].courses[
              courseData.courseName
            ] = { id: courseDoc.id, yearLevels: {} };

            const yearLevelsSnap = await getDocs(
              collection(
                db,
                "academic_years",
                targetYearId,
                "semesters",
                semId,
                "departments",
                deptDoc.id,
                "courses",
                courseDoc.id,
                "year_levels"
              )
            );
            for (const yearLevelDoc of yearLevelsSnap.docs) {
              const yearLevelData = yearLevelDoc.data();
              targetStructure[semId].departments[
                deptData.departmentName
              ].courses[courseData.courseName].yearLevels[
                yearLevelData.yearLevelName
              ] = { id: yearLevelDoc.id };
            }
          }
        }
      }

      // Pre-fetch ALL subjects and their parent info from the SOURCE semester.
      const sourceSubjectsWithPaths = [];
      const sourceDeptsSnap = await getDocs(
        collection(
          db,
          "academic_years",
          sourceYearId,
          "semesters",
          sourceSemesterId,
          "departments"
        )
      );

      for (const deptDoc of sourceDeptsSnap.docs) {
        const deptData = deptDoc.data();
        const coursesSnap = await getDocs(
          collection(
            db,
            "academic_years",
            sourceYearId,
            "semesters",
            sourceSemesterId,
            "departments",
            deptDoc.id,
            "courses"
          )
        );
        for (const courseDoc of coursesSnap.docs) {
          const courseData = courseDoc.data();
          const yearLevelsSnap = await getDocs(
            collection(
              db,
              "academic_years",
              sourceYearId,
              "semesters",
              sourceSemesterId,
              "departments",
              deptDoc.id,
              "courses",
              courseDoc.id,
              "year_levels"
            )
          );
          for (const yearLevelDoc of yearLevelsSnap.docs) {
            const yearLevelData = yearLevelDoc.data();
            const subjectsSnap = await getDocs(
              collection(
                db,
                "academic_years",
                sourceYearId,
                "semesters",
                sourceSemesterId,
                "departments",
                deptDoc.id,
                "courses",
                courseDoc.id,
                "year_levels",
                yearLevelDoc.id,
                "subjects"
              )
            );
            subjectsSnap.forEach((subjectDoc) => {
              sourceSubjectsWithPaths.push({
                departmentName: deptData.departmentName,
                courseName: courseData.courseName,
                yearLevelName: yearLevelData.yearLevelName,
                data: subjectDoc.data(),
              });
            });
          }
        }
      }

      if (sourceSubjectsWithPaths.length === 0) {
        return true;
      }

      // Iterate through pre-fetched data and prepare batch write.
      const batch = writeBatch(db);
      for (const sourceSubject of sourceSubjectsWithPaths) {
        for (const targetSemId in targetStructure) {
          const targetDept =
            targetStructure[targetSemId].departments[
              sourceSubject.departmentName
            ];
          if (!targetDept) continue;

          const targetCourse = targetDept.courses[sourceSubject.courseName];
          if (!targetCourse) continue;

          const targetYearLevel =
            targetCourse.yearLevels[sourceSubject.yearLevelName];
          if (!targetYearLevel) continue;

          // If a matching path exists, add the new subject to the batch.
          const newSubjectRef = doc(
            collection(
              db,
              "academic_years",
              targetYearId,
              "semesters",
              targetSemId,
              "departments",
              targetDept.id,
              "courses",
              targetCourse.id,
              "year_levels",
              targetYearLevel.id,
              "subjects"
            )
          );

          const subjectData = sourceSubject.data;
          batch.set(newSubjectRef, {
            academicYearId: targetYearId,
            semesterId: targetSemId,
            departmentId: targetDept.id,
            departmentName: sourceSubject.departmentName,
            courseId: targetCourse.id,
            courseName: sourceSubject.courseName,
            yearLevelId: targetYearLevel.id,
            yearLevelName: sourceSubject.yearLevelName,
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
        }
      }

      // Commit the batch.
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
      const sourceSemesterId = await findSourceSemesterId(sourceYearId);
      if (!sourceSemesterId) {
        console.log("No source semester found to copy sections from.");
        return false;
      }

      // Pre-fetch SOURCE structure: Dept -> Course -> YearLevel -> Sections
      const sourceStructure = new Map();
      const sourceDeptsSnap = await getDocs(
        collection(
          db,
          "academic_years",
          sourceYearId,
          "semesters",
          sourceSemesterId,
          "departments"
        )
      );

      for (const deptDoc of sourceDeptsSnap.docs) {
        const coursesMap = new Map();
        const coursesSnap = await getDocs(collection(deptDoc.ref, "courses"));
        for (const courseDoc of coursesSnap.docs) {
          const yearLevelsMap = new Map();
          const yearLevelsSnap = await getDocs(
            collection(courseDoc.ref, "year_levels")
          );
          for (const yearLevelDoc of yearLevelsSnap.docs) {
            const sectionsSnap = await getDocs(
              collection(yearLevelDoc.ref, "sections")
            );
            const sections = sectionsSnap.docs.map((doc) => doc.data());
            if (sections.length > 0) {
              yearLevelsMap.set(yearLevelDoc.data().yearLevelName, sections);
            }
          }
          if (yearLevelsMap.size > 0) {
            coursesMap.set(courseDoc.data().courseName, yearLevelsMap);
          }
        }
        if (coursesMap.size > 0) {
          sourceStructure.set(deptDoc.data().departmentName, coursesMap);
        }
      }

      if (sourceStructure.size === 0) {
        return true; // Nothing to copy
      }

      // Pre-fetch TARGET structure: Sem -> Dept -> Course -> YearLevel
      const targetStructure = new Map();
      const targetSemsSnap = await getDocs(
        collection(db, "academic_years", targetYearId, "semesters")
      );

      for (const semDoc of targetSemsSnap.docs) {
        const deptsMap = new Map();
        const deptsSnap = await getDocs(collection(semDoc.ref, "departments"));
        for (const deptDoc of deptsSnap.docs) {
          const coursesMap = new Map();
          const coursesSnap = await getDocs(collection(deptDoc.ref, "courses"));
          for (const courseDoc of coursesSnap.docs) {
            const yearLevelsArray = [];
            const yearLevelsSnap = await getDocs(
              collection(courseDoc.ref, "year_levels")
            );
            yearLevelsSnap.forEach((ylDoc) =>
              yearLevelsArray.push({ id: ylDoc.id, ...ylDoc.data() })
            );
            if (yearLevelsArray.length > 0) {
              coursesMap.set(courseDoc.data().courseName, {
                id: courseDoc.id,
                yearLevels: yearLevelsArray,
              });
            }
          }
          if (coursesMap.size > 0) {
            deptsMap.set(deptDoc.data().departmentName, {
              id: deptDoc.id,
              courses: coursesMap,
            });
          }
        }
        if (deptsMap.size > 0) {
          targetStructure.set(semDoc.id, deptsMap);
        }
      }

      if (targetStructure.size === 0) {
        return false; // No target to copy to
      }

      const batch = writeBatch(db);
      for (const [targetSemId, targetDeptsMap] of targetStructure.entries()) {
        for (const [
          targetDeptName,
          targetDeptData,
        ] of targetDeptsMap.entries()) {
          const sourceCoursesMap = sourceStructure.get(targetDeptName);
          if (!sourceCoursesMap) continue;

          for (const [
            targetCourseName,
            targetCourseData,
          ] of targetDeptData.courses.entries()) {
            const sourceYearLevelsMap = sourceCoursesMap.get(targetCourseName);
            if (!sourceYearLevelsMap) continue;

            for (const targetYearLevel of targetCourseData.yearLevels) {
              const sourceSections = sourceYearLevelsMap.get(
                targetYearLevel.yearLevelName
              );
              if (sourceSections) {
                for (const sectionData of sourceSections) {
                  const newSectionRef = doc(
                    collection(
                      db,
                      "academic_years",
                      targetYearId,
                      "semesters",
                      targetSemId,
                      "departments",
                      targetDeptData.id,
                      "courses",
                      targetCourseData.id,
                      "year_levels",
                      targetYearLevel.id,
                      "sections"
                    )
                  );
                  batch.set(newSectionRef, {
                    sectionName: sectionData.sectionName,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                }
              }
            }
          }
        }
      }

      if (batch._mutations.length > 0) {
        await batch.commit();
        toast.success("Sections copied successfully.");
      }
      return true;
    } catch (error) {
      console.error("Error copying sections:", error);
      toast.error("Failed to copy sections.");
      return false;
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
        "Cannot delete this school year. Please remove all semesters first."
      );
      return;
    }

    const acadYearRef = doc(db, "academic_years", acadYearToDelete.id);
    try {
      await deleteDoc(acadYearRef);
      toast.success("School year deleted successfully.");
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
