import React from "react";
import { CalendarDays, MapPin, Clock, Eye, X } from "lucide-react";

const items = [
  { id: 1, title: "IT 201 – Data Structures", section: "BT2102", room: "Room 302", day: "Sat", time: "07:00–07:56", state: "Live" },
  { id: 2, title: "ALG 101 – Discrete Math", section: "BT1101", room: "Room 205", day: "Sat", time: "07:00–07:00", state: "Done" },
  { id: 3, title: "HCI 101 – UI/UX", section: "CS1103", room: "Lab 2", day: "Sat", time: "08:56–10:26", state: "Upcoming" },
  { id: 4, title: "CAP 401 – Capstone", section: "BT4101", room: "Room 802", day: "Sat", time: "10:00–12:00", state: "Upcoming" },
];

const chip = (state) =>
  state === "Live"
    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
    : state === "Done"
    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";

export default function Schedule() {
  const [selected, setSelected] = React.useState(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <button className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-800">
          Today
        </button>
      </div>

      <div className="space-y-4">
        {items.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{c.title}</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${chip(c.state)}`}>
                {c.state}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> {c.section}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {c.room}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> {c.time}
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={() => setSelected(c)}
                className="px-4 py-2 rounded-lg border dark:border-gray-800 flex items-center gap-2"
              >
                <Eye size={16} />
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Centered modal  */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5">
              <div>
                <h3 className="text-base font-semibold leading-tight">
                  {selected.title}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Content */}
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Section</span>
                <span className="font-medium">{selected.section}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">{selected.room}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Day</span>
                <span className="font-medium">{selected.day}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{selected.time}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Footer */}
            <div className="p-4">
              <button
                onClick={() => setSelected(null)}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-gray-800 hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
