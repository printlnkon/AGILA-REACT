import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
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
import Archive from "@/components/AdminComponents/Archive";
import Departments from "@/components/AdminComponents/Departments";
import Schedules from "@/components/AdminComponents/Schedules";
import AuthProvider from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Attendance from "@/components/StudentComponents/Attendance";
import CourseSection from "@/components/AdminComponents/CourseSection";
import AcademicYear from "@/components/AdminComponents/AcademicYear";
import Semester from "@/components/AdminComponents/Semester";

const routeTitles = {
  "/login": "AGILA | Login",
  "/": "AGILA | Welcome",
  "/admin": "AGILA | Admin - Dashboard",
  "/admin/academic-year": "AGILA | Admin - Academic Year",
  "/admin/semester": "AGILA | Admin - Semester",
  "/admin/accounts": "AGILA | Admin - Accounts",
  "/admin/archive": "AGILA | Admin - Archives",
  "/student": "AGILA | Student - Dashboard",
  "/student/attendance": "AGILA | Student - Attendance",
};

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const title = routeTitles[path] || "AGILA"; // default title
    document.title = title;
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
        <Route path="accounts" element={<Accounts />} />
        <Route path="archive" element={<Archive />} />
        <Route path="course-section" element={<CourseSection />} />
        <Route path="departments" element={<Departments />} />
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
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ErrorMessage>
    </>
  );
}

export default App;