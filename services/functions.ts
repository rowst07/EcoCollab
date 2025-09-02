// services/functions.ts
import { app } from "@/firebase";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";

let connectedToEmu = false;
function getFns() {
  const fns = getFunctions(app); // NÃO forçamos região aqui
  if (
    typeof window !== "undefined" &&
    location.hostname === "localhost" &&
    !connectedToEmu
  ) {
    try {
      connectFunctionsEmulator(fns, "127.0.0.1", 5001);
      connectedToEmu = true;
    } catch {}
  }
  return fns;
}

export async function setUserRole(uid: string, role: string) {
  const fn = httpsCallable(getFns(), "adminSetRole");
  try {
    const res = await fn({ uid, role });
    return res.data as { ok: boolean };
  } catch (e: any) {
    // devolve “code: message” para UI
    throw new Error(`${e?.code || "unknown"}: ${e?.message || e?.toString?.() || e}`);
  }
}

export async function toggleUserDisabled(uid: string, disabled: boolean, reason?: string) {
  const fn = httpsCallable(getFns(), "adminToggleUserDisabled");
  try {
    const res = await fn({ uid, disabled, reason });
    return res.data as { ok: boolean; uid: string; disabled: boolean };
  } catch (e: any) {
    throw new Error(`${e?.code || "unknown"}: ${e?.message || e?.toString?.() || e}`);
  }
}
