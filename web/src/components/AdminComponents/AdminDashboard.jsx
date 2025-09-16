import { useState, useEffect } from "react";
import { db } from "@/api/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useActiveSession } from "@/context/ActiveSessionContext";

// UI Components from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Charting Components (using Recharts)
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Icons from lucide-react
import {
  Users,
  GraduationCap,
  School,
  BookOpenCheck,
  Building,
  CalendarCheck2,
  CalendarDays,
  ArrowRight,
  AlertTriangle,
  BookUp,
  LayoutGrid,
  Info,
} from "lucide-react";

// --- DUMMY DATA FOR ATTENDANCE CHART ---
const attendanceData = [
  { day: "Mon", attendance: 92 },
  { day: "Tue", attendance: 95 },
  { day: "Wed", attendance: 91 },
  { day: "Thu", attendance: 88 },
  { day: "Fri", attendance: 96 },
  { day: "Sat", attendance: 98 },
];

// --- Main Dashboard Component ---
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const { activeSession, isNoActiveSession } = useActiveSession();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    classes: 0,
    totalUsers: 0
  });
  const [date, setDate] = useState(new Date());
  const [attendanceRange, setAttendanceRange] = useState("7");

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => doc.data());

        const students = users.filter(user => user.role === "student").length;
        const teachers = users.filter(user => user.role === "teacher").length;
        const programHeads = users.filter(user => user.role === "program-head").length;
        const academicHeads = users.filter(user => user.role === "academic-head").length;

        let courses = 0;
        let classes = 0;

        if (activeSession?.id) {
          const coursesQuery = query(collection(db, "courses"), where("academicYearId", "==", activeSession.id));
          const coursesSnapshot = await getDocs(coursesQuery);
          courses = coursesSnapshot.size;

          const classesQuery = query(collection(db, "classes"), where("academicYearId", "==", activeSession.id));
          const classesSnapshot = await getDocs(classesQuery);
          classes = classesSnapshot.size;
        }

        setStats({
          students,
          teachers,
          courses,
          classes,
          totalUsers: students + teachers + programHeads + academicHeads,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [activeSession]);

  return (
    <div className="flex flex-col flex-1 gap-6 p-4 sm:p-6 md:p-8 bg-muted/20">
      {/* --- HEADER --- */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
        <p className="text-muted-foreground">Here's a snapshot of your institution's activity.</p>
      </header>

      <main className="flex flex-col gap-6">
        {/* --- ACTIVE SESSION WARNING --- */}
        <ActiveSessionCard activeSession={activeSession} isNoActiveSession={isNoActiveSession} />

        {/* --- KEY METRIC CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <StatCard title="Present Today" value={stats.students} icon={<Users />} loading={loading} />
          <StatCard title="Late Today" value={stats.students} icon={<Users />} loading={loading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Academic Head" value={stats.students} icon={<Users />} loading={loading} />
          <StatCard title="Total Program Head" value={stats.students} icon={<Users />} loading={loading} />
          <StatCard title="Total Students" value={stats.students} icon={<GraduationCap />} loading={loading} />
          <StatCard title="Total Teachers" value={stats.teachers} icon={<Users />} loading={loading} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <StatCard title="Active Classes" value={stats.classes} icon={<School />} loading={loading} />
          <StatCard title="Offered Courses" value={stats.courses} icon={<BookOpenCheck />} loading={loading} />
        </div>

        {/* --- MAIN CONTENT GRID (ATTENDANCE + SIDEBAR) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* --- ATTENDANCE CHART (LEFT/MAIN) --- */}
          <div className="lg:col-span-2">
            <AttendanceChart
              data={attendanceData}
              loading={loading}
              range={attendanceRange}
              onRangeChange={setAttendanceRange}
            />
          </div>

          {/* --- RIGHT SIDEBAR (CALENDAR, ACTIONS, STATUS) --- */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <QuickActionsCard />
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Sub-Components for a Cleaner Structure ---

function ActiveSessionCard({ activeSession, isNoActiveSession }) {
  if (isNoActiveSession) {
    return (
      <Card className="border-l-4 border-destructive bg-destructive/5 shadow-none">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <CardTitle>No Active School Year Set</CardTitle>
            <CardDescription className="text-destructive/90">Please set an active session to view academic data.</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto">
            <Link to="/admin/academic-year">Set Session</Link>
          </Button>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card className="border-l-4 border-primary bg-primary/5 shadow-none">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Info className="h-8 w-8 text-primary" />
        <div>
          <CardTitle className="font-semibold text-lg">Active Session</CardTitle>
          <CardDescription>
            <span className="text-primary">
              S.Y. {activeSession?.name || 'N/A'} | {activeSession?.semesterName || 'N/A'}
            </span>
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function StatCard({ title, value, icon, loading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">Updated just now</p>
      </CardContent>
    </Card>
  );
}

function AttendanceChart({ data, loading, range, onRangeChange }) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Student Attendance Rate</CardDescription>
        </div>
        <Select value={range} onValueChange={onRangeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const actions = [
    { label: "Manage Schedules", href: "/admin/schedule", icon: <CalendarDays /> },
    { label: "Manage Classes", href: "/admin/classes", icon: <LayoutGrid /> },
    { label: "Manage Departments", href: "/admin/department-course", icon: <Building /> },
    { label: "Manage Subjects", href: "/admin/subject", icon: <BookUp /> },
    { label: "Manage Users", href: "/admin/accounts", icon: <Users /> }
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump directly to key management areas.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {actions.map(action => (
          <Button asChild key={action.href} variant="ghost" className="justify-start gap-3 px-3">
            <Link to={action.href}>
              <div className="text-muted-foreground">{action.icon}</div>
              {action.label}
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}