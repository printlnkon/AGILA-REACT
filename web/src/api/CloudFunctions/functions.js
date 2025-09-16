const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

setGlobalOptions({
  region: "asia-southeast1",
  cpu: 1,
  memoryMiB: 512,
  timeoutSeconds: 120,
});

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.deleteUserAuth = onCall(async (req) => {
  const input = req?.data || {};
  const payload =
    input?.email || input?.storageFolder || input?.uniqueNumber ? input : input?.data || {};

  const email = payload.email?.trim();
  const storageFolder = payload.storageFolder?.trim()?.toLowerCase();
  const uniqueNumberFromReq = payload.uniqueNumber;
  const roleFromReq = (payload.role || "").toString();

  if (!email) {
    throw new Error("invalid-argument: Email is required");
  }

  let userFound = false;
  let safeName, uniqueNumber, role;

  // Firestore lookup
  const snapshot = await db
    .collectionGroup("accounts")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    safeName = `${(userData.firstName || "").trim()} ${(userData.lastName || "").trim()}`
      .replace(/\s+/g, "_")
      .toLowerCase();
    uniqueNumber =
      userData.uniqueNumber || userData.studentNumber || userData.employeeNumber || uniqueNumberFromReq;
    role = (userData.role || roleFromReq || "").toString();

    await userDoc.ref.delete();
    userFound = true;
  } else {
    safeName = storageFolder;
    uniqueNumber = uniqueNumberFromReq;
    role = roleFromReq;
  }

  // Storage cleanup
  const deletedPrefixes = [];
  try {
    const prefixes = [];

    if (role && uniqueNumber && safeName) {
      const safeRole = role.replace(/\s+/g, "_").toLowerCase();
      prefixes.push(`faces/${safeRole}/${uniqueNumber}/${safeName}/`);
    }

    if (safeName && uniqueNumber) {
      prefixes.push(`faces/${safeName}/${uniqueNumber}/`);
    }

    if (uniqueNumber && safeName) {
      prefixes.push(`faces//${uniqueNumber}/${safeName}/`); // note the double slash on purpose
    }

    for (const prefix of prefixes) {
      const [files] = await bucket.getFiles({ prefix });
      if (files.length) {
        await Promise.all(files.map((f) => f.delete()));
        deletedPrefixes.push(prefix);
      }
    }
  } catch (e) {
    console.error("Storage cleanup error:", e);
  }

  // Auth cleanup
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(userRecord.uid);
  } catch (_) {
    // ignore if not found
  }

  return {
    success: true,
    message: `User ${email} deleted from Auth${userFound ? ", Firestore" : ""}, and Storage (if found).`,
    deletedPrefixes,
  };
});
