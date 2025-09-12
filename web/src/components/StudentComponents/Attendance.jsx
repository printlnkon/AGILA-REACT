import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, BookOpen } from 'lucide-react';

// Dummy data for attendance statistics
const attendanceStats = [
  { title: 'Present', count: 18, icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  { title: 'Lates', count: 2, icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  { title: 'Absents', count: 1, icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50' },
];

// Dummy data for subject attendance
const subjectAttendance = [
  { id: 1, name: 'Mathematics', teacher: 'Mr. John Smith', time: '8:00 AM - 9:00 AM', status: 'Present' },
  { id: 2, name: 'Science', teacher: 'Ms. Jane Doe', time: '9:00 AM - 10:00 AM', status: 'Present' },
  { id: 3, name: 'English', teacher: 'Mr. Robert Brown', time: '10:30 AM - 11:30 AM', status: 'Late' },
  { id: 4, name: 'History', teacher: 'Ms. Emily White', time: '11:30 AM - 12:30 PM', status: 'Absent' },
  { id: 5, name: 'Physical Education', teacher: 'Mr. Chris Green', time: '1:30 PM - 2:30 PM', status: 'Present' },
];

const getStatusClasses = (status) => {
    switch (status) {
        case 'Present':
            return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
        case 'Late':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400';
        case 'Absent':
            return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

export default function Attendance() {
  const [activeTab, setActiveTab] = React.useState('Weekly');

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      {/* Header section with title and report tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Here's your attendance summary.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
          {['Daily', 'Weekly', 'Monthly'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              {tab} Report
            </button>
          ))}
        </div>
      </div>

      {/* Grid of attendance statistics cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {attendanceStats.map((stat) => (
          <div key={stat.title} className="p-6 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 transition-transform hover:scale-105 duration-300">
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List of today's subjects and their attendance status */}
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
         <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold">Today's Subjects</h2>
         </div>
         <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {subjectAttendance.map((subject) => (
               <div key={subject.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">{subject.teacher} • {subject.time}</p>
                    </div>
                 </div>
                 <div className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusClasses(subject.status)}`}>
                    {subject.status}
                 </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}