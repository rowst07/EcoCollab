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

type Estado = "Ativa" | "Reservada" | "Concluída";
type TipoNorm = "Doação" | "Troca" | "Outras";

type RetomaRow = {
  id: string;
  nome?: string;
  tipo?: string;
  estado?: Estado;
  fotoUrl?: string;
  criadoPor?: string;
  criadoPorDisplay?: string;
  dataCriacao?: any; // Timestamp | string
};

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
          <Link href={"/AdminScreens/users" as any} style={{ color: "var(--primary)" }}>Users</Link>
          <Link href={"/AdminScreens/reports" as any} style={{ color: "var(--primary)" }}>Reports</Link>
          <Link href={"/AdminScreens/retomas" as any} style={{ color: "var(--primary)", fontWeight: "700" }}>Retomas</Link>
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

function EstadoBadge({ value }: { value?: Estado }) {
  const map: Record<Estado, { bg: string; border: string; color: string }> = {
    Ativa:      { bg: "#ecfeff", border: "#bae6fd", color: "#0369a1" },
    Reservada:  { bg: "#fff7ed", border: "#ffedd5", color: "#9a3412" },
    Concluída:  { bg: "#ecfdf5", border: "#bbf7d0", color: "#065f46" },
  };
  const style = value ? map[value] : { bg: "var(--bg)", border: "var(--border)", color: "var(--muted)" };
  return (
    <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: style.bg, borderWidth: 1, borderColor: style.border }}>
      <Text style={{ color: style.color, fontSize: 12, fontWeight: "600" }}>{value ?? "—"}</Text>
    </View>
  );
}

