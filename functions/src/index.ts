import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp();
const db = admin.firestore();

type Role = "admin" | "moderator" | "user" | string;

async function assertCallerIsAdminOrMod(context: functions.https.CallableContext, allowModerator = false) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const callerUid = context.auth.uid!;
  const snap = await db.doc(`users/${callerUid}`).get();
  const role = snap.get("role");
  const ok = allowModerator ? ["admin", "moderator"].includes(role) : role === "admin";
  if (!ok) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can perform this action.");
  }
  return { callerUid, role };
}

/** Define role */
export const adminSetRole = functions.https.onCall(async (data, context) => {
  try {
    const { callerUid } = await assertCallerIsAdminOrMod(context, /*allowModerator*/ false);

    const { uid, role } = (data || {}) as { uid?: string; role?: Role };
    if (!uid || !role) {
      throw new functions.https.HttpsError("invalid-argument", "uid and role are required.");
    }
    if (uid === callerUid && role !== "admin") {
      throw new functions.https.HttpsError("failed-precondition", "You cannot change your own role from admin.");
    }

    await db.doc(`users/${uid}`).set({ role }, { merge: true });
    return { ok: true };
  } catch (err: any) {
    console.error("adminSetRole error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message || "Unexpected error");
  }
});

/** Toggle disabled (desativar/reativar) */
export const adminToggleUserDisabled = functions.https.onCall(async (data, context) => {
  try {
    const { callerUid } = await assertCallerIsAdminOrMod(context, /*allowModerator*/ false);

    const { uid, disabled, reason } = (data || {}) as { uid?: string; disabled?: boolean; reason?: string };
    if (!uid || typeof disabled !== "boolean") {
      throw new functions.https.HttpsError("invalid-argument", "uid and disabled are required.");
    }
    if (uid === callerUid && disabled) {
      throw new functions.https.HttpsError("failed-precondition", "You cannot disable your own admin account.");
    }

    await admin.auth().updateUser(uid, { disabled });
    await admin.auth().revokeRefreshTokens(uid);

    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.doc(`users/${uid}`).set(
      disabled
        ? { disabled: true, estado: "Desativado", disabledAt: now, disabledBy: callerUid, disabledReason: reason ?? null, reenabledAt: null, reenabledBy: null }
        : { disabled: false, estado: "Ativo", reenabledAt: now, reenabledBy: callerUid, disabledReason: admin.firestore.FieldValue.delete() },
      { merge: true }
    );

    return { ok: true, uid, disabled };
  } catch (err: any) {
    console.error("adminToggleUserDisabled error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message || "Unexpected error");
  }
});
