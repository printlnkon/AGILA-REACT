import React from "react";
import {
  Eye, CheckCircle2, XCircle, ClipboardList, Search, Loader2, MoreHorizontal, Trash2
} from "lucide-react";
import {
  getFirestore, collectionGroup, query, where, orderBy, onSnapshot,
  updateDoc, serverTimestamp, collection, doc, setDoc
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const Badge = ({ children, className = "" }) => (
  <span className={`text-xs font-bold px-3 py-1 rounded-full ${className}`}>{children}</span>
);

const statusBadge = (status) => {
  switch (status) {
    case "Approved": return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
    case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
    default: return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
  }
};

export default function Request() {
  const { currentUser } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [inboxHiddenIds, setInboxHiddenIds] = React.useState([]);
  const [tab, setTab] = React.useState("All");
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [openMenu, setOpenMenu] = React.useState(null);

  React.useEffect(() => {
    if (!currentUser?.uid) return;
    const db = getFirestore();

    const qInbox = query(
      collectionGroup(db, "Request"),
      where("toProgramHeadId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubInbox = onSnapshot(qInbox, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })));
      setLoading(false);
    });

    const qInboxHist = collection(db, "users", "program_head", "accounts", currentUser.uid, "InboxHistory");
    const unsubHist = onSnapshot(qInboxHist, (snap) => {
      setInboxHiddenIds(snap.docs.map((d) => d.id));
    });

    return () => {
      unsubInbox();
      unsubHist();
    };
  }, [currentUser?.uid]);

  const hiddenSet = React.useMemo(() => new Set(inboxHiddenIds), [inboxHiddenIds]);
  const visible = rows.filter((r) => !hiddenSet.has(r.id));

  const filtered = visible.filter((r) => {
    const byTab = tab === "All" ? true : r.status === tab;
    const hay =
      (r.type || "") +
      (r.fromTeacherName || "") +
      (r.fromStudentName || "") +
      (r.toProgramHeadName || "") +
      (r.reason || "");
    const bySearch = !search?.trim() ? true : hay.toLowerCase().includes(search.toLowerCase());
    return byTab && bySearch;
  });

  const act = async (docRef, nextStatus) => {
    await updateDoc(docRef, { status: nextStatus, updatedAt: serverTimestamp() });
  };

  const removeFromInbox = async (row) => {
    const db = getFirestore();
    const destRef = doc(db, "users", "program_head", "accounts", currentUser.uid, "InboxHistory", row.id);
    await setDoc(destRef, {
      sourcePath: row.ref?.path || null,
      removedAt: serverTimestamp(),
      snapshot: {
        type: row.type || null,
        status: row.status || null,
        fromTeacherName: row.fromTeacherName || null,
        toProgramHeadName: row.toProgramHeadName || null,
        reason: row.reason || null,
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">Review requests addressed to you from teachers.</p>
        </div>
        <div className="ml-auto relative w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {["All", "Pending", "Approved", "Rejected"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-900 border dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 hidden sm:flex justify-between items-center text-sm font-semibold text-muted-foreground border-b dark:border-gray-800">
          <span className="flex-grow">Type / From</span>
          <span className="w-28 sm:w-32 pl-2 text-left">Status</span>
          <span className="w-40 sm:w-52 text-center">Actions</span>
        </div>

        {loading ? (
          <div className="p-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-muted-foreground">No requests found.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex-grow min-w-0">
                  <p className="font-semibold flex items-center gap-2 truncate">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    <span className="truncate">{r.type}</span>
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    From: {r.fromTeacherName || r.fromStudentName || "—"} • To: {r.toProgramHeadName || "—"}
                  </p>
                </div>

                <div className="w-28 sm:w-32 flex-shrink-0 flex justify-start pl-2">
                  <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(r.status)}`}>
                    {r.status}
                  </span>
                </div>

                <div className="w-40 sm:w-52 relative flex justify-center">
                  <button
                    onClick={() => setOpenMenu((id) => (id === r.id ? null : r.id))}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenu === r.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                      <ul className="py-1">
                        <li>
                          <button
                            onClick={() => { setSelected(r); setOpenMenu(null); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Eye size={16} /> View Details
                          </button>
                        </li>

                        {r.status === "Pending" && (
                          <>
                            <li>
                              <button
                                onClick={async () => { await act(r.ref, "Approved"); setOpenMenu(null); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <CheckCircle2 size={16} /> Approve
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={async () => { await act(r.ref, "Rejected"); setOpenMenu(null); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </li>
                          </>
                        )}

                        {r.status !== "Pending" && (
                          <li>
                            <button
                              onClick={async () => { await removeFromInbox(r); setOpenMenu(null); }}
                              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50"
                            >
                              <Trash2 size={16} /> Remove
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl shadow-xl"
          >
            <div className="p-4 text-center">
              <Badge className={statusBadge(selected.status)}>{selected.status}</Badge>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <h3 className="font-semibold">{selected.type}</h3>
              <p className="text-xs text-muted-foreground">
                {selected.createdAt?.toDate ? selected.createdAt.toDate().toLocaleString() : "—"}
              </p>
              <hr className="my-2 border-gray-200 dark:border-gray-800" />
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">To</p>
                  <p>{selected.toProgramHeadName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p>
                    {selected.fromTeacherName
                      ? `${selected.fromTeacherName} (teacher)`
                      : selected.fromStudentName
                      ? `${selected.fromStudentName} (student)`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="whitespace-pre-wrap break-words">{selected.reason}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attachment</p>
                  {selected.attachmentUrl ? (
                    <a href={selected.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                     {selected.attachmentName || "attachment"}
                    </a>
                  ) : (
                    <p>{selected.attachmentName || "—"}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
              {selected.status === "Pending" && (
                <>
                  <button
                    onClick={async () => { await act(selected.ref, "Approved"); setSelected(null); }}
                    className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => { await act(selected.ref, "Rejected"); setSelected(null); }}
                    className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
