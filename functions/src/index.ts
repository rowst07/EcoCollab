import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp();

const db = admin.firestore();

type Role = "admin" | "moderator" | "user" | string;

// Helper: confirmar que quem chama é admin
async function assertCallerIsAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const callerUid = context.auth.uid;
  const snap = await db.doc(`users/${callerUid}`).get();
  const role = snap.get("role");
  if (role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can perform this action.");
  }
  return callerUid;
}

/**
 * Admin: definir role de um utilizador (admin/moderator/user).
 * Body: { uid: string, role: Role }
 */
export const adminSetRole = functions.https.onCall(async (data, context) => {
  const callerUid = await assertCallerIsAdmin(context);

  const { uid, role } = (data || {}) as { uid?: string; role?: Role };
  if (!uid || !role) {
    throw new functions.https.HttpsError("invalid-argument", "uid and role are required.");
  }

  // evita o admin retirar o seu próprio papel de admin e ficar locked out
  if (uid === callerUid && role !== "admin") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "You cannot change your own role from admin."
    );
  }

  await db.doc(`users/${uid}`).set({ role }, { merge: true });
  return { ok: true };
});

/**
 * Admin: eliminar utilizador completamente (Auth + Firestore).
 * Body: { uid: string }
 */
export const adminDeleteUser = functions.https.onCall(async (data, context) => {
  const callerUid = await assertCallerIsAdmin(context);

  const { uid } = (data || {}) as { uid?: string };
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "uid is required.");
  }

  // o admin não se pode apagar a si próprio
  if (uid === callerUid) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "You cannot delete your own admin account."
    );
  }

  // apaga da Auth (ignora erro se já não existir)
  await admin.auth().deleteUser(uid).catch(() => null);

  // apaga o doc do Firestore (ignora erro se já não existir)
  await db.doc(`users/${uid}`).delete().catch(() => null);

  return { ok: true };
});
