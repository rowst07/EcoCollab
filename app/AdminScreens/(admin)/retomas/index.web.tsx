// app/AdminScreens/retomas/index.web.tsx
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
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../../../../services/AuthContext";

/* ---------- Tipos ---------- */
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
  dataCriacao?: any; // Timestamp | string | Date
};

/* ---------- Navbar ---------- */
function Navbar() {
  const { user, logout } = useAuth();
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
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
          <Link href={"/AdminScreens" as any} style={{ color: "var(--primary)" }}>
            Dashboard
          </Link>
          <Link href={"/AdminScreens/users" as any} style={{ color: "var(--primary)" }}>
            Users
          </Link>
          <Link href={"/AdminScreens/reports" as any} style={{ color: "var(--primary)" }}>
            Reports
          </Link>
          <Link
            href={"/AdminScreens/retomas" as any}
            style={{ color: "var(--primary)", fontWeight: "700" }}
          >
            Retomas
          </Link>

          {user && (
            <Pressable
              onPress={logout}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: "#eaf4ee",
              }}
            >
              <Text style={{ color: "#166534", fontWeight: "600" }}>Sair</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------- UI helpers / utils ---------- */
function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "white",
          color: "#111",
          outline: "none",
          fontSize: 14,
          width: 220,
        }}
      />
    </View>
  );
}

function Button({
  children,
  variant = "primary",
  onPress,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  onPress?: () => void;
}) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isGhost ? styles.buttonGhost : styles.buttonPrimary,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={isGhost ? styles.buttonGhostText : styles.buttonPrimaryText}>
        {children}
      </Text>
    </Pressable>
  );
}

function toDateOnly(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (typeof ts === "string") return new Date(ts);
  if (ts instanceof Date) return ts;
  return null;
}

function formatDateISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- Chart com tooltip (hover via Pressable) ---------- */
type BarPoint = { x: string; y: number };
function BarsChart({
  fromISO,
  toISO,
  raw,
}: {
  fromISO: string;
  toISO: string;
  raw: Array<{ xISO: string; y: number }>;
}) {
  const series: BarPoint[] = useMemo(() => {
    const start = new Date(fromISO + "T00:00:00");
    const end = new Date(toISO + "T00:00:00");
    const map = new Map<string, number>();
    raw.forEach(({ xISO, y }) => map.set(xISO, (map.get(xISO) ?? 0) + y));
    const out: BarPoint[] = [];
    const d = new Date(start);
    while (d <= end) {
      const iso = formatDateISO(d);
      out.push({ x: iso, y: map.get(iso) ?? 0 });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [fromISO, toISO, raw]);

  const max = Math.max(1, ...series.map((s) => s.y));
  const ticks = [0, Math.round(max / 2), max];

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const hovered = hoverIdx !== null ? series[hoverIdx] : null;
  const tooltipLeftPct =
    hoverIdx === null || series.length === 0 ? 0 : ((hoverIdx + 0.5) / series.length) * 100;

  return (
    <View style={[styles.chartCard, { position: "relative" }]}>
      <View style={styles.yAxis}>
        {ticks.slice().reverse().map((t) => (
          <View key={t} style={styles.yTickRow}>
            <Text style={styles.yTickLabel}>{t}</Text>
            <View style={styles.yGridLine} />
          </View>
        ))}
      </View>

      <View style={[styles.barsWrap, { position: "relative" }]}>
        {/* Tooltip */}
        {hovered && (
          <View
            style={{
              position: "absolute" as const,
              left: `${tooltipLeftPct}%`,
              top: 0,
              transform: [{ translateX: -50 }],
              alignItems: "center",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: "rgba(17,24,39,0.92)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>{hovered.x}</Text>
              <Text style={{ color: "#fff", fontSize: 12 }}>
                {hovered.y} retoma{hovered.y === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={{ width: 1, height: 10, backgroundColor: "rgba(17,24,39,0.4)" }} />
          </View>
        )}

        {/* Barras */}
        {series.map((p, i) => {
          const hPct = (p.y / max) * 100;
          const label = p.x.slice(5);
          const minPx = p.y > 0 ? 8 : 0;
          const active = hoverIdx === i;

          return (
            <Pressable
              key={p.x}
              onHoverIn={() => setHoverIdx(i)}
              onHoverOut={() => setHoverIdx((idx) => (idx === i ? null : idx))}
              style={[styles.barCol, { position: "relative" }]}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: `${hPct}%`,
                    minHeight: minPx,
                    backgroundColor: active ? "#0f62fe33" : "#0f62fe22",
                    borderColor: active ? "#0f62fe88" : "#0f62fe55",
                  },
                ]}
              />
              <Text style={styles.xTick}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}


/* ---------- Página ---------- */
export default function RetomasWebPage() {
  const { role } = useAuth() as { role?: string };
  const isAdmin = role === "admin";

  // datas
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);
  const [fromDate, setFromDate] = useState<string>(formatDateISO(thirtyDaysAgo));
  const [toDate, setToDate] = useState<string>(formatDateISO(today));

  const [rows, setRows] = useState<RetomaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [estadoFilter, setEstadoFilter] = useState<Estado | "Todas">("Todas");
  const [tipoFilter, setTipoFilter] = useState<TipoNorm | "Todas">("Todas");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [confirmEstado, setConfirmEstado] = useState<{ id: string; to: Estado } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const normalizeTipo = (raw?: string): TipoNorm => {
    const s = (raw ?? "").trim().toLowerCase();
    if (s === "doação" || s === "doacao" || s === "doacão") return "Doação";
    if (s === "troca" || s === "trocas") return "Troca";
    return "Outras";
  };

  useEffect(() => {
    const qy = query(collection(db, "retomas"), orderBy("dataCriacao", "desc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
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
        setLoading(false);
      },
      (err) => {
        console.error("retomas onSnapshot error", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // filtros por data
  const filteredByDate = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;
    return rows.filter((r) => {
      const d = toDateOnly(r.dataCriacao);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, fromDate, toDate]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredByDate.length;
    const ativas = filteredByDate.filter((r) => r.estado === "Ativa").length;
    const reservadas = filteredByDate.filter((r) => r.estado === "Reservada").length;
    const concluidas = filteredByDate.filter((r) => r.estado === "Concluída").length;
    return { total, ativas, reservadas, concluidas };
  }, [filteredByDate]);

  // série diária (retomas criadas por dia)
  const dailyRaw = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredByDate) {
      const d = toDateOnly(r.dataCriacao);
      if (!d) continue;
      const iso = formatDateISO(d);
      map.set(iso, (map.get(iso) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([xISO, y]) => ({ xISO, y }));
  }, [filteredByDate]);

  // contagens por tipo (chips)
  const tipoCounts = useMemo(() => {
    const base = { Doação: 0, Troca: 0, Outras: 0 } as Record<TipoNorm, number>;
    for (const r of filteredByDate) base[normalizeTipo(r.tipo)]++;
    return base;
  }, [filteredByDate]);

  // aplica filtros + pesquisa
  const view = useMemo(() => {
    let data = filteredByDate;
    if (estadoFilter !== "Todas") data = data.filter((r) => r.estado === estadoFilter);
    if (tipoFilter !== "Todas") data = data.filter((r) => normalizeTipo(r.tipo) === tipoFilter);
    const q = search.trim().toLowerCase();
    if (q)
      data = data.filter(
        (r) =>
          (r.nome ?? "").toLowerCase().includes(q) ||
          (r.tipo ?? "").toLowerCase().includes(q) ||
          (r.criadoPorDisplay ?? "").toLowerCase().includes(q)
      );
    return data;
  }, [filteredByDate, estadoFilter, tipoFilter, search]);

  // ações
  async function changeEstado(id: string, to: Estado) {
    if (!isAdmin) {
      alert("Sem permissão: apenas administradores podem alterar o estado.");
      return;
    }
    setBusyId(id);
    try {
      await updateDoc(doc(db, "retomas", id), { estado: to });
    } catch (e) {
      console.error("changeEstado", e);
      alert("Erro: não foi possível alterar o estado.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeRetoma(id: string) {
    if (!isAdmin) {
      alert("Sem permissão: apenas administradores podem eliminar retomas.");
      return;
    }
    setBusyId(id);
    try {
      await deleteDoc(doc(db, "retomas", id));
    } catch (e) {
      console.error("delete retoma", e);
      alert("Erro: não foi possível eliminar.");
    } finally {
      setBusyId(null);
    }
  }

  const nextEstado = (e: Estado): Estado =>
    e === "Ativa" ? "Reservada" : e === "Reservada" ? "Concluída" : "Ativa";

  // export CSV
  const handleExport = () => {
    const rowsCsv: string[][] = [
      ["ID", "Nome", "Tipo", "Estado", "Criado por", "Criado por (display)", "Data criação (ISO)"],
    ];
    view.forEach((r) => {
      const d = toDateOnly(r.dataCriacao);
      rowsCsv.push([
        r.id,
        r.nome ?? "",
        r.tipo ?? "",
        r.estado ?? "",
        r.criadoPor ?? "",
        r.criadoPorDisplay ?? "",
        d ? d.toISOString() : "",
      ]);
    });
    downloadCSV(`ecocollab_retomas_${fromDate}_a_${toDate}.csv`, rowsCsv);
  };

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View
          style={{
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap" as any,
          }}
        >
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Retomas</Text>
            <Text style={{ color: "var(--muted)" }}>Lista e gestão de retomas</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              variant="ghost"
              onPress={() => {
                setFromDate(formatDateISO(thirtyDaysAgo));
                setToDate(formatDateISO(today));
              }}
            >
              Últimos 30 dias
            </Button>
            <Button onPress={handleExport}>Export CSV</Button>
          </View>
        </View>

        {/* Filtros (datas) */}
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            alignItems: "flex-end",
            flexWrap: "wrap" as any,
          }}
        >
          <DateInput label="De" value={fromDate} onChange={setFromDate} />
          <DateInput label="Até" value={toDate} onChange={setToDate} />
        </View>

        {/* KPIs */}
        <View style={{ marginTop: 12, flexDirection: "row", gap: 16, flexWrap: "wrap" as any }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Retomas (período)</Text>
            <Text style={styles.cardValue}>{kpis.total}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ativas</Text>
            <Text style={styles.cardValue}>{kpis.ativas}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reservadas</Text>
            <Text style={styles.cardValue}>{kpis.reservadas}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Concluídas</Text>
            <Text style={styles.cardValue}>{kpis.concluidas}</Text>
          </View>
        </View>

        {/* Gráfico */}
        <View style={styles.cardFull}>
          <Text style={styles.cardTitle}>Retomas criadas por dia</Text>
          {loading ? (
            <Text style={{ marginTop: 12 }}>A carregar…</Text>
          ) : (
            <BarsChart fromISO={fromDate} toISO={toDate} raw={dailyRaw} />
          )}
        </View>

        {/* Filtros rápidos + pesquisa */}
        <View
          style={{
            marginBottom: 12,
            gap: 8,
            flexDirection: "row",
            flexWrap: "wrap" as any,
            alignItems: "center",
          }}
        >
          {/* chips de estado */}
          {(["Todas", "Ativa", "Reservada", "Concluída"] as const).map((e) => (
            <Pressable
              key={e}
              onPress={() => setEstadoFilter(e)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: estadoFilter === e ? "#eaf4ee" : "var(--bg)",
                borderWidth: 1,
                borderColor: estadoFilter === e ? "#cbe7d4" : "var(--border)",
              }}
            >
              <Text style={{ fontWeight: "600", color: estadoFilter === e ? "#166534" : "inherit" }}>
                {e}
              </Text>
            </Pressable>
          ))}

          {/* chips de tipo */}
          {(["Todas", "Doação", "Troca", "Outras"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipoFilter(t)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: tipoFilter === t ? "#eff6ff" : "var(--bg)",
                borderWidth: 1,
                borderColor: tipoFilter === t ? "#dbeafe" : "var(--border)",
              }}
            >
              <Text style={{ fontWeight: "600", color: tipoFilter === t ? "#1d4ed8" : "inherit" }}>
                {t}
              </Text>
            </Pressable>
          ))}

          {/* contagens por tipo */}
          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap" as any,
            }}
          >
            {(["Doação", "Troca", "Outras"] as const).map((t) => (
              <View
                key={t}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <Text style={{ fontWeight: "700" }}>
                  {t}: {tipoCounts[t]}
                </Text>
              </View>
            ))}
          </View>

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

        {/* Tabela */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "var(--card)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
            }}
          >
            <Text style={{ width: 64, fontWeight: "700" }}>Foto</Text>
            <Text style={{ width: "22%", fontWeight: "700" }}>Nome</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Tipo</Text>
            <Text style={{ width: "16%", fontWeight: "700" }}>Estado</Text>
            <Text style={{ width: "26%", fontWeight: "700" }}>Criado por</Text>
            <Text style={{ width: "20%", fontWeight: "700", textAlign: "right" }}>Ações</Text>
          </View>

          {view.map((r) => {
            const disable = busyId === r.id || !isAdmin;
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
                }}
              >
                <View style={{ width: 64 }}>
                  {r.fotoUrl ? (
                    <Image
                      source={{ uri: r.fotoUrl }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: "var(--bg)",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: "var(--bg)",
                        borderWidth: 1,
                        borderColor: "var(--border)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "var(--muted)", fontSize: 10 }}>sem foto</Text>
                    </View>
                  )}
                </View>

                <Text style={{ width: "22%" }}>{r.nome || "—"}</Text>
                <Text style={{ width: "16%" }}>{normalizeTipo(r.tipo)}</Text>

                <View style={{ width: "16%" }}>
                  <View
                    style={[
                      styles.badge,
                      r.estado === "Concluída"
                        ? styles.badgeSuccess
                        : r.estado === "Reservada"
                        ? styles.badgeWarn
                        : styles.badgeInfo,
                    ]}
                  >
                    <Text style={styles.badgeTxt}>{r.estado ?? "—"}</Text>
                  </View>
                </View>

                <Text style={{ width: "26%" }}>{r.criadoPorDisplay || r.criadoPor || "—"}</Text>

                <View
                  style={{
                    width: "20%",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Pressable
                    disabled={disable}
                    onPress={() =>
                      setConfirmEstado({
                        id: r.id,
                        to: nextEstado((r.estado as Estado) || "Ativa"),
                      })
                    }
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: "#eff6ff",
                      borderWidth: 1,
                      borderColor: "#dbeafe",
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
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: "var(--bg)",
                      borderWidth: 1,
                      borderColor: "var(--border)",
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
              <Text style={{ color: "var(--muted)" }}>Sem retomas para mostrar.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modais */}
      <ConfirmDialog
        open={!!confirmEstado}
        title="Alterar estado"
        description={confirmEstado ? `Confirmas mudar para "${confirmEstado.to}"?` : ""}
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

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", opacity: 0.8 },

  // cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    minWidth: 220,
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)" as any,
  },
  cardFull: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)" as any,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.9,
  },
  cardValue: { fontSize: 28, fontWeight: "900" },

  // buttons
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  buttonPrimary: { backgroundColor: "#0f62fe" },
  buttonPrimaryText: { color: "white", fontWeight: "800" },
  buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#e5e7eb" },
  buttonGhostText: { color: "#111", fontWeight: "800" },

  // chart
  chartCard: {
    height: 280,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    paddingTop: 4,
    marginTop: 12,
  },
  yAxis: { width: 44, paddingTop: 8, paddingBottom: 16 },
  yTickRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  yTickLabel: { width: 20, textAlign: "right", fontSize: 11, opacity: 0.7 },
  yGridLine: { height: 1, backgroundColor: "#e5e7eb", flex: 1 },
  barsWrap: {
    flex: 1,
    height: "100%",
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderLeftWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  barCol: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#0f62fe22",
    borderWidth: 1,
    borderColor: "#0f62fe55",
    transitionDuration: "120ms" as any,
  },
  xTick: { marginTop: 6, fontSize: 10, opacity: 0.8 },

  // badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  badgeInfo: { backgroundColor: "#eff6ff", borderColor: "#dbeafe" },
  badgeWarn: { backgroundColor: "#fff7ed", borderColor: "#ffedd5" },
  badgeSuccess: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  badgeTxt: { fontSize: 12, fontWeight: "800" },
});
