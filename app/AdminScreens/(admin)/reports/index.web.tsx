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
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../../../../services/AuthContext";

/** --- Status mapeados / normalização ---------------------------------- */
type RawStatus = "pendente" | "aprovado" | "aceite" | "reprovado" | "rejeitado" | string;
type StatusNorm = "Pendente" | "Aprovado" | "Rejeitado";

function normalizeStatus(raw?: string): StatusNorm {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "aprovado" || s === "aceite") return "Aprovado";
  if (s === "reprovado" || s === "rejeitado") return "Rejeitado";
  return "Pendente";
}

function statusToFirestoreTarget(next: StatusNorm): RawStatus {
  // Ao aprovar vamos gravar "aprovado"; ao rejeitar "rejeitado"; reset "pendente"
  if (next === "Aprovado") return "aprovado";
  if (next === "Rejeitado") return "rejeitado";
  return "pendente";
}

/** --- Tipos ------------------------------------------------------------ */
type ReportRow = {
  id: string;
  tipo?: string;
  descricao?: string;
  pontoId?: string;
  fotoUrl?: string | null;
  criadoPor?: string;
  criadoPorDisplay?: string;
  status?: RawStatus;
  dataCriacao?: any;
};

/** --- Navbar (igual ao resto do admin) -------------------------------- */
function Navbar() {
  const { user, logout } = useAuth();
  return (
    <View style={{ borderBottomWidth: 1, borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <View
        style={{
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontWeight: "900" }}>
          <Text style={{ color: "var(--primary)" }}>Eco</Text>Collab Admin
        </Text>
        <View style={{ gap: 16, flexDirection: "row", alignItems: "center" }}>
          <Link href={"/AdminScreens" as any} style={{ color: "var(--primary)" }}>Dashboard</Link>
          <Link href={"/AdminScreens/users" as any} style={{ color: "var(--primary)" }}>Users</Link>
          <Link href={"/AdminScreens/reports" as any} style={{ color: "var(--primary)", fontWeight: "700" }}>Reports</Link>
          <Link href={"/AdminScreens/retomas" as any} style={{ color: "var(--primary)" }}>Retomas</Link>
          {user && (
            <Pressable
              onPress={logout}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#eaf4ee" }}
            >
              <Text style={{ color: "#166534", fontWeight: "600" }}>Sair</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

/** --- Badge de estado -------------------------------------------------- */
function StatusBadge({ value }: { value?: RawStatus }) {
  const n = normalizeStatus(value);
  const map: Record<StatusNorm, { bg: string; border: string; color: string; label: string }> = {
    Pendente:  { bg: "#fff7ed", border: "#ffedd5", color: "#9a3412", label: "Pendente" },
    Aprovado:  { bg: "#ecfdf5", border: "#bbf7d0", color: "#065f46", label: "Aprovado" },
    Rejeitado: { bg: "#fee2e2", border: "#fecaca", color: "#991b1b", label: "Rejeitado" },
  };
  const style = map[n];
  return (
    <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: style.bg, borderWidth: 1, borderColor: style.border }}>
      <Text style={{ color: style.color, fontSize: 12, fontWeight: "600" }}>{style.label}</Text>
    </View>
  );
}

/** --- Página Reports --------------------------------------------------- */
export default function ReportsWebPage() {
  // Nas regras, mods e admins podem gerir reports ⇒ permissões de ação para ambos
  const { role } = useAuth();
  const canModerate = role === "admin" || role === "moderator";

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusNorm | "Todos">("Todos");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [confirmStatus, setConfirmStatus] =
    useState<{ id: string; to: StatusNorm } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "reportes"), orderBy("dataCriacao", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: ReportRow[] = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          tipo: x.tipo ?? "",
          descricao: x.descricao ?? "",
          pontoId: x.pontoId ?? "",
          fotoUrl: x.fotoUrl ?? null,
          criadoPor: x.criadoPor ?? "",
          criadoPorDisplay: x.criadoPorDisplay ?? "",
          status: x.status ?? "pendente",
          dataCriacao: x.dataCriacao ?? x.createdAt ?? null,
        };
      });
      setRows(arr);
    });
    return () => unsub();
  }, []);

  const view = useMemo(() => {
    let data = rows;
    if (statusFilter !== "Todos") {
      data = data.filter((r) => normalizeStatus(r.status) === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter((r) =>
        (r.tipo ?? "").toLowerCase().includes(q) ||
        (r.descricao ?? "").toLowerCase().includes(q) ||
        (r.pontoId ?? "").toLowerCase().includes(q) ||
        (r.criadoPorDisplay ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, statusFilter, search]);

  async function setStatus(id: string, to: StatusNorm) {
    if (!canModerate) {
      Alert.alert("Sem permissão", "Apenas moderadores e administradores podem alterar o estado.");
      return;
    }
    setBusyId(id);
    try {
      await updateDoc(doc(db, "reportes", id), { status: statusToFirestoreTarget(to) });
    } catch (e) {
      console.error("setStatus error:", e);
      Alert.alert("Erro", "Não foi possível alterar o estado.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeReport(id: string) {
    if (!canModerate) {
      Alert.alert("Sem permissão", "Apenas moderadores e administradores podem eliminar reportes.");
      return;
    }
    setBusyId(id);
    try {
      await deleteDoc(doc(db, "reportes", id));
    } catch (e) {
      console.error("delete report error:", e);
      Alert.alert("Erro", "Não foi possível eliminar o reporte.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />

      <View style={{ padding: 16 }}>
        {/* Header + filtros */}
        <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as any }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Reports</Text>
            <Text style={{ color: "var(--muted)" }}>Avaliação e gestão de reportes</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" as any }}>
            {(["Todos", "Pendente", "Aprovado", "Rejeitado"] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatusFilter(s)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: statusFilter === s ? "#eaf4ee" : "var(--bg)",
                  borderWidth: 1,
                  borderColor: statusFilter === s ? "#cbe7d4" : "var(--border)",
                }}
              >
                <Text style={{ fontWeight: "600", color: statusFilter === s ? "#166534" : "inherit" }}>{s}</Text>
              </Pressable>
            ))}

            <TextInput
              placeholder="Pesquisar por tipo, descrição, ponto, criador…"
              value={search}
              onChangeText={setSearch}
              style={{
                minWidth: 280,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: "var(--border)",
                borderRadius: 10,
                backgroundColor: "var(--card)",
              }}
              placeholderTextColor={"#94a3b8"}
            />
          </View>
        </View>

        {/* Tabela */}
        <View style={{ borderWidth: 1, borderColor: "var(--border)", borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)" }}>
          {/* Cabeçalho */}
          <View style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <Text style={{ width: 64, fontWeight: "700" }}>Foto</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Tipo</Text>
            <Text style={{ width: "28%", fontWeight: "700" }}>Descrição</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Ponto</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Criado por</Text>
            <Text style={{ width: "12%", fontWeight: "700" }}>Estado</Text>
            <Text style={{ width: "20%", fontWeight: "700", textAlign: "right" }}>Ações</Text>
          </View>

          {/* Linhas */}
          {view.map((r) => {
            const disable = busyId === r.id || !canModerate;
            const nStatus = normalizeStatus(r.status);

            return (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderTopWidth: 1,
                  borderColor: "var(--border)",
                  gap: 8,
                }}
              >
                {/* Foto */}
                <View style={{ width: 64 }}>
                  {r.fotoUrl ? (
                    <Image source={{ uri: r.fotoUrl }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "var(--bg)" }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "var(--muted)", fontSize: 10 }}>sem foto</Text>
                    </View>
                  )}
                </View>

                <Text style={{ width: "16%" }}>{r.tipo || "—"}</Text>
                <Text numberOfLines={2} style={{ width: "28%" }}>{r.descricao || "—"}</Text>
                <Text style={{ width: "16%" }}>{r.pontoId || "—"}</Text>
                <Text style={{ width: "16%" }}>{r.criadoPorDisplay || r.criadoPor || "—"}</Text>
                <View style={{ width: "12%" }}>
                  <StatusBadge value={r.status} />
                </View>

                {/* Ações */}
                <View style={{ width: "20%", flexDirection: "row", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" as any }}>
                  {/* Aprovar */}
                  <Pressable
                    disabled={disable || nStatus === "Aprovado"}
                    onPress={() => setConfirmStatus({ id: r.id, to: "Aprovado" })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#bbf7d0",
                      opacity: disable || nStatus === "Aprovado" ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#065f46", fontWeight: "700" }}>
                      {busyId === r.id ? "A guardar…" : "Aprovar"}
                    </Text>
                  </Pressable>

                  {/* Rejeitar */}
                  <Pressable
                    disabled={disable || nStatus === "Rejeitado"}
                    onPress={() => setConfirmStatus({ id: r.id, to: "Rejeitado" })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca",
                      opacity: disable || nStatus === "Rejeitado" ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#991b1b", fontWeight: "700" }}>
                      {busyId === r.id ? "A guardar…" : "Rejeitar"}
                    </Text>
                  </Pressable>

                  {/* Reset para pendente */}
                  <Pressable
                    disabled={disable || nStatus === "Pendente"}
                    onPress={() => setConfirmStatus({ id: r.id, to: "Pendente" })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#ffedd5",
                      opacity: disable || nStatus === "Pendente" ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#9a3412", fontWeight: "700" }}>
                      {busyId === r.id ? "A guardar…" : "Pendente"}
                    </Text>
                  </Pressable>

                  {/* Eliminar */}
                  <Pressable
                    disabled={disable}
                    onPress={() => setConfirmDelete(r.id)}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)",
                      opacity: disable ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>
                      {busyId === r.id ? "A eliminar…" : "Eliminar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {view.length === 0 && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: "var(--muted)" }}>Sem reports para mostrar.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Modais */}
      <ConfirmDialog
        open={!!confirmStatus}
        title="Alterar estado"
        description={
          confirmStatus
            ? `Confirmas alterar o estado para "${confirmStatus.to}"?`
            : ""
        }
        confirmText="Confirmar"
        onConfirm={() => {
          if (confirmStatus) setStatus(confirmStatus.id, confirmStatus.to);
          setConfirmStatus(null);
        }}
        onClose={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar reporte"
        description="Isto remove o documento no Firestore."
        confirmText="Eliminar"
        onConfirm={() => {
          if (confirmDelete) removeReport(confirmDelete);
          setConfirmDelete(null);
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </View>
  );
}
