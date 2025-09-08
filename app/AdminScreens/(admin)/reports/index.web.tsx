import { db } from "@/firebase";
import { useAuth } from "@/services/AuthContext";
import { Link } from "expo-router";
import {
  collection,
  doc,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ---------- Navbar ---------- */
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
            <Pressable onPress={logout} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#eaf4ee" }}>
              <Text style={{ color: "#166534", fontWeight: "600" }}>Sair</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------- Tipos (coleção: reportes) ---------- */
const STATUS_OPTIONS = ["aprovado", "pendente", "reprovado"] as const;
type ReportStatus = typeof STATUS_OPTIONS[number];

type ReportRow = {
  id: string;
  descricao?: string;
  tipo?: string;
  status?: ReportStatus | string;
  criadoPor?: string;
  criadoPorDisplay?: string;
  dataCriacao?: any; // Timestamp | string | Date

  // 🧠 IA
  aiSugestaoTipo?: string | null;
  aiConfidence?: number | null;
};

// ---- Settings ----
const PAGE_SIZE = 25;
type SortField = "dataCriacao" | "descricao" | "tipo" | "status" | "criadoPorDisplay" | "aiConfidence";
type SortDir = "asc" | "desc";

/* ---------- UI helpers ---------- */
function Card({ title, value, subtle }: { title: string; value: string | number; subtle?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {subtle ? <Text style={styles.cardSubtle}>{subtle}</Text> : null}
    </View>
  );
}
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", background: "white", color: "#111", outline: "none", fontSize: 14, width: 220 }}
      />
    </View>
  );
}
function Button({ children, variant = "primary", onPress }: { children: React.ReactNode; variant?: "primary" | "ghost"; onPress?: () => void }) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, isGhost ? styles.buttonGhost : styles.buttonPrimary, pressed && { opacity: 0.85 }]}
    >
      <Text style={isGhost ? styles.buttonGhostText : styles.buttonPrimaryText}>{children}</Text>
    </Pressable>
  );
}

