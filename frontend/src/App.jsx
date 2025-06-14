import { HashRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import ErrorMessage from "@/components/ErrorMessage";
import PageNotFound from "@/components/PageNotFound";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Dashboard from "@/components/AdminDashboard/DashBoard";
import Accounts from "@/components/AdminDashboard/Accounts";
import Departments from "@/components/AdminDashboard/Departments";
import Schedules from "@/components/AdminDashboard/Schedules";

function App() {
  return (
    <>
      <ErrorMessage>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />}>
              <Route index element={<Dashboard />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="departments" element={<Departments />} />
              <Route path="schedules" element={<Schedules />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
      </ErrorMessage>
    </>
  );
}

export default App;
