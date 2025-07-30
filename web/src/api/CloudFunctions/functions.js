const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.deleteUserAuth = functions.https.onCall((data, context) => {
  console.log("Raw data received in deleteUserAuth:", data);

  let email = data?.email;

  if (!email && data?.data?.email) {
    email = data.data.email; // fallback if nesting happens
  }

  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email is required"
    );
  }

  return admin
    .auth()
    .getUserByEmail(email)
    .then((userRecord) => admin.auth().deleteUser(userRecord.uid))
    .then(() => {
      return { success: true, message: `User with email ${email} deleted.` };
    })
    .catch((error) => {
      throw new functions.https.HttpsError("internal", error.message);
    });
});