/* ---------- Gráfico de barras ---------- */
type BarPoint = { x: string; y: number }; // x = "YYYY-MM-DD"
function BarsChart({ fromISO, toISO, raw }: { fromISO: string; toISO: string; raw: Array<{ xISO: string; y: number }> }) {
  const [hoverX, setHoverX] = React.useState<string | null>(null);

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

  return (
    <View style={styles.chartCard}>
      <View style={styles.yAxis}>
        {ticks.slice().reverse().map((t) => (
          <View key={t} style={styles.yTickRow}>
            <Text style={styles.yTickLabel}>{t}</Text>
            <View style={styles.yGridLine} />
          </View>
        ))}
      </View>

      <View style={styles.barsWrap}>
        {series.map((p) => {
          const hPct = (p.y / max) * 100;
          const label = p.x.slice(5);
          const minPx = p.y > 0 ? 8 : 0;
          const isHover = hoverX === p.x;

          return (
            <Pressable
              key={p.x}
              onHoverIn={() => setHoverX(p.x)}
              onHoverOut={() => setHoverX((cur) => (cur === p.x ? null : cur))}
              style={styles.barCol}
            >
              {isHover && (
                <View style={[styles.tooltipWrap, { bottom: `${hPct}%` }]}>
                  <View style={styles.tooltipBubble}>
                    <Text style={styles.tooltipText}>{p.x} · {p.y}</Text>
                  </View>
                </View>
              )}
              <View style={[styles.bar, { height: `${hPct}%`, minHeight: minPx }]} />
              <Text style={styles.xTick}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Utils ---------- */
function toDateOnly(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts?.toDate === "function") return ts.toDate(); // Firestore Timestamp
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
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.setAttribute("download", filename);
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ---------- Página ---------- */
export default function Reports() {
  const { userRole } = useAuth() as any;

  // datas
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; }, []);
  const [fromDate, setFromDate] = useState<string>(formatDateISO(thirtyDaysAgo));
  const [toDate, setToDate] = useState<string>(formatDateISO(today));

  // dados/paginação
  const [items, setItems] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [endReached, setEndReached] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // ordenação
  const [sortField, setSortField] = useState<SortField>("dataCriacao");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // filtros IA
  const [onlyWithAI, setOnlyWithAI] = useState<boolean>(false);
  const [minConf, setMinConf] = useState<number>(0); // 0..1

  const mapDoc = (docSnap: any): ReportRow => {
    const d = docSnap.data() as any;
    return {
      id: docSnap.id,
      descricao: d?.descricao ?? "",
      tipo: d?.tipo ?? "",
      status: d?.status ?? "",
      criadoPor: d?.criadoPor ?? "",
      criadoPorDisplay: d?.criadoPorDisplay ?? "",
      dataCriacao: d?.dataCriacao ?? null,
      aiSugestaoTipo: d?.aiSugestaoTipo ?? null,
      aiConfidence: d?.aiConfidence ?? null,
    };
  };

  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    setEndReached(false);
    lastDocRef.current = null;

    const tryOrderField = async (field: string) => {
      const qy = query(
        collection(db, "reportes"),
        orderBy(field as any, sortDir),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(qy);
      const arr: ReportRow[] = [];
      snap.forEach((doc) => arr.push(mapDoc(doc)));
      setItems(arr);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setEndReached(snap.size < PAGE_SIZE);
    };

    try {
      await tryOrderField(sortField);
    } catch (e) {
      console.warn("[reportes] orderBy fallback para dataCriacao:", e);
      try {
        await tryOrderField("dataCriacao");
        setSortField("dataCriacao");
        setSortDir("desc");
      } catch (e2) {
        console.error("fetchFirstPage error", e2);
        setItems([]);
        setEndReached(true);
      }
    } finally {
      setLoading(false);
    }
  }, [sortField, sortDir]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore || endReached || !lastDocRef.current) return;
    setLoadingMore(true);

    const tryOrderField = async (field: string) => {
      const qy = query(
        collection(db, "reportes"),
        orderBy(field as any, sortDir),
        startAfter(lastDocRef.current as any),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(qy);
      const more: ReportRow[] = [];
      snap.forEach((doc) => more.push(mapDoc(doc)));
      setItems((prev) => [...prev, ...more]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? lastDocRef.current;
      if (snap.size < PAGE_SIZE) setEndReached(true);
    };

    try {
      await tryOrderField(sortField);
    } catch (e) {
      console.warn("[reportes] orderBy fallback (next) para dataCriacao:", e);
      try {
        await tryOrderField("dataCriacao");
      } catch (e2) {
        console.error("fetchNextPage error", e2);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, endReached, sortField, sortDir]);

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  // infinite scroll
  const onScroll = useCallback(
    (e: any) => {
      const { contentSize, layoutMeasurement, contentOffset } = e.nativeEvent;
      const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromBottom < 400) fetchNextPage();
    },
    [fetchNextPage]
  );

  // filtros por data + IA
  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;
    return items.filter((r) => {
      // datas
      const d = toDateOnly(r.dataCriacao);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      // IA
      if (onlyWithAI && !r.aiSugestaoTipo) return false;
      if (minConf > 0 && (r.aiConfidence ?? 0) < minConf) return false;
      return true;
    });
  }, [items, fromDate, toDate, onlyWithAI, minConf]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length;
    const aprovados = filtered.filter(r => (r.status ?? "").toLowerCase() === "aprovado").length;
    const pendentes = filtered.filter(r => (r.status ?? "").toLowerCase() === "pendente").length;
    const reprovados = filtered.filter(r => (r.status ?? "").toLowerCase() === "reprovado").length;
    return { total, aprovados, pendentes, reprovados };
  }, [filtered]);

  // série diária
  const dailyRaw = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const d = toDateOnly(r.dataCriacao);
      if (!d) continue;
      const iso = formatDateISO(d);
      map.set(iso, (map.get(iso) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([xISO, y]) => ({ xISO, y }));
  }, [filtered]);

  // export
  const handleExport = useCallback(() => {
    const rows: string[][] = [["ID","Descrição","Tipo","Status","Criado por","Criado por (display)","IA tipo","IA confiança","Data criação (ISO)"]];
    filtered.forEach((r) => {
      const d = toDateOnly(r.dataCriacao);
      rows.push([
        r.id,
        r.descricao ?? "",
        r.tipo ?? "",
        r.status ?? "",
        r.criadoPor ?? "",
        r.criadoPorDisplay ?? "",
        r.aiSugestaoTipo ?? "",
        typeof r.aiConfidence === "number" ? String(Math.round(r.aiConfidence * 100)) + "%" : "",
        d ? d.toISOString() : ""
      ]);
    });
    downloadCSV(`ecocollab_reportes_${fromDate}_a_${toDate}.csv`, rows);
  }, [filtered, fromDate, toDate]);

  // alterar status (admin/moderator)
  const canEdit = !userRole || ["admin", "moderator"].includes(userRole);
  const onChangeStatus = async (row: ReportRow, newStatus: ReportStatus) => {
    if (!canEdit) return;
    try {
      setBusyId(row.id);
      await updateDoc(doc(db, "reportes", row.id), { status: newStatus });
      // otimiza UI localmente
      setItems(prev => prev.map(x => (x.id === row.id ? { ...x, status: newStatus } : x)));
    } catch (e: any) {
      console.error("update status failed", e);
      alert(`Falha ao atualizar o status.\n${e?.message || e}`);
    } finally {
      setBusyId(null);
    }
  };

  // ordenação por header
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir(field === "dataCriacao" ? "desc" : "asc");
    }
  };
  const sortIcon = (field: SortField) => (sortField !== field ? "↕" : sortDir === "asc" ? "↑" : "↓");

  if (userRole && !["admin", "moderator"].includes(userRole)) {
    return (
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
        <Navbar />
        <View style={[styles.page]}>
          <Text style={styles.pageTitle}>Reports</Text>
          <Text style={{ fontSize: 16 }}>Sem permissões para ver esta página.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />
      <ScrollView contentContainerStyle={[styles.page]} onScroll={onScroll} scrollEventThrottle={24}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Reports</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="ghost" onPress={() => { setFromDate(formatDateISO(thirtyDaysAgo)); setToDate(formatDateISO(today)); }}>
              Últimos 30 dias
            </Button>
            <Button onPress={handleExport}>Export CSV</Button>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersRow}>
          <DateInput label="De" value={fromDate} onChange={setFromDate} />
          <DateInput label="Até" value={toDate} onChange={setToDate} />

          {/* IA filters */}
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>IA</Text>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={onlyWithAI} onChange={(e) => setOnlyWithAI(e.target.checked)} />
                <span>Só com IA</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Min conf:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={minConf}
                  onChange={(e) => setMinConf(parseFloat(e.target.value))}
                  style={{ width: 140 }}
                />
                <span>{Math.round(minConf * 100)}%</span>
              </label>
            </div>
          </View>

          <View style={{ marginLeft: 12, justifyContent: "flex-end" }}>
            <Text style={{ opacity: 0.7, fontSize: 12 }}>
              Ordenado por <Text style={{ fontWeight: "700" }}>{sortField}</Text> {sortDir === "asc" ? "↑" : "↓"}
            </Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <Card title="Reportes (período)" value={kpis.total} />
          <Card title="Aprovados" value={kpis.aprovados} />
          <Card title="Pendentes" value={kpis.pendentes} />
          <Card title="Reprovados" value={kpis.reprovados} />
        </View>

        {/* Gráfico */}
        <View style={styles.cardFull}>
          <Text style={styles.cardTitle}>Reportes por dia</Text>
          {loading ? <Text style={{ marginTop: 12 }}>A carregar…</Text> : <BarsChart fromISO={fromDate} toISO={toDate} raw={dailyRaw} />}
        </View>

        {/* Tabela */}
        <View style={styles.cardFull}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.cardTitle}>Detalhe (scroll para carregar mais)</Text>
            {loadingMore && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator />
                <Text style={{ fontSize: 12, opacity: 0.7 }}>A carregar…</Text>
              </View>
            )}
          </View>

          <View style={styles.tableHeader}>
            <Pressable onPress={() => toggleSort("descricao")} style={[styles.thPress, { flex: 3 }]}>
              <Text style={styles.thText}>Descrição {sortIcon("descricao")}</Text>
            </Pressable>
            <Pressable onPress={() => toggleSort("tipo")} style={[styles.thPress, { flex: 1 }]}>
              <Text style={styles.thText}>Tipo (user) {sortIcon("tipo")}</Text>
            </Pressable>
            <Pressable onPress={() => toggleSort("status")} style={[styles.thPress, { flex: 2 }]}>
              <Text style={styles.thText}>Status {sortIcon("status")}</Text>
            </Pressable>
            <Pressable onPress={() => toggleSort("criadoPorDisplay")} style={[styles.thPress, { flex: 2 }]}>
              <Text style={styles.thText}>Criado por {sortIcon("criadoPorDisplay")}</Text>
            </Pressable>
            <Pressable onPress={() => toggleSort("dataCriacao")} style={[styles.thPress, { flex: 2 }]}>
              <Text style={styles.thText}>Data {sortIcon("dataCriacao")}</Text>
            </Pressable>
            {/* IA */}
            <Pressable onPress={() => toggleSort("aiConfidence")} style={[styles.thPress, { flex: 2 }]}>
              <Text style={styles.thText}>IA (tipo / conf.) {sortIcon("aiConfidence")}</Text>
            </Pressable>
            <View style={{ width: 40 }} />
          </View>

          {filtered.map((r) => {
            const d = toDateOnly(r.dataCriacao);
            const s = String(r.status ?? "").toLowerCase() as ReportStatus;
            const disable = busyId === r.id || !canEdit;
            const discord = !!(r.aiSugestaoTipo && r.tipo && r.aiSugestaoTipo !== r.tipo);
            const pct = Math.round(Math.max(0, Math.min(1, r.aiConfidence ?? 0)) * 100);

            return (
              <View key={r.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 3 }]} numberOfLines={1} ellipsizeMode="tail">{r.descricao || "-"}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{r.tipo || "-"}</Text>

                {/* STATUS com badge + select para alterar */}
                <View style={[styles.td, { flex: 2, gap: 8, alignItems: "center", flexDirection: "row" }]}>
                  <View
                    style={[
                      styles.badge,
                      s === "aprovado" ? styles.badgeSuccess :
                      s === "pendente" ? styles.badgeWarn :
                      s === "reprovado" ? styles.badgeDanger :
                      styles.badgeNeutral
                    ]}
                  >
                    <Text style={styles.badgeTxt}>{r.status || "-"}</Text>
                  </View>

                  <select
                    value={String(r.status || "")}
                    onChange={(e) => onChangeStatus(r, e.target.value as ReportStatus)}
                    disabled={disable}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "inherit", outline: "none", minWidth: 160 }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </View>

                <Text style={[styles.td, { flex: 2 }]}>{r.criadoPorDisplay || r.criadoPor || "-"}</Text>
                <Text style={[styles.td, { flex: 2 }]}>{d ? d.toLocaleString() : "-"}</Text>

                {/* IA col */}
                <View style={[styles.td, { flex: 2, gap: 6 }]}>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <View style={[styles.badge, styles.badgeNeutral]}>
                      <Text style={styles.badgeTxt}>IA: {r.aiSugestaoTipo ? String(r.aiSugestaoTipo).toUpperCase() : "—"}</Text>
                    </View>
                    {discord && (
                      <View style={[styles.badge, styles.badgeDanger]}>
                        <Text style={styles.badgeTxt}>DISCORDANTE</Text>
                      </View>
                    )}
                  </View>
                  {typeof r.aiConfidence === "number" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ height: 8, background: "#e5e7eb", borderRadius: 8, overflow: "hidden", flex: 1 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#1976D2" }} />
                      </div>
                      <span style={{ fontSize: 12, opacity: 0.8 }}>{pct}%</span>
                    </div>
                  )}
                </View>

                {/* ação opcional loading */}
                {busyId === r.id && (
                  <View style={[styles.td, { width: 36, alignItems: "flex-end" }]}>
                    <ActivityIndicator />
                  </View>
                )}
              </View>
            );
          })}

          {!loading && filtered.length === 0 && <Text style={{ padding: 12 }}>Sem registos visíveis.</Text>}
          {endReached && items.length > 0 && (
            <Text style={{ padding: 12, textAlign: "center", opacity: 0.6 }}>— fim dos resultados —</Text>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  page: { padding: 24, gap: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 26, fontWeight: "800" },
  filtersRow: { flexDirection: "row", gap: 16, alignItems: "flex-end", flexWrap: "wrap" },
  kpiRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, minWidth: 220, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" as any },
  cardFull: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 12, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" as any },
  cardTitle: { fontSize: 14, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.9 },
  cardValue: { fontSize: 28, fontWeight: "900" },
  cardSubtle: { fontSize: 12, opacity: 0.6 },
  label: { fontSize: 12, fontWeight: "700", opacity: 0.8 },

  // buttons
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  buttonPrimary: { backgroundColor: "#0f62fe" },
  buttonPrimaryText: { color: "white", fontWeight: "800" },
  buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#e5e7eb" },
  buttonGhostText: { color: "#111", fontWeight: "800" },

  // chart
  chartCard: { height: 280, flexDirection: "row", alignItems: "stretch", gap: 8, paddingTop: 4 },
  yAxis: { width: 44, paddingTop: 8, paddingBottom: 16 },
  yTickRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  yTickLabel: { width: 20, textAlign: "right", fontSize: 11, opacity: 0.7 },
  yGridLine: { height: 1, backgroundColor: "#e5e7eb", flex: 1 },
  barsWrap: { flex: 1, height: "100%", paddingBottom: 18, flexDirection: "row", alignItems: "flex-end", gap: 8, borderLeftWidth: 1, borderColor: "#e5e7eb" },
  barCol: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end", position: "relative" },
  bar: { width: "100%", borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: "#0f62fe22", borderWidth: 1, borderColor: "#0f62fe55" },
  xTick: { marginTop: 6, fontSize: 10, opacity: 0.8 },

  // tooltip
  tooltipWrap: { position: "absolute", transform: "translateY(-8px)", alignItems: "center" },
  tooltipBubble: { backgroundColor: "#111", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  tooltipText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // table
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingBottom: 8, marginTop: 4 },
  thPress: { paddingVertical: 6, paddingHorizontal: 6, cursor: "pointer" as any },
  thText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase" },
  tableRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#f3f4f6" },
  td: { paddingVertical: 12, paddingHorizontal: 6, fontSize: 14 },

  // badges
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start", borderWidth: 1 },
  badgeNeutral: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
  badgeSuccess: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  badgeWarn: { backgroundColor: "#fff7ed", borderColor: "#ffedd5" },
  badgeDanger: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  badgeTxt: { fontSize: 12, fontWeight: "800" },
});
