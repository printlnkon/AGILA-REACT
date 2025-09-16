import React from "react";
import {
  Eye,
  CheckCircle2,
  XCircle,
  ClipboardList,
  History,
  Search,
  Loader2,
  Trash2,
  Plus,
  Paperclip,
  X,
  Edit3,
  MoreHorizontal,
} from "lucide-react";
import {
  getFirestore,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";


const Badge = ({ children, className = "" }) => (
  <span className={`text-xs font-bold px-3 py-1 rounded-full ${className}`}>{children}</span>
);

const statusBadge = (status) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
    case "Rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
  }
};

function RequestFormModal({ open, onClose, onSave, programHeads, initial }) {
  const [fileName, setFileName] = React.useState(initial?.attachmentName || "");
  const [phId, setPhId] = React.useState(initial?.toProgramHeadId || "");
  const [file, setFile] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setFileName(initial?.attachmentName || "");
      setPhId(initial?.toProgramHeadId || "");
      setFile(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = fd.get("type") || initial?.type || "Permission";
    const reason = (fd.get("reason") || initial?.reason || "").trim();
    const ph = programHeads.find((p) => p.id === phId);
    const toProgramHeadId = ph?.id || initial?.toProgramHeadId || null;
    const toProgramHeadName =
      ph
        ? `${ph.firstName ?? ""} ${ph.lastName ?? ""}`.trim() || ph.email || "—"
        : initial?.toProgramHeadName || "—";

    onSave({
      type,
      reason,
      attachmentName: fileName || initial?.attachmentName || "",
      ...(file ? { attachmentFile: file } : {}),
      toProgramHeadId,
      toProgramHeadName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold">{initial ? "Edit Request" : "Create Request"}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type of Request</label>
            <select
              name="type"
              defaultValue={initial?.type || "Permission"}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <option>Permission</option>
              <option>Schedule Adjustment</option>
              <option>Document Request</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To (Program Head)</label>
            <select
              required
              value={phId}
              onChange={(e) => setPhId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <option value="" disabled>
                Select a program head…
              </option>
              {programHeads.map((p) => {
                const label = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email || p.id;
                return (
                  <option key={p.id} value={p.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason / Description</label>
            <textarea
              name="reason"
              rows={4}
              defaultValue={initial?.reason || ""}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attachment</label>
            <label
              htmlFor="att"
              className="cursor-pointer flex items-center gap-2 w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-dashed rounded-lg hover:border-blue-500"
            >
              <Paperclip size={16} />
              <span className="truncate">{fileName || initial?.attachmentName || "Attach a file (name only)"}</span>
            </label>
            <input id="att" type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; setFileName(f?.name || ""); setFile(f || null); }} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700">
              {initial ? "Save" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Request() {
  const { currentUser } = useAuth();

  const [inbox, setInbox] = React.useState([]);
  const [myActive, setMyActive] = React.useState([]);
  const [myHistory, setMyHistory] = React.useState([]);
  const [inboxHiddenIds, setInboxHiddenIds] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const [tab, setTab] = React.useState("All");
  const [loadingInbox, setLoadingInbox] = React.useState(true);
  const [loadingMine, setLoadingMine] = React.useState(true);

  const [selected, setSelected] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editInit, setEditInit] = React.useState(null);
  const [programHeads, setProgramHeads] = React.useState([]);

  const [openMenuInbox, setOpenMenuInbox] = React.useState(null);
  const [openMenuMine, setOpenMenuMine] = React.useState(null);

  React.useEffect(() => {
    if (!currentUser?.uid) return;
    const db = getFirestore();

    const qInbox = query(
      collectionGroup(db, "Request"),
      where("toTeacherId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubInbox = onSnapshot(qInbox, (snap) => {
      setInbox(snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })));
      setLoadingInbox(false);
    });

    const qMine = query(
      collection(db, "users", "teacher", "accounts", currentUser.uid, "Request"),
      orderBy("createdAt", "desc")
    );
    const unsubMine = onSnapshot(qMine, (snap) => {
      setMyActive(snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })));
      setLoadingMine(false);
    });

    const qHist = query(
      collection(db, "users", "teacher", "accounts", currentUser.uid, "History"),
      orderBy("deletedAt", "desc")
    );
    const unsubHist = onSnapshot(qHist, (snap) => {
      setMyHistory(snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() })));
    });

    const qPH = collection(db, "users", "program_head", "accounts");
    const unsubPH = onSnapshot(qPH, (snap) => {
      setProgramHeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qInboxHist = collection(db, "users", "teacher", "accounts", currentUser.uid, "InboxHistory");
    const unsubInboxHist = onSnapshot(qInboxHist, (snap) => {
      setInboxHiddenIds(snap.docs.map((d) => d.id));
    });

    return () => {
      unsubInbox();
      unsubMine();
      unsubHist();
      unsubPH();
      unsubInboxHist();
    };
  }, [currentUser?.uid]);

  const filterRows = (rows) => {
    const byTab = (r) => (tab === "All" ? true : r.status === tab);
    const bySearch = (r) =>
      !search.trim()
        ? true
        : (
            (r.type || "") +
            (r.fromStudentName || "") +
            (r.fromTeacherName || "") +
            (r.toTeacherName || "") +
            (r.toProgramHeadName || "") +
            (r.reason || "")
          )
            .toLowerCase()
            .includes(search.toLowerCase());
    return rows.filter((r) => byTab(r) && bySearch(r));
  };

  const act = async (docRef, nextStatus) => {
    await updateDoc(docRef, { status: nextStatus, updatedAt: serverTimestamp() });
  };

  const moveMineToHistory = async (row) => {
    const db = getFirestore();
    const srcRef = doc(db, "users", "teacher", "accounts", currentUser.uid, "Request", row.id);
    const snap = await getDoc(srcRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const destRef = doc(db, "users", "teacher", "accounts", currentUser.uid, "History", row.id);
    await setDoc(destRef, { ...data, deletedAt: serverTimestamp(), deletedBy: "teacher" });
    await deleteDoc(srcRef);
  };

  const removeFromInbox = async (row) => {
    const db = getFirestore();
    const destRef = doc(db, "users", "teacher", "accounts", currentUser.uid, "InboxHistory", row.id);
    await setDoc(destRef, {
      sourcePath: row.ref?.path || null,
      removedAt: serverTimestamp(),
      snapshot: {
        type: row.type || null,
        status: row.status || null,
        fromStudentName: row.fromStudentName || null,
        toTeacherName: row.toTeacherName || null,
        reason: row.reason || null,
      },
    });
  };

  const updateMine = async (reqId, payload) => {
    const db = getFirestore();
    if (payload.attachmentFile) {
     const storage = getStorage();
     const path = `attachments/teacher_to_program_head/${currentUser.uid}/${reqId}/${payload.attachmentFile.name}`;
     const ref = storageRef(storage, path);
     await uploadBytes(ref, payload.attachmentFile);
     const url = await getDownloadURL(ref);
    payload.attachmentUrl = url;
     payload.attachmentName = payload.attachmentFile.name;
     delete payload.attachmentFile;
   }
   if (payload.attachmentFile == null) {
      delete payload.attachmentFile;
    }
    await updateDoc(
      doc(db, "users", "teacher", "accounts", currentUser.uid, "Request", reqId),
      { ...payload, updatedAt: serverTimestamp() }
    );
  };

  const create = async (payload) => {
    const db = getFirestore();
    const teacherLabel =
      `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
      currentUser?.email ||
      "Teacher";
    const { attachmentFile, ...docBody } = payload;
    const docRef = await addDoc(collection(db, "users", "teacher", "accounts", currentUser.uid, "Request"), {
      ...docBody,
      status: "Pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      fromTeacherId: currentUser.uid,
      fromTeacherName: teacherLabel,
      route: "teacher_to_program_head",
    });
    if (attachmentFile) {
     const storage = getStorage();
     const path = `attachments/teacher_to_program_head/${currentUser.uid}/${docRef.id}/${attachmentFile.name}`;
     const ref = storageRef(storage, path);
     await uploadBytes(ref, attachmentFile);
     const url = await getDownloadURL(ref);
     await updateDoc(docRef, { attachmentUrl: url, attachmentName: attachmentFile.name });
    }
  };

  const hiddenSet = React.useMemo(() => new Set(inboxHiddenIds), [inboxHiddenIds]);
  const inboxVisible = inbox.filter((r) => !hiddenSet.has(r.id));
  const inboxDisplay = showHistory
    ? filterRows(inboxVisible.filter((r) => r.status !== "Pending"))
    : filterRows(inboxVisible);

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      <RequestFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={create}
        programHeads={programHeads}
      />
      <RequestFormModal
        open={!!editInit}
        onClose={() => setEditInit(null)}
        onSave={(payload) => updateMine(editInit.id, payload)}
        programHeads={programHeads}
        initial={editInit}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Student → Teacher inbox and your own requests to Program Heads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border ${
              showHistory
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Create Request</span>
          </button>
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
        <div className="ml-auto relative w-full sm:w-80">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>

      <div className="space-y-8">
        <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground border-b dark:border-gray-800">
            <span className="flex-grow">{showHistory ? "From Students • History" : "From Students"}</span>
            <span className="w-28 sm:w-32 pl-2 text-left">Status</span>
            <span className="w-40 sm:w-52 text-center">Actions</span>
          </div>

          {loadingInbox ? (
            <div className="p-10 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : inboxDisplay.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {showHistory ? "No resolved requests from students." : "No requests from students."}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {inboxDisplay.map((r) => (
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
                      From: {r.fromStudentName || "—"} • To: {r.toTeacherName || "—"}
                    </p>
                  </div>
                  <div className="w-28 sm:w-32 flex-shrink-0 flex justify-start pl-2">
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="w-40 sm:w-52 relative flex justify-center">
                    <button
                      onClick={() => setOpenMenuInbox((id) => (id === r.id ? null : r.id))}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenuInbox === r.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                        <ul className="py-1">
                          <li>
                            <button
                              onClick={() => {
                                setSelected(r);
                                setOpenMenuInbox(null);
                              }}
                              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Eye size={16} /> View Details
                            </button>
                          </li>
                          {r.status === "Pending" && (
                            <>
                              <li>
                                <button
                                  onClick={async () => {
                                    await act(r.ref, "Approved");
                                    setOpenMenuInbox(null);
                                  }}
                                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <CheckCircle2 size={16} /> Approve
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={async () => {
                                    await act(r.ref, "Rejected");
                                    setOpenMenuInbox(null);
                                  }}
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
                                onClick={async () => {
                                  await removeFromInbox(r);
                                  setOpenMenuInbox(null);
                                }}
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
        </section>

        <section className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground border-b dark:border-gray-800">
            <span className="flex-grow">{showHistory ? "My Requests • History" : "My Requests"}</span>
            <span className="w-28 sm:w-32 pl-2 text-left">Status</span>
            <span className="w-40 sm:w-52 text-center">Actions</span>
          </div>

          {loadingMine ? (
            <div className="p-10 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (showHistory ? myHistory : myActive).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {showHistory ? "No items in history." : "You have no active requests."}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {(showHistory ? myHistory : myActive).map((r) => (
                <div
                  key={r.id}
                  className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold flex items-center gap-2 truncate">
                      <ClipboardList className="h-4 w-4 text-blue-500" />
                      <span className="truncate">{r.type}</span>
                    </p>
                    <p className="text-sm text-muted-foreground truncate">To: {r.toProgramHeadName || "—"}</p>
                  </div>
                  <div className="w-28 sm:w-32 flex-shrink-0 flex justify-start pl-2">
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(
                        r.status || "Pending"
                      )}`}
                    >
                      {r.status || "Pending"}
                    </span>
                  </div>
                  <div className="w-40 sm:w-52 relative flex justify-center">
                    <button
                      onClick={() => setOpenMenuMine((id) => (id === r.id ? null : r.id))}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenuMine === r.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                        <ul className="py-1">
                          <li>
                            <button
                              onClick={() => {
                                setSelected(r);
                                setOpenMenuMine(null);
                              }}
                              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Eye size={16} /> View Details
                            </button>
                          </li>
                          {!showHistory && r.status === "Pending" && (
                            <li>
                              <button
                                onClick={() => {
                                  setEditInit(r);
                                  setOpenMenuMine(null);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Edit3 size={16} /> Edit
                              </button>
                            </li>
                          )}
                          {!showHistory && (
                            <li>
                              <button
                                onClick={async () => {
                                  await moveMineToHistory(r);
                                  setOpenMenuMine(null);
                                }}
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
        </section>
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
              <Badge className={statusBadge(selected.status || "Pending")}>
                {selected.status || "Pending"}
              </Badge>
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
                  <p>{selected.toTeacherName || selected.toProgramHeadName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p>
                    {selected.fromStudentName
                      ? `${selected.fromStudentName} (student)`
                      : selected.fromTeacherName
                      ? `${selected.fromTeacherName} (teacher)`
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
              {selected.ref && inbox.find((x) => x.id === selected.id) && selected.status === "Pending" && (
                <>
                  <button
                    onClick={async () => {
                      await act(selected.ref, "Approved");
                      setSelected(null);
                    }}
                    className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      await act(selected.ref, "Rejected");
                      setSelected(null);
                    }}
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
