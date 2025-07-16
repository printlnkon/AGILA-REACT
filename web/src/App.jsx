import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import Archives from "@/components/AdminComponents/Archives";
import Departments from "@/components/AdminComponents/Departments";
import Schedules from "@/components/AdminComponents/Schedules";
import AuthProvider from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import Attendance from "@/components/StudentComponents/Attendance";
import CourseSection from "@/components/AdminComponents/CourseSection";
import AcademicYear from "@/components/AdminComponents/AcademicYear";
import Semester from "@/components/AdminComponents/Semester";
import AcademicHeads from "@/components/AdminComponents/AcademicHeads";
import ProgramHeads from "@/components/AdminComponents/ProgramHeads";
import Teachers from "@/components/AdminComponents/Teachers";
import Students from "@/components/AdminComponents/Students";
import YearLevels from "@/components/AdminComponents/YearLevels";
import Sections from "@/components/AdminComponents/Sections";

const routeTitles = {
  "/login": "AGILA | Login",
  "/": "AGILA | Welcome",
  // admin titles
  "/admin": "AGILA | Admin - Dashboard",
  "/admin/academic-year": "AGILA | Admin - Academic Year",
  "/admin/semester": "AGILA | Admin - Semester",
  "/admin/accounts": "AGILA | Admin - Accounts",
  "/admin/year-level": "AGILA | Admin - Year Level",
  "/admin/section": "AGILA | Admin - Section",
  "/admin/course-section": "AGILA | Admin - Course and Section",
  "/admin/academic-heads": "AGILA | Admin - Academic Head",
  "/admin/program-heads": "AGILA | Admin - Program Head",
  "/admin/teachers": "AGILA | Admin - Teachers",
  "/admin/students": "AGILA | Admin - Students",
  "/admin/archives": "AGILA | Admin - Archives",
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
        <Route path="academic-heads" element={<AcademicHeads />} />
        <Route path="program-heads" element={<ProgramHeads />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="students" element={<Students />} />
        <Route path="archives" element={<Archives />} />
        <Route path="course-section" element={<CourseSection />} />
        <Route path="year-level" element={<YearLevels />} />
        <Route path="section" element={<Sections />} />
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
