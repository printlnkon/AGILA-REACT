import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ErrorMessage from "@/utils/ErrorMessage";
import PageNotFound from "@/utils/PageNotFound";
import HomePage from "@/pages/Homepage/HomePage";
import LoginPage from "@/pages/Login/LoginPage";
import Admin from "@/pages/Admin/Admin";
import Student from "@/pages/Student/Student";
import Teacher from "@/pages/Teacher";
import ProgramHead from "@/pages/ProgramHead";
import AcademicHead from "@/pages/AcademicHead";
import StudentDashboard from "@/components/StudentComponents/StudentDashboard";
import Attendance from "@/components/StudentComponents/Attendance";
import AdminDashboard from "@/components/AdminComponents/AdminDashboard";
import Classes from "@/components/AdminComponents/Classes";
import Accounts from "@/components/AdminComponents/Accounts";
import ViewClassList from "@/components/AdminComponents/ViewClassList";
import Schedules from "@/components/AdminComponents/Schedules";
import AcademicHeads from "@/components/AdminComponents/AcademicHeads";
import ProgramHeads from "@/components/AdminComponents/ProgramHeads";
import Teachers from "@/components/AdminComponents/Teachers";
import Students from "@/components/AdminComponents/Students";
import AcademicYearAndSemester from "@/components/AdminComponents/AcademicYearAndSemester";
import DepartmentAndCourse from "@/components/AdminComponents/DepartmentAndCourse";
import YearLevelAndSection from "@/components/AdminComponents/YearLevelAndSection";
import Subject from "@/components/AdminComponents/Subject";
import Archives from "@/components/AdminComponents/Archives";
import AcademicHeadViewProfile from "@/components/AdminComponents/AcademicHeadViewProfile";
import ProgramHeadViewProfile from "@/components/AdminComponents/ProgramHeadViewProfile";
import TeacherViewProfile from "@/components/AdminComponents/TeacherViewProfile";
import StudentViewProfile from "@/components/AdminComponents/StudentViewProfile";
import { ClassListProvider } from "@/context/ClassListContext";
import { ActiveSessionProvider } from "@/context/ActiveSessionContext";
import { AcademicHeadProfileProvider } from "@/context/AcademicHeadProfileContext";
import { ProgramHeadProfileProvider } from "@/context/ProgramHeadProfileContext";
import { StudentProfileProvider } from "@/context/StudentProfileContext";
import { TeacherProfileProvider } from "@/context/TeacherProfileContext";

const routeTitles = {
  "/login": "AGILA | Login",
  "/": "AGILA | Welcome",
  "/admin": "AGILA | Admin - Dashboard",
  "/admin/classes": "AGILA | Admin - Classes",
  "/admin/classes/view": "AGILA | Admin - View Class List",
  "/admin/academicYearAndSemester": "AGILA | Admin - School Year and Semester",
  "/admin/departmentAndCourse": "AGILA | Admin - Department and Course",
  "/admin/yearLevelAndSection": "AGILA | Admin - Year Level and Section",
  "/admin/subject": "AGILA | Admin - Subjects",
  "/admin/accounts": "AGILA | Admin - Accounts",
  "/admin/academic-heads": "AGILA | Admin - Academic Heads",
  "/admin/program-heads": "AGILA | Admin - Program Heads",
  "/admin/teachers": "AGILA | Admin - Teachers",
  "/admin/students": "AGILA | Admin - Students",
  "/admin/program-heads/profile": "AGILA | Admin - Program Head Profile",
  "/admin/teachers/profile": "AGILA | Admin - Teacher Profile",
  "/admin/students/profile": "AGILA | Admin - Student Profile",
  "/admin/archives": "AGILA | Admin - Archives",
};

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const title = routeTitles[path] || "AGILA"; // default title
    document.title = title || "AGILA"; // default title
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/homepage" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="classes" element={<Classes />}></Route>
        <Route path="classes/view" element={<ViewClassList />} />
        <Route
          path="academicYearAndSemester"
          element={<AcademicYearAndSemester />}
        />
        <Route path="departmentAndCourse" element={<DepartmentAndCourse />} />
        <Route path="yearLevelAndSection" element={<YearLevelAndSection />} />
        <Route path="subject" element={<Subject />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="academic-heads" element={<AcademicHeads />} />
        <Route path="program-heads" element={<ProgramHeads />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="students" element={<Students />} />
        <Route
          path="academic-heads/profile"
          element={<AcademicHeadViewProfile />}
        />
        <Route
          path="program-heads/profile"
          element={<ProgramHeadViewProfile />}
        />
        <Route path="teachers/profile" element={<TeacherViewProfile />} />
        <Route path="students/profile" element={<StudentViewProfile />} />
        <Route path="archives" element={<Archives />} />
        <Route path="schedules" element={<Schedules />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <Student />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="attendance" element={<Attendance />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <Teacher />
          </ProtectedRoute>
        }
      ></Route>

      <Route
        path="/program_head"
        element={
          <ProtectedRoute roles={["program_head"]}>
            <ProgramHead />
          </ProtectedRoute>
        }
      ></Route>

      <Route
        path="/academic_head"
        element={
          <ProtectedRoute roles={["academic_head"]}>
            <AcademicHead />
          </ProtectedRoute>
        }
      ></Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <Toaster richColors />
      <ErrorMessage>
        <AuthProvider>
          <ActiveSessionProvider>
            <AcademicHeadProfileProvider>
              <ProgramHeadProfileProvider>
                <TeacherProfileProvider>
                  <StudentProfileProvider>
                    <ClassListProvider>
                      <Router>
                        <AppContent />
                      </Router>
                    </ClassListProvider>
                  </StudentProfileProvider>
                </TeacherProfileProvider>
              </ProgramHeadProfileProvider>
            </AcademicHeadProfileProvider>
          </ActiveSessionProvider>
        </AuthProvider>
      </ErrorMessage>
    </>
  );
}

export default App;
