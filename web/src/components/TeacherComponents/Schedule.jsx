import React from "react";
import { CalendarDays, MapPin, Clock, Eye, X } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/api/firebase";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { useAuth } from "@/context/AuthContext";

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatToday = (d = new Date()) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const chip = (state) =>
  state === "Live"
    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
    : state === "Done"
    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";

const parseTimeToMinutes = (t) => {
  if (!t) return null;
  if (typeof t?.toDate === "function") {
    const d = t.toDate();
    return d.getHours() * 60 + d.getMinutes();
  }
  if (typeof t === "string") {
    const s = t.trim().toUpperCase();
    const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (m) {
      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const mer = (m[3] || "").toUpperCase();
      if (mer === "AM") { if (hh === 12) hh = 0; }
      else if (mer === "PM") { if (hh !== 12) hh += 12; }
      return hh * 60 + mm;
    }
    const m24 = s.match(/^(\d{2}):(\d{2})$/);
    if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  }
  return null;
};

const toDisplayTime = (t) => {
  if (!t) return "";
  if (typeof t?.toDate === "function") {
    const d = t.toDate();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return String(t).replace("-", "–");
};

const toShortDay = (val) => {
  if (val == null) return "";
  if (typeof val === "number") return weekdayShort[val] || "";
  const s = String(val).toLowerCase();
  const found = weekdayShort.find((w) => w.toLowerCase().startsWith(s.slice(0, 3)));
  return found || s.slice(0, 3);
};

const computeState = (dayShort, start, end) => {
  if (!dayShort || !start || !end) return "Upcoming";
  const now = new Date();
  const todayShort = weekdayShort[now.getDay()];
  const startM = parseTimeToMinutes(start);
  const endM = parseTimeToMinutes(end);
  if (startM == null || endM == null) return "Upcoming";

  if (dayShort === todayShort) {
    const nowM = now.getHours() * 60 + now.getMinutes();
    if (nowM >= startM && nowM <= endM) return "Live";
    if (nowM < startM) return "Upcoming";
    return "Done";
  }
  const idx = (x) => weekdayShort.findIndex((w) => w === x);
  const di = idx(dayShort);
  const ti = now.getDay();
  if (di === -1) return "Upcoming";
  return di > ti ? "Upcoming" : "Done";
};

const toRow = (id, v, sectionNameGuess = "—") => {
  const code = v.subjectCode ?? v.code ?? v.courseCode ?? "";
  const name = v.subjectName ?? v.courseName ?? v.name ?? "";
  const title = [code, name].filter(Boolean).join(" – ") || "Untitled";

  const section =
    v.sectionName ?? v.section ?? v.section_code ?? sectionNameGuess ?? "—";
  const room = v.roomName ?? v.room ?? v.location ?? "—";

  const dayVal =
    v.day ??
    v.weekday ??
    v.dayShort ??
    (Array.isArray(v.days) && v.days.length ? v.days[0] : "");
  const day = toShortDay(dayVal);

  const start = v.startTime ?? v.timeStart ?? v.start ?? v.start_time ?? v.starttime;
  const end   = v.endTime   ?? v.timeEnd   ?? v.end   ?? v.end_time   ?? v.endtime;

  const time = [toDisplayTime(start), toDisplayTime(end)].filter(Boolean).join(" – ") || v.time || "—";

  return { id, title, section, room, day, time, _start: start, _end: end };
};

export default function Schedule() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const { currentUser } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState(null);
  const todayText = formatToday();

  React.useEffect(() => {
    if (sessionLoading) return;


    const userUid = currentUser?.uid || currentUser?.id;
    if (!userUid) {
      setRows([]);
      setLoading(false);
      return;
    }

    const yearId =
      activeSession?.id ||
      activeSession?.yearId ||
      activeSession?.academicYearId;

    const semId =
      activeSession?.semesterId ||
      activeSession?.semId ||
      activeSession?.activeSemesterId;

    if (!yearId || !semId) {
      setRows([]);
      setLoading(false);
      return;
    }

    const unsubs = [];
    const stash = new Map();
    const commit = () => setRows(Array.from(stash.values()));

    // departments
    const depsRef = collection(db, "academic_years", yearId, "semesters", semId, "departments");
    const uDeps = onSnapshot(depsRef, (depsSnap) => {
      depsSnap.forEach((depDoc) => {
        const coursesRef = collection(depDoc.ref, "courses");
        const uCourses = onSnapshot(coursesRef, (coursesSnap) => {
          coursesSnap.forEach((courseDoc) => {
            const yearLvlsRef = collection(courseDoc.ref, "year_levels");
            const uYls = onSnapshot(yearLvlsRef, (ylSnap) => {
              ylSnap.forEach((ylDoc) => {
                const sectionsRef = collection(ylDoc.ref, "sections");
                const uSecs = onSnapshot(sectionsRef, (secSnap) => {
                  secSnap.forEach((secDoc) => {
                    const sectionName =
                      secDoc.data()?.name ||
                      secDoc.data()?.sectionName ||
                      secDoc.data()?.code ||
                      secDoc.id;

                    // schedules under this section — filter to this instructor
                    const schedulesRef = collection(secDoc.ref, "schedules");
                    const qRef = query(schedulesRef, where("instructorId", "==", userUid));

                    const uSched = onSnapshot(
                      qRef,
                      (schedSnap) => {
                        for (const k of Array.from(stash.keys())) {
                          if (k.startsWith(`${secDoc.path}/schedules/`)) stash.delete(k);
                        }
                        schedSnap.forEach((sd) => {
                          const row = toRow(sd.id, sd.data(), sectionName);
                          stash.set(`${sd.ref.path}`, row);
                        });
                        commit();
                        setLoading(false);
                      },
                      () => setLoading(false)
                    );
                    unsubs.push(uSched);
                  });
                });
                unsubs.push(uSecs);
              });
            });
            unsubs.push(uYls);
          });
        });
        unsubs.push(uCourses);
      });
    });
    unsubs.push(uDeps);

    return () => unsubs.forEach((fn) => fn && fn());
  }, [activeSession, sessionLoading, currentUser]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-800">
          {todayText}
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <div className="animate-pulse h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 text-sm text-muted-foreground">
            No schedule found for the active semester.
          </div>
        )}

        {rows.map((c) => {
          const state = computeState(c.day, c._start, c._end);
          return (
            <div key={c.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.title}</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${chip(state)}`}>{state}</span>
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
                <button onClick={() => setSelected(c)} className="px-4 py-2 rounded-lg border dark:border-gray-800 flex items-center gap-2">
                  <Eye size={16} />
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-start justify-between p-5">
              <div>
                <h3 className="text-base font-semibold leading-tight">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

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

            <div className="p-4">
              <button onClick={() => setSelected(null)} className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-gray-800 hover:opacity-90">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
