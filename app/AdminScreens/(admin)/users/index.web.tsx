// app/AdminScreens/users/index.web.tsx
import { db } from "@/firebase";
import { useAuth } from "@/services/AuthContext";
import { setUserRole, toggleUserDisabled } from "@/services/functions";
import { Link } from "expo-router";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
} from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/* ---------- Tipos ---------- */
type UserRow = {
  id: string;
  email?: string;
  displayName?: string;
  role?: "admin" | "moderator" | "user" | string;
  disabled?: boolean;
  createdAt?: any; // Timestamp | string | Date | number | {seconds:number}
};

/* ---------- Navbar ---------- */
function Navbar() {
  const { user, logout } = useAuth() as any;
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
          <Link href={"/AdminScreens/users" as any} style={{ color: "var(--primary)", fontWeight: "700" }}>Users</Link>
          <Link href={"/AdminScreens/reports" as any} style={{ color: "var(--primary)" }}>Reports</Link>
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

/* ---------- UI helpers ---------- */
function DateInput({
  label,
  value,
  onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
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

/* ---------- Utils (datas robustas) ---------- */
function toDateOnly(ts: any): Date | null {
  if (!ts && ts !== 0) return null;
  if (typeof ts?.toDate === "function") return ts.toDate(); // Firestore Timestamp
  if (typeof ts === "object" && ts && typeof ts.seconds === "number")
    return new Date(ts.seconds * 1000);
  if (typeof ts === "number") return new Date(ts > 1e12 ? ts : ts * 1000);
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

/* ---------- Gráfico barras com tooltip (hover via Pressable) ---------- */
type BarPoint = { x: string; y: number }; // x = "YYYY-MM-DD"
function BarsChart({
  fromISO,
  toISO,
  raw,
}: {
  fromISO: string;
  toISO: string;
  raw: Array<{ xISO: string; y: number }>;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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
            <View style={styles.tooltipBubble}>
              <Text style={styles.tooltipTitle}>{hovered.x}</Text>
              <Text style={styles.tooltipValue}>
                {hovered.y} utilizador{hovered.y === 1 ? "" : "es"}
              </Text>
            </View>
            <View style={styles.tooltipStem} />
          </View>
        )}

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
export default function UsersPage() {
  const { loading: authLoading, role } = useAuth() as { loading?: boolean; role?: string };
  const isAdmin = role === "admin";

  // datas e controlos
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);
  const [fromDate, setFromDate] = useState<string>(formatDateISO(thirtyDaysAgo));
  const [toDate, setToDate] = useState<string>(formatDateISO(today));

  // dados
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  // map docs -> linhas (PRIORIDADE: dataCriacao)
  const mapSnap = (snap: any): UserRow[] => {
    const list: UserRow[] = [];
    snap.forEach((doc: any) => {
      const d = doc.data() as any;
      const email = d?.email ?? "";
      const fallbackFromEmail = email.includes("@") ? email.split("@")[0] : "";

      const createdRaw =
        d?.dataCriacao ?? // <—— o teu campo
        d?.createdAt ??
        d?.created_at ??
        d?.created ??
        d?.signupAt ??
        d?.registeredAt ??
        d?.createdOn ??
        d?.metadata?.creationTime ??
        d?.userMetadata?.creationTime ??
        d?.dataAtualizacao ?? // último recurso
        null;

      list.push({
        id: doc.id,
        email,
        displayName:
          d?.displayName || d?.name || d?.fullName || fallbackFromEmail || "-",
        role: d?.role ?? "user",
        disabled: !!d?.disabled,
        createdAt: createdRaw,
      });
    });
    return list;
  };

  useEffect(() => {
    if (authLoading) return;

    // 1) ordenar por dataCriacao
    const qA = query(
      collection(db, "users"),
      orderBy("dataCriacao", "desc"),
      limit(500)
    );
    unsubRef.current = onSnapshot(
      qA,
      (snapA) => {
        let list = mapSnap(snapA);
        if (list.length > 0) {
          setRows(list);
          setLoading(false);
          return;
        }
        // 2) fallback: orderBy createdAt
        const qB = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(500)
        );
        unsubRef.current?.();
        unsubRef.current = onSnapshot(
          qB,
          (snapB) => {
            list = mapSnap(snapB);
            if (list.length > 0) {
              setRows(list);
              setLoading(false);
              return;
            }
            // 3) sem orderBy
            const qC = query(collection(db, "users"), limit(500));
            unsubRef.current?.();
            unsubRef.current = onSnapshot(
              qC,
              (snapC) => {
                setRows(mapSnap(snapC));
                setLoading(false);
              },
              () => setLoading(false)
            );
          },
          () => setLoading(false)
        );
      },
      () => {
        // se falhar logo o qA (por falta de índice), tentamos os fallbacks
        const qB = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(500)
        );
        unsubRef.current = onSnapshot(
          qB,
          (snapB) => {
            const list = mapSnap(snapB);
            if (list.length > 0) {
              setRows(list);
              setLoading(false);
              return;
            }
            const qC = query(collection(db, "users"), limit(500));
            unsubRef.current = onSnapshot(
              qC,
              (snapC) => {
                setRows(mapSnap(snapC));
                setLoading(false);
              },
              () => setLoading(false)
            );
          },
          () => setLoading(false)
        );
      }
    );

    return () => {
      unsubRef.current?.();
    };
  }, [authLoading]);

  // Lista filtrada por período (inclui SEM data)
  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    return rows.filter((r) => {
      const d = toDateOnly(r.createdAt);
      if (!d) return true; // se não houver data, mantemos
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, fromDate, toDate]);

  // KPIs (com fallback)
  const kpis = useMemo(() => {
    const withDate = filtered.filter((r) => !!toDateOnly(r.createdAt));
    if (withDate.length === 0) {
      return {
        totalPeriodo: filtered.length,
        desativados: filtered.filter((r) => r.disabled).length,
        novosNoUltimoDia: 0,
      };
    }
    const totalPeriodo = withDate.length;
    const desativados = withDate.filter((r) => r.disabled).length;
    const refISO = formatDateISO(new Date(toDate + "T00:00:00"));
    const novosNoUltimoDia = withDate.filter((r) => {
      const d = toDateOnly(r.createdAt);
      return d && formatDateISO(d) === refISO;
    }).length;
    return { totalPeriodo, desativados, novosNoUltimoDia };
  }, [filtered, toDate]);

  // Gráfico diário (com fallback 1 barra)
  const dailyRaw = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const d = toDateOnly(r.createdAt);
      if (!d) continue;
      const iso = formatDateISO(d);
      map.set(iso, (map.get(iso) ?? 0) + 1);
    }
    const arr = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([xISO, y]) => ({ xISO, y }));
    if (arr.length === 0 && filtered.length > 0)
      return [{ xISO: toDate, y: filtered.length }];
    return arr;
  }, [filtered, toDate]);

  // export CSV
  const handleExport = () => {
    const rowsCsv: string[][] = [
      ["UID", "Nome", "Email", "Role", "Estado", "Criado em (ISO)"],
    ];
    filtered.forEach((u) => {
      const d = toDateOnly(u.createdAt);
      rowsCsv.push([
        u.id,
        u.displayName ?? "",
        u.email ?? "",
        String(u.role ?? "user"),
        u.disabled ? "Desativado" : "Ativo",
        d ? d.toISOString() : "",
      ]);
    });
    downloadCSV(`ecocollab_users_${fromDate}_a_${toDate}.csv`, rowsCsv);
  };

  // ações (proteção opcional por admin)
  const onToggle = async (u: UserRow) => {
    if (!isAdmin) {
      alert("Sem permissão: apenas administradores podem ativar/desativar utilizadores.");
      return;
    }
    try {
      setBusyId(u.id);
      await toggleUserDisabled(u.id, !u.disabled);
      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, disabled: !u.disabled } : x))
      );
    } catch (e: any) {
      console.error("toggleUserDisabled failed", e);
      alert(`Falha ao atualizar o estado.\n${e.message || e}`);
    } finally {
      setBusyId(null);
    }
  };
  const onRoleSelect = async (u: UserRow, value: string) => {
    if (!isAdmin) {
      alert("Sem permissão: apenas administradores podem alterar o papel.");
      return;
    }
    try {
      setBusyId(u.id);
      await setUserRole(u.id, value);
      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: value } : x))
      );
    } catch (e: any) {
      console.error("setUserRole failed", e);
      alert(`Falha ao atualizar o papel.\n${e.message || e}`);
    } finally {
      setBusyId(null);
    }
  };

  const total = rows.length;
  const disabledCount = useMemo(
    () => rows.filter((r) => r.disabled).length,
    [rows]
  );

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap" as any,
            rowGap: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Utilizadores</Text>
            <Text style={{ color: "var(--muted)" }}>
              Total (todos): {total} — Desativados (todos): {disabledCount}
            </Text>
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

        {/* Filtros */}
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            alignItems: "flex-end",
            flexWrap: "wrap" as any,
            marginBottom: 12,
          }}
        >
          <DateInput label="De" value={fromDate} onChange={setFromDate} />
          <DateInput label="Até" value={toDate} onChange={setToDate} />

          {/* Pesquisa por nome/email */}
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Pesquisar</Text>
            <TextInput
              placeholder="Nome ou email…"
              onChangeText={() => {}}
              style={{
                width: 260,
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

        {/* KPIs */}
        <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" as any }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novos (período)</Text>
            <Text style={styles.cardValue}>{kpis.totalPeriodo}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Novos no último dia</Text>
            <Text style={styles.cardValue}>{kpis.novosNoUltimoDia}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Desativados (período)</Text>
            <Text style={styles.cardValue}>{kpis.desativados}</Text>
          </View>
        </View>

        {/* Gráfico */}
        <View style={styles.cardFull}>
          <Text style={styles.cardTitle}>Novos utilizadores por dia</Text>
          {loading ? (
            <Text style={{ marginTop: 12 }}>A carregar…</Text>
          ) : (
            <BarsChart fromISO={fromDate} toISO={toDate} raw={dailyRaw} />
          )}
        </View>

        {/* Tabela */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "var(--card)",
            marginTop: 12,
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
            <Text style={{ flex: 2, fontWeight: "700" }}>Nome</Text>
            <Text style={{ flex: 2, fontWeight: "700" }}>Email</Text>
            <Text style={{ flex: 1, fontWeight: "700" }}>Papel</Text>
            <Text style={{ flex: 1, fontWeight: "700" }}>Estado</Text>
            <Text style={{ flex: 2, fontWeight: "700", textAlign: "right" }}>
              Ações
            </Text>
          </View>

          {loading ? (
            <View style={{ padding: 16 }}>
              <ActivityIndicator />
            </View>
          ) : filtered.length === 0 ? (
            <Text style={{ padding: 16 }}>Sem utilizadores.</Text>
          ) : (
            filtered.map((u) => {
              const disableActions = !isAdmin || busyId === u.id;
              return (
                <View
                  key={u.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderTopWidth: 1,
                    borderColor: "var(--border)",
                    gap: 6,
                  }}
                >
                  <Text
                    style={{ flex: 2 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {u.displayName || "-"}
                  </Text>
                  <Text
                    style={{ flex: 2 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {u.email || "-"}
                  </Text>

                  <View style={{ flex: 1 }}>
                    <View style={[styles.badge, styles.badgeNeutral]}>
                      <Text style={styles.badgeTxt}>
                        {(u.role || "user").toString()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.badge,
                        u.disabled ? styles.badgeDanger : styles.badgeSuccess,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeTxt,
                          { color: u.disabled ? "#991b1b" : "#166534" },
                        ]}
                      >
                        {u.disabled ? "Desativado" : "Ativo"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flex: 2,
                      alignItems: "flex-end",
                      gap: 8,
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* select (HTML) */}
                    <select
                      value={String(u.role || "user")}
                      onChange={(e) => onRoleSelect(u, e.target.value)}
                      disabled={disableActions}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "inherit",
                        outline: "none",
                        minWidth: 140,
                      }}
                    >
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>

                    <Pressable
                      disabled={disableActions}
                      onPress={() => onToggle(u)}
                      style={({ pressed }) => [
                        styles.btn,
                        u.disabled ? styles.btnEnable : styles.btnDisable,
                        pressed && { opacity: 0.9 },
                        disableActions && { opacity: 0.6 },
                      ]}
                    >
                      {busyId === u.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnTxt}>
                          {u.disabled ? "Ativar" : "Desativar"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
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
    position: "relative", // para o tooltip absoluto
  },
  barCol: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
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

  // Tooltip
  tooltipBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(17,24,39,0.92)", // quase preto
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tooltipTitle: { color: "#fff", fontSize: 12, fontWeight: "800" },
  tooltipValue: { color: "#fff", fontSize: 12 },
  tooltipStem: { width: 1, height: 10, backgroundColor: "rgba(17,24,39,0.4)" },

  // tabela
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingBottom: 8, marginTop: 12 },
  th: { fontSize: 12, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#f3f4f6", minHeight: 54 },
  td: { paddingVertical: 12, paddingHorizontal: 6, fontSize: 14 },

  // badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  badgeNeutral: { backgroundColor: "white", borderColor: "#e5e7eb" },
  badgeSuccess: { backgroundColor: "#eaf4ee", borderColor: "#cbe7d4" },
  badgeDanger: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  badgeTxt: { fontSize: 12, fontWeight: "800" },

  // ações
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnDisable: { backgroundColor: "#991b1b" },
  btnEnable: { backgroundColor: "#166534" },
  btnTxt: { color: "white", fontWeight: "800" },
});
