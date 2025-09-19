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
import HomePage from "@/pages/Homepage/Homepage";
import LoginPage from "@/pages/Login/LoginPage";
import Admin from "@/pages/Admin/Admin";
import Student from "@/pages/Student/Student";
import Teacher from "@/pages/Teacher/Teacher";
import ProgramHead from "@/pages/ProgramHead/ProgramHead";
import AcademicHead from "@/pages/AcademicHead";
import StudentDashboard from "@/components/StudentComponents/StudentDashboard";
import StudentAttendance from "@/components/StudentComponents/Attendance";
import StudentRequest from "@/components/StudentComponents/StudentRequest";
import StudentProfile from "@/components/StudentComponents/Profile";
import TeacherDashboard from "@/components/TeacherComponents/TeacherDashboard";
import TeacherSchedule from "@/components/TeacherComponents/Schedule";
import TeacherRequest from "@/components/TeacherComponents/TeacherRequest";
import TeacherProfile from "@/components/TeacherComponents/Profile";
import AcademicHeadDashboard from "@/components/AcademicHeadComponents/AcademicHeadDashboard";
import AcademicHeadAttendance from "@/components/AcademicHeadComponents/Attendance";
import ProgramHeadDashboard from "@/components/ProgramHeadComponents/ProgramHeadDashboard";
import ProgramHeadSchedule from "@/components/ProgramHeadComponents/Schedule";
import ProgramHeadRequest from "@/components/ProgramHeadComponents/ProgramHeadRequest";
import ProgramHeadProfile from "@/components/ProgramHeadComponents/Profile";
import ProgramHeadSubjectApproval from "@/components/ProgramHeadComponents/ProgramHeadSubjectApproval";
import AdminDashboard from "@/components/AdminComponents/AdminDashboard";
import Classes from "@/components/AdminComponents/Classes";
import Accounts from "@/components/AdminComponents/Accounts";
import ViewClassList from "@/components/AdminComponents/ViewClassList";
import Staff from "@/components/AdminComponents/Staff";
import AcademicHeads from "@/components/AdminComponents/AcademicHeads";
import ProgramHeads from "@/components/AdminComponents/ProgramHeads";
import Teachers from "@/components/AdminComponents/Teachers";
import Students from "@/components/AdminComponents/Students";
import AcademicYearAndSemester from "@/components/AdminComponents/AcademicYearAndSemester";
import DepartmentAndCourse from "@/components/AdminComponents/DepartmentAndCourse";
import YearLevelAndSection from "@/components/AdminComponents/YearLevelAndSection";
import Subject from "@/components/AdminComponents/Subject";
import Schedule from "@/components/AdminComponents/Schedule";
import Room from "@/components/AdminComponents/Room";
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
  // public title route
  "/": "AGILA | Welcome",
  "/login": "AGILA | Login",
  // admin title route
  "/admin": "AGILA | Admin - Dashboard",
  "/admin/classes": "AGILA | Admin - Classes",
  "/admin/classes/view": "AGILA | Admin - View Class List",
  "/admin/academic-year-semester": "AGILA | Admin - School Year & Semester",
  "/admin/department-course": "AGILA | Admin - Department & Course",
  "/admin/year-level-section": "AGILA | Admin - Year Level & Section",
  "/admin/subject": "AGILA | Admin - Subjects",
  "/admin/schedule": "AGILA | Admin - Schedule",
  "/admin/room": "AGILA | Admin - Room",
  "/admin/accounts": "AGILA | Admin - Accounts",
  "/admin/staff": "AGILA | Admin - Staff",
  "/admin/academic-heads": "AGILA | Admin - Academic Heads",
  "/admin/program-heads": "AGILA | Admin - Program Heads",
  "/admin/teachers": "AGILA | Admin - Teachers",
  "/admin/students": "AGILA | Admin - Students",
  "/admin/program-heads/profile": "AGILA | Admin - Program Head Profile",
  "/admin/teachers/profile": "AGILA | Admin - Teacher Profile",
  "/admin/students/profile": "AGILA | Admin - Student Profile",
  "/admin/archives": "AGILA | Admin - Archives",
  // academic head title route
  "/academic-head": "AGILA | Academic Head - Dashboard",
  "/academic-head/attendance": "AGILA | Academic Head - Attendance",
  // program head title route
  "/program-head": "AGILA | Program Head - Dashboard",
  "/program-head/schedule": "AGILA | Program Head - Schedule",
  "/program-head/request": "AGILA | Program Head - Request",
  // teacher title route
  "/teacher": "AGILA | Teacher - Dashboard",
  "/teacher/attendance": "AGILA | Teacher - Attendance",
  "/teacher/request": "AGILA | Teacher - Request",
  // student title route
  "/student": "AGILA | Student - Dashboard",
  "/student/attendance": "AGILA | Student - Attendance",
};

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const title = routeTitles[path] || "AGILA";
    document.title = title || "AGILA"; // default title
  }, [location]);

  return (
    <Routes>
      {/* public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="/login" element={<LoginPage />} />

      {/* admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="classes" element={<Classes />}></Route>
        <Route path="classes/view" element={<ViewClassList />} />
        <Route path="academic-year-semester" element={<AcademicYearAndSemester />} />
        <Route path="department-course" element={<DepartmentAndCourse />} />
        <Route path="year-level-section" element={<YearLevelAndSection />} />
        <Route path="subject" element={<Subject />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="room" element={<Room />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="staff" element={<Staff />} />
        <Route path="academic-heads" element={<AcademicHeads />} />
        <Route path="program-heads" element={<ProgramHeads />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="students" element={<Students />} />
        <Route path="academic-heads/profile" element={<AcademicHeadViewProfile />} />
        <Route path="program-heads/profile" element={<ProgramHeadViewProfile />} />
        <Route path="teachers/profile" element={<TeacherViewProfile />} />
        <Route path="students/profile" element={<StudentViewProfile />} />
        <Route path="archives" element={<Archives />} />
      </Route>

      {/* academic head routes */}
      <Route path="/academic-head" element={<ProtectedRoute roles={["academic_head"]}><AcademicHead /></ProtectedRoute>}>
        <Route index element={<AcademicHeadDashboard />} />
        <Route path="attendance" element={<AcademicHeadAttendance />} />
      </Route>

      {/* program head routes */}
      <Route path="/program-head" element={<ProtectedRoute roles={["program_head"]}><ProgramHead /></ProtectedRoute>}>
        <Route index element={<ProgramHeadDashboard />} />
        <Route path="schedule" element={<ProgramHeadSchedule />} />
        <Route path="request" element={<ProgramHeadRequest />} />
        <Route path="profile" element={<ProgramHeadProfile />} />
        <Route path="subject-approval" element={<ProgramHeadSubjectApproval />} />
      </Route>

      {/* teacher routes */}
      <Route path="/teacher" element={<ProtectedRoute roles={["teacher"]}><Teacher /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="schedule" element={<TeacherSchedule />} />
        <Route path="request" element={<TeacherRequest />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      {/* student routes */}
      <Route path="/student" element={<ProtectedRoute roles={["student"]}><Student /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="request" element={<StudentRequest />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <>
      <Toaster richColors expand visibleToasts={9} />
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
