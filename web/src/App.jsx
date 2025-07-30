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
import AdminDashboard from "@/components/AdminComponents/AdminDashboard";
import StudentDashboard from "@/components/StudentComponents/StudentDashboard";
import Accounts from "@/components/AdminComponents/Accounts";
import Schedules from "@/components/AdminComponents/Schedules";
import AcademicYear from "@/components/AdminComponents/AcademicYear";
import Semester from "@/components/AdminComponents/Semester";
import AcademicHeads from "@/components/AdminComponents/AcademicHeads";
import ProgramHeads from "@/components/AdminComponents/ProgramHeads";
import Teachers from "@/components/AdminComponents/Teachers";
import Students from "@/components/AdminComponents/Students";
import DepartmentAndCourse from "@/components/AdminComponents/DepartmentAndCourse";
import Archives from "@/components/AdminComponents/Archives";
import YearLevelAndSection from "@/components/AdminComponents/YearLevelAndSection";
import Attendance from "@/components/StudentComponents/Attendance";
import AcademicHeadViewProfile from "@/components/AdminComponents/AcademicHeadViewProfile";
import ProgramHeadViewProfile from "@/components/AdminComponents/ProgramHeadViewProfile";
import TeacherViewProfile from "@/components/AdminComponents/TeacherViewProfile";
import StudentViewProfile from "@/components/AdminComponents/StudentViewProfile";
import { AcademicHeadProfileProvider } from "@/context/AcademicHeadProfileContext";
import { ProgramHeadProfileProvider } from "@/context/ProgramHeadProfileContext";
import { StudentProfileProvider } from "@/context/StudentProfileContext";
import { TeacherProfileProvider } from "@/context/TeacherProfileContext";

const routeTitles = {
  "/login": "AGILA | Login",
  "/": "AGILA | Welcome",
  "/admin": "AGILA | Admin - Dashboard",
  "/admin/academic-year": "AGILA | Admin - Academic Year",
  "/admin/semester": "AGILA | Admin - Semester",
  "/admin/departmentAndCourse": "AGILA | Admin - Department and Course",
  "/admin/yearLevelAndSection": "AGILA | Admin - Year Level and Section",
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
        <Route path="academic-year" element={<AcademicYear />} />
        <Route path="semester" element={<Semester />} />
        <Route path="departmentAndCourse" element={<DepartmentAndCourse />} />
        <Route path="yearLevelAndSection" element={<YearLevelAndSection />} />
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
          <AcademicHeadProfileProvider>
            <ProgramHeadProfileProvider>
              <TeacherProfileProvider>
                <StudentProfileProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </StudentProfileProvider>
              </TeacherProfileProvider>
            </ProgramHeadProfileProvider>
          </AcademicHeadProfileProvider>
        </AuthProvider>
      </ErrorMessage>
    </>
  );
}

export default App;
