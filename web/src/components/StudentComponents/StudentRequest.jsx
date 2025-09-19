import { useState, useEffect } from "react";
import {
  Plus,
  History,
  Paperclip,
  X,
  Eye,
  Trash2,
  Edit3,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

const statusBadge = (status) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400";
    case "Rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
    default:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400";
  }
};

const RequestFormModal = ({ open, onClose, initial, onSave, teachers }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    initial?.toTeacherId || ""
  );
  const [files, setFiles] = useState([]);
  const [fileListLabel, setFileListLabel] = useState("");
  const [fileError, setFileError] = useState("");
  const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  const removeFile = (key) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.name + ":" + f.size !== key);
      setFileListLabel(
        next.length === 1
          ? next[0].name
          : next.length
          ? `${next.length} files selected`
          : ""
      );
      return next;
    });
  };

  const clearFiles = () => {
    setFiles([]);
    setFileListLabel("");
    setFileError("");
  };

  const onFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    for (const f of picked) {
      const byMime = ALLOWED_TYPES.includes(f.type);
      const byExt = /\.(pdf|png|jpe?g)$/i.test(f.name || "");
      if (!byMime && !byExt) {
        setFileError(`"${f.name}" is not allowed. Use PDF/JPG/PNG.`);
        e.target.value = "";
        return;
      }
    }

    const map = new Map(files.map((x) => [x.name + ":" + x.size, x]));
    for (const f of picked) map.set(f.name + ":" + f.size, f);
    const merged = Array.from(map.values());
    const total = merged.reduce((s, f) => s + (f.size || 0), 0);
    if (total > MAX_TOTAL_BYTES) {
      setFileError("Total size of all attachments exceeds 200MB.");
      e.target.value = "";
      return;
    }

    setFileError("");
    setFiles(merged);
    setFileListLabel(
      merged.length === 1 ? merged[0].name : `${merged.length} files selected`
    );
    e.target.value = "";
  };

  useEffect(() => {
    if (open) {
      setFiles([]);
      setFileListLabel(
        initial?.attachments?.length
          ? `${initial.attachments.length} files`
          : initial?.attachmentName || ""
      );
      setFileError("");
      setSelectedTeacherId(initial?.toTeacherId || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = fd.get("type") || "To be Excused";
    const reason = (fd.get("reason") || "").trim();
    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    const toTeacherId = teacher?.id || null;
    const toTeacherName = teacher
      ? `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
        teacher.email ||
        "—"
      : initial?.toTeacherName || "";
    onSave({
      type,
      reason,
      attachmentName:
        files.length === 1
          ? files[0].name
          : files.length
          ? `${files.length} files`
          : initial?.attachmentName || "",
      attachmentFiles: files,
      toTeacherId,
      toTeacherName,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit Request" : "Create New Request"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Type of Request
            </label>
            <select
              name="type"
              defaultValue={initial?.type || "To be Excused"}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <option>To be Excused</option>
              <option>Permission</option>
              <option>Send Attachment</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              To (Teacher)
            </label>
            <select
              required
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <option value="" disabled>
                Select a teacher…
              </option>
              {teachers.map((t) => {
                const label =
                  `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() ||
                  t.email ||
                  t.id;
                return (
                  <option key={t.id} value={t.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Reason / Description
            </label>
            <textarea
              rows={4}
              name="reason"
              defaultValue={initial?.reason || ""}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Attachments
            </label>
            <label
              htmlFor="att"
              className="cursor-pointer flex items-center gap-2 w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-dashed rounded-lg hover:border-blue-500"
            >
              <Paperclip size={16} />
              <span className="truncate">
                {fileListLabel || "Attach files (PDF or JPG/PNG)"}
              </span>
              {files.length > 1 && (
                <span className="ml-auto inline-flex items-center justify-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {files.length}
                </span>
              )}
            </label>
            <input
              id="att"
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
              className="hidden"
              onClick={(e) => {
                e.currentTarget.value = "";
              }}
              onChange={onFilesChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional. PDF or JPG/PNG only. Max 200MB total.
            </p>
            {!!fileError && (
              <p className="text-xs text-red-600 mt-1">{fileError}</p>
            )}
            {files.length > 0 && (
              <div className="mt-2">
                <ul className="text-xs max-h-28 overflow-auto space-y-1">
                  {files.map((f) => {
                    const key = f.name + ":" + f.size;
                    return (
                      <li key={key} className="flex items-center gap-2">
                        <span className="truncate flex-1">• {f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(key)}
                          className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                          aria-label={`Remove ${f.name}`}
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!fileError}
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewModal = ({ open, onClose, req, onEdit }) => {
  if (!open || !req) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold">{req.type}</h3>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge(
                req.status
              )}`}
            >
              {req.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">To</p>
            <p>{req.toTeacherName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date Requested</p>
            <p>
              {req.createdAt?.toDate
                ? req.createdAt.toDate().toLocaleString()
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reason</p>
            <p className="whitespace-pre-wrap break-words">{req.reason}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Attachments</p>
            {Array.isArray(req.attachments) && req.attachments.length > 0 ? (
              <div>
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {req.attachments.length} file
                  {req.attachments.length > 1 ? "s" : ""}
                </span>
                <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                  {req.attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : req.attachmentUrl ? (
              <a
                href={req.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {req.attachmentName || "attachment"}
              </a>
            ) : (
              <p>{req.attachmentName || "None"}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
          {req.status === "Pending" && (
            <button
              onClick={() => onEdit(req)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Edit3 size={16} /> Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function StudentRequest() {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editInit, setEditInit] = useState(null);
  const [view, setView] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const db = getFirestore();
    const qReq = query(
      collection(
        db,
        "users",
        "student",
        "accounts",
        currentUser.uid,
        "Request"
      ),
      orderBy("createdAt", "desc")
    );
    const unsubReq = onSnapshot(qReq, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const qHist = query(
      collection(
        db,
        "users",
        "student",
        "accounts",
        currentUser.uid,
        "History"
      ),
      orderBy("deletedAt", "desc")
    );
    const unsubHist = onSnapshot(qHist, (snap) => {
      setHistoryRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const qTeachers = collection(db, "users", "teacher", "accounts");
    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeachers(list);
    });
    return () => {
      unsubReq();
      unsubHist();
      unsubTeachers();
    };
  }, [currentUser?.uid]);

  const create = async (payload) => {
    const db = getFirestore();
    const studentLabel =
      `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
      currentUser?.displayName ||
      currentUser?.email ||
      "Student";

    const { attachmentFiles = [], ...docBody } = payload;

    const docRef = await addDoc(
      collection(
        db,
        "users",
        "student",
        "accounts",
        currentUser.uid,
        "Request"
      ),
      {
        ...docBody,
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        fromStudentId: currentUser.uid,
        fromStudentName: studentLabel,
      }
    );

    if (attachmentFiles.length) {
      const storage = getStorage();
      const uploaded = [];
      for (const f of attachmentFiles) {
        const path = `attachments/student_to_teacher/${currentUser.uid}/${docRef.id}/${f.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, f, { contentType: f.type || undefined });
        const url = await getDownloadURL(ref);
        uploaded.push({
          name: f.name,
          url,
          contentType: f.type || null,
          size: f.size,
        });
      }
      await updateDoc(docRef, {
        attachmentUrl: uploaded.length === 1 ? uploaded[0].url : null,
        attachmentName:
          uploaded.length === 1 ? uploaded[0].name : `${uploaded.length} files`,
        attachments: uploaded,
      });
    }
  };

  const update = async (reqId, payload) => {
    const db = getFirestore();
    const { attachmentFiles = [], ...rest } = payload;

    const uploaded = [];
    if (attachmentFiles.length) {
      const storage = getStorage();
      for (const f of attachmentFiles) {
        const path = `attachments/student_to_teacher/${currentUser.uid}/${reqId}/${f.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, f, { contentType: f.type || undefined });
        const url = await getDownloadURL(ref);
        uploaded.push({
          name: f.name,
          url,
          contentType: f.type || null,
          size: f.size,
        });
      }
    }

    const updateBody = { ...rest, updatedAt: serverTimestamp() };
    if (uploaded.length) {
      updateBody.attachmentUrl = uploaded.length === 1 ? uploaded[0].url : null;
      updateBody.attachmentName =
        uploaded.length === 1 ? uploaded[0].name : `${uploaded.length} files`;
      updateBody.attachments = uploaded;
    }

    await updateDoc(
      doc(
        db,
        "users",
        "student",
        "accounts",
        currentUser.uid,
        "Request",
        reqId
      ),
      updateBody
    );
  };

  const moveToHistory = async (reqId) => {
    const db = getFirestore();
    const srcRef = doc(
      db,
      "users",
      "student",
      "accounts",
      currentUser.uid,
      "Request",
      reqId
    );
    const snapshot = await getDoc(srcRef);
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const destRef = doc(
      db,
      "users",
      "student",
      "accounts",
      currentUser.uid,
      "History",
      reqId
    );
    await setDoc(destRef, {
      ...data,
      deletedAt: serverTimestamp(),
      deletedBy: "student",
    });
    await deleteDoc(srcRef);
  };

  const list = showHistory ? historyRows : rows;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
      <RequestFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={create}
        teachers={teachers}
      />
      <RequestFormModal
        open={!!editInit}
        onClose={() => setEditInit(null)}
        initial={editInit}
        onSave={(payload) => update(editInit.id, payload)}
        teachers={teachers}
      />
      <ViewModal
        open={!!view}
        onClose={() => setView(null)}
        req={view}
        onEdit={(r) => {
          setView(null);
          setEditInit(r);
        }}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Requests</h1>
          <p className="text-muted-foreground">
            Manage your document and absence requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border cursor-pointer rounded-lg ${
              showHistory
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <History size={16} />
            <span>{showHistory ? "Back to Active" : "History"}</span>
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 cursor-pointer text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 hidden cursor-pointer sm:flex justify-between items-center text-sm font-semibold text-muted-foreground border-b dark:border-gray-800">
          <span className="flex-grow">
            {showHistory ? "History" : "Type of Request"}
          </span>
          <span className="w-40 text-center">Status</span>
          <span className="w-20 text-center">Actions</span>
        </div>

        {loading ? (
          <div className="p-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {showHistory
              ? "No history yet."
              : "You have no active requests. Click “Create Request” to start."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {list.map((r) => (
              <div
                key={r.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex-grow">
                  <p className="font-semibold">{r.type}</p>
                  <p className="text-sm text-muted-foreground">
                    To: {r.toTeacherName || "—"}
                  </p>
                </div>

                <div className="w-full sm:w-32 flex sm:justify-center">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge(
                      r.status
                    )}`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="relative sm:w-20 flex justify-center">
                  <button
                    onClick={() =>
                      setOpenMenu((id) => (id === r.id ? null : r.id))
                    }
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenu === r.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                      <ul className="py-1">
                        <li>
                          <button
                            onClick={() => {
                              setView(r);
                              setOpenMenu(null);
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
                                setOpenMenu(null);
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
                                await moveToHistory(r.id);
                                setOpenMenu(null);
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
      </div>
    </div>
  );
}
