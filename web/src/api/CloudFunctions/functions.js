const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.deleteUserAuth = functions.https.onCall(async (data, context) => {
  const payload = data?.email || data?.storageFolder || data?.uniqueNumber ? data : data?.data || {};

  console.log("Payload received:", payload);

  const email = payload.email?.trim();
  const storageFolder = payload.storageFolder?.trim().toLowerCase();
  const uniqueNumberFromReq = payload.uniqueNumber;

  console.log("Email from request:", email);
  console.log("Storage folder from request:", storageFolder);
  console.log("Unique number from request:", uniqueNumberFromReq);

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }

  let userFound = false;
  let safeName, uniqueNumber;

  try {
    // Try to get user doc from Firestore
    const snapshot = await db.collectionGroup("accounts")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      safeName = `${(userData.firstName || "").trim()} ${(userData.lastName || "").trim()}`
        .replace(/\s+/g, "_")
        .toLowerCase();
      uniqueNumber = userData.uniqueNumber || userData.studentNumber || userData.employeeNumber;

      console.log(`SAFE NAME (from Firestore): ${safeName}`);
      console.log(`UNIQUE NUMBER (from Firestore): ${uniqueNumber}`);

      // Delete Firestore doc
      await userDoc.ref.delete();
      console.log(`✅ Deleted Firestore doc for ${email}`);

      userFound = true;
    } else {
      console.warn(`⚠ No Firestore account found for ${email}`);
    }

    // If Firestore doc not found, fallback to request data
    if (!userFound) {
      safeName = storageFolder?.trim().toLowerCase();
      uniqueNumber = uniqueNumberFromReq;
      console.log(`SAFE NAME (from request): ${safeName}`);
      console.log(`UNIQUE NUMBER (from request): ${uniqueNumber}`);
    }

    // Delete files from Storage if we have folder info
    if (safeName && uniqueNumber) {
      const folderPath = `faces/${safeName}/${uniqueNumber}/`;
      console.log(`Deleting files with prefix: ${folderPath}`);

      const [files] = await bucket.getFiles({ prefix: folderPath });
      if (files.length > 0) {
        await Promise.all(files.map(f => f.delete()));
        console.log(`✅ Deleted ${files.length} files from ${folderPath}`);
      } else {
        console.warn(`⚠ No files found in ${folderPath}`);
      }
    } else {
      console.warn("⚠ No valid safeName or uniqueNumber found, skipping storage delete");
    }

    // delete from Firebase Authentication
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(userRecord.uid);
      console.log(`✅ Deleted Auth account for ${email}`);
    } catch (authErr) {
      console.warn(`⚠ Auth account not found for ${email}, skipping`);
    }

    return {
      success: true,
      message: `User ${email} deleted from Auth${userFound ? ", Firestore" : ""}, and Storage (if found).`,
    };

  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