export default function RetomasWebPage() {
  const { role } = useAuth(); // expõe role no AuthContext
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<RetomaRow[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<Estado | "Todas">("Todas");
  const [tipoFilter, setTipoFilter] = useState<TipoNorm | "Todas">("Todas"); // NOVO
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [confirmEstado, setConfirmEstado] = useState<{ id: string; to: Estado } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Normalização de tipo ("Doacao", "doação", etc.)
  const normalizeTipo = (raw?: string): TipoNorm => {
    const s = (raw ?? "").trim().toLowerCase();
    if (s === "doação" || s === "doacao" || s === "doacão") return "Doação";
    if (s === "troca" || s === "trocas") return "Troca";
    return "Outras";
  };

  useEffect(() => {
    const q = query(collection(db, "retomas"), orderBy("dataCriacao", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: RetomaRow[] = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          nome: x.nome ?? "",
          tipo: x.tipo ?? "",
          estado: x.estado ?? "Ativa",
          fotoUrl: x.fotoUrl ?? "",
          criadoPor: x.criadoPor ?? "",
          criadoPorDisplay: x.criadoPorDisplay ?? "",
          dataCriacao: x.dataCriacao ?? x.createdAt ?? null,
        };
      });
      setRows(arr);
    });
    return () => unsub();
  }, []);

  // Contagens por tipo (para mostrar no topo)
  const tipoCounts = useMemo(() => {
    const base = { Doação: 0, Troca: 0, Outras: 0 } as Record<TipoNorm, number>;
    for (const r of rows) base[normalizeTipo(r.tipo)]++;
    return base;
  }, [rows]);

  // Aplica filtros + pesquisa
  const view = useMemo(() => {
    let data = rows;
    if (estadoFilter !== "Todas") {
      data = data.filter((r) => r.estado === estadoFilter);
    }
    if (tipoFilter !== "Todas") {
      data = data.filter((r) => normalizeTipo(r.tipo) === tipoFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter((r) =>
        (r.nome ?? "").toLowerCase().includes(q) ||
        (r.tipo ?? "").toLowerCase().includes(q) ||
        (r.criadoPorDisplay ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, estadoFilter, tipoFilter, search]);

  async function changeEstado(id: string, to: Estado) {
    if (!isAdmin) {
      Alert.alert("Sem permissão", "Apenas administradores podem alterar o estado.");
      return;
    }
    setBusyId(id);
    try {
      await updateDoc(doc(db, "retomas", id), { estado: to });
    } catch (e) {
      console.error("changeEstado", e);
      Alert.alert("Erro", "Não foi possível alterar o estado.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeRetoma(id: string) {
    if (!isAdmin) {
      Alert.alert("Sem permissão", "Apenas administradores podem eliminar retomas.");
      return;
    }
    setBusyId(id);
    try {
      await deleteDoc(doc(db, "retomas", id));
    } catch (e) {
      console.error("delete retoma", e);
      Alert.alert("Erro", "Não foi possível eliminar.");
    } finally {
      setBusyId(null);
    }
  }

  const nextEstado = (e: Estado): Estado => {
    if (e === "Ativa") return "Reservada";
    if (e === "Reservada") return "Concluída";
    return "Ativa";
  };

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />

      <View style={{ padding: 16 }}>
        <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as any }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Retomas</Text>
            <Text style={{ color: "var(--muted)" }}>Lista e gestão de retomas</Text>
          </View>

          {/* Filtros */}
          <View style={{ gap: 8, flexDirection: "row", alignItems: "center", flexWrap: "wrap" as any }}>
            {/* Estado */}
            {(["Todas", "Ativa", "Reservada", "Concluída"] as const).map((e) => (
              <Pressable
                key={e}
                onPress={() => setEstadoFilter(e)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: estadoFilter === e ? "#eaf4ee" : "var(--bg)",
                  borderWidth: 1, borderColor: estadoFilter === e ? "#cbe7d4" : "var(--border)",
                }}
              >
                <Text style={{ fontWeight: "600", color: estadoFilter === e ? "#166534" : "inherit" }}>{e}</Text>
              </Pressable>
            ))}

            {/* Tipo */}
            {(["Todas", "Doação", "Troca", "Outras"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTipoFilter(t)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                  backgroundColor: tipoFilter === t ? "#eff6ff" : "var(--bg)",
                  borderWidth: 1, borderColor: tipoFilter === t ? "#dbeafe" : "var(--border)",
                }}
              >
                <Text style={{ fontWeight: "600", color: tipoFilter === t ? "#1d4ed8" : "inherit" }}>{t}</Text>
              </Pressable>
            ))}

            {/* Pesquisa */}
            <TextInput
              placeholder="Pesquisar por nome, tipo, criador…"
              value={search}
              onChangeText={setSearch}
              style={{
                minWidth: 260,
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

        {/* Resumo por tipo */}
        <View style={{ marginBottom: 12, gap: 8, flexDirection: "row", flexWrap: "wrap" as any }}>
          {(["Doação", "Troca", "Outras"] as const).map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                backgroundColor: t === "Doação" ? "#ecfdf5" : t === "Troca" ? "#eff6ff" : "#f1f5f9",
                borderWidth: 1,
                borderColor: t === "Doação" ? "#bbf7d0" : t === "Troca" ? "#dbeafe" : "#e2e8f0",
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {t}: {tipoCounts[t]}
              </Text>
            </View>
          ))}
        </View>

        {/* Tabela */}
        <View style={{ borderWidth: 1, borderColor: "var(--border)", borderRadius: 12, overflow: "hidden", backgroundColor: "var(--card)" }}>
          {/* Cabeçalho */}
          <View style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <Text style={{ width: 64, fontWeight: "700" }}>Foto</Text>
            <Text style={{ width: "22%", fontWeight: "700" }}>Nome</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Tipo</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Estado</Text>
            <Text style={{ width: "26%", fontWeight: "700" }}>Criado por</Text>
            <Text style={{ width: "20%", fontWeight: "700", textAlign: "right" }}>Ações</Text>
          </View>

          {/* Linhas */}
          {view.map((r) => {
            const disable = busyId === r.id || !isAdmin;
            return (
              <View key={r.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderColor: "var(--border)" }}>
                <View style={{ width: 64 }}>
                  {r.fotoUrl ? (
                    <Image source={{ uri: r.fotoUrl }} style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "var(--bg)" }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "var(--muted)", fontSize: 10 }}>sem foto</Text>
                    </View>
                  )}
                </View>

                <Text style={{ width: "22%" }}>{r.nome || "—"}</Text>
                <Text style={{ width: "16%" }}>{normalizeTipo(r.tipo)}</Text>
                <View style={{ width: "16%" }}>
                  <EstadoBadge value={r.estado as Estado} />
                </View>
                <Text style={{ width: "26%" }}>{r.criadoPorDisplay || r.criadoPor || "—"}</Text>

                <View style={{ width: "20%", flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                  <Pressable
                    disabled={disable}
                    onPress={() => setConfirmEstado({ id: r.id, to: nextEstado((r.estado as Estado) || "Ativa") })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#dbeafe",
                      opacity: disable ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#1d4ed8", fontWeight: "600" }}>
                      {busyId === r.id ? "A guardar…" : `Mudar p/ ${nextEstado((r.estado as Estado) || "Ativa")}`}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={disable}
                    onPress={() => setConfirmDelete(r.id)}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)",
                      opacity: disable ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>{busyId === r.id ? "A eliminar…" : "Eliminar"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {view.length === 0 && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: "var(--muted)" }}>Sem retomas para mostrar.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Modais */}
      <ConfirmDialog
        open={!!confirmEstado}
        title="Alterar estado"
        description={
          confirmEstado
            ? `Confirmas mudar para "${confirmEstado.to}"?`
            : ""
        }
        confirmText="Confirmar"
        onConfirm={() => {
          if (confirmEstado) changeEstado(confirmEstado.id, confirmEstado.to);
          setConfirmEstado(null);
        }}
        onClose={() => setConfirmEstado(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar retoma"
        description="Isto remove o documento no Firestore. (Se houver ficheiros no Storage, não são removidos aqui.)"
        confirmText="Eliminar"
        onConfirm={() => {
          if (confirmDelete) removeRetoma(confirmDelete);
          setConfirmDelete(null);
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </View>
  );
}
