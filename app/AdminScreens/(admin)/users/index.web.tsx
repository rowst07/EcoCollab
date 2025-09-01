import ConfirmDialog from "@/components/web/ConfirmDialog";
import { db } from "@/firebase";
import { Link } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "../../../../services/AuthContext";

/* ---------- Tipos ---------- */
type Role = "admin" | "moderator" | "user" | string;
type UserRow = { uid: string; nome?: string; email?: string; role?: Role };

/* ---------- Navbar ---------- */
function Navbar() {
  const { user, logout } = useAuth();
  return (
    <View style={{ borderBottomWidth: 1, borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "900" }}>
          <Text style={{ color: "var(--primary)" }}>Eco</Text>Collab Admin
        </Text>
        <View style={{ gap: 16, flexDirection: "row", alignItems: "center" }}>
          <Link href={"/AdminScreens" as any} style={{ color: "var(--primary)" }}>Dashboard</Link>
          <Link href={"/AdminScreens/users" as any} style={{ color: "var(--primary)", fontWeight: "700" }}>Users</Link>
          <Link href={"/AdminScreens/reports" as any} style={{ color: "var(--primary)" }}>Reports</Link>
          <Link href={"/AdminScreens/retomas" as any} style={{ color: "var(--primary)" }}>Retomas</Link>
          {user && (
            <Pressable onPress={logout} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#eaf4ee" }}>
              <Text style={{ color: "#166534", fontWeight: "600" }}>Sair</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------- Badge ---------- */
function RoleBadge({ value }: { value?: Role }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)", alignSelf: "flex-start" }}>
      <Text style={{ fontSize: 12 }}>{value ?? "—"}</Text>
    </View>
  );
}

/* ---------- Página Users ---------- */
export default function UsersWebPage() {
  const { user, role, loading } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // estados dos modais
  const [confirmRole, setConfirmRole] =
    useState<{ uid: string; to: Role; label: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Subscrição aos users
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("nome", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            uid: d.id,
            nome: data.nome ?? data.name ?? "",
            email: data.email ?? "",
            role: data.role ?? "user",
          };
        })
      );
    });
    return () => unsub();
  }, []);

  const isSelf = (uid: string) => user?.uid === uid;

  async function setRole(uid: string, newRole: Role) {
    if (isSelf(uid) && newRole !== "admin") {
      Alert.alert("Operação não permitida", "Não podes alterar o teu próprio papel de admin.");
      return;
    }
    setBusy(uid);
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
    } catch (e) {
      console.error("setRole error:", e);
      Alert.alert("Erro", "Não foi possível alterar o papel.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(uid: string) {
    if (isSelf(uid)) {
      Alert.alert("Operação não permitida", "Não podes eliminar a tua própria conta aqui.");
      return;
    }
    setBusy(uid);
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (e) {
      console.error("deleteUser error:", e);
      Alert.alert("Erro", "Não foi possível eliminar o utilizador.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return null;

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 8 }}>Utilizadores</Text>
        <Text style={{ color: "var(--muted)", marginBottom: 16 }}>
          Promover/revogar “admin” e eliminar documentos. (Apagar na Authentication fica pendente das Cloud Functions.)
        </Text>

        <View style={{ borderWidth: 1, borderColor: "var(--border)", borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)" }}>
          {/* Cabeçalho */}
          <View style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <Text style={{ width: "30%", fontWeight: "700" }}>Nome</Text>
            <Text style={{ width: "35%", fontWeight: "700" }}>Email</Text>
            <Text style={{ width: "15%", fontWeight: "700" }}>Role</Text>
            <Text style={{ width: "20%", fontWeight: "700", textAlign: "right" }}>Ações</Text>
          </View>

          {/* Linhas */}
          {rows.map((r) => {
            const disableActions = busy === r.uid || isSelf(r.uid);
            const actionLabel = r.role === "admin" ? "Revogar Admin" : "Tornar Admin";
            const nextRole: Role = r.role === "admin" ? "user" : "admin";

            return (
              <View
                key={r.uid}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderTopWidth: 1,
                  borderColor: "var(--border)",
                }}
              >
                <Text style={{ width: "30%" }}>{r.nome || "—"}</Text>
                <Text style={{ width: "35%" }}>{r.email || "—"}</Text>
                <View style={{ width: "15%" }}>
                  <RoleBadge value={r.role} />
                </View>

                <View style={{ width: "20%", flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                  <Pressable
                    disabled={disableActions}
                    onPress={() => setConfirmRole({ uid: r.uid, to: nextRole, label: actionLabel })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: r.role === "admin" ? "#fee2e2" : "#eaf4ee",
                      borderWidth: 1,
                      borderColor: r.role === "admin" ? "#fecaca" : "#cbe7d4",
                      opacity: disableActions ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: r.role === "admin" ? "#991b1b" : "#166534", fontWeight: "600" }}>
                      {busy === r.uid ? "A guardar…" : actionLabel}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={disableActions}
                    onPress={() => setConfirmDelete(r.uid)}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)",
                      opacity: disableActions ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>
                      {busy === r.uid ? "A eliminar…" : "Eliminar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {rows.length === 0 && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: "var(--muted)" }}>Sem utilizadores.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Modais */}
      <ConfirmDialog
        open={!!confirmRole}
        title={confirmRole?.label ?? ""}
        description={
          confirmRole?.to === "admin"
            ? "Tens a certeza que queres promover este utilizador a Admin?"
            : "Tens a certeza que queres revogar o papel de Admin deste utilizador?"
        }
        confirmText="Confirmar"
        onConfirm={async () => {
          if (!confirmRole) return;
          await setRole(confirmRole.uid, confirmRole.to);
        }}
        onClose={() => setConfirmRole(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar utilizador"
        description="Isto remove apenas o documento no Firestore (remoção na Authentication fica para quando as Cloud Functions estiverem deployadas)."
        confirmText="Eliminar"
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteUser(confirmDelete);
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </View>
  );
}
