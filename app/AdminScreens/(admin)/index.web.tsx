import { db } from "@/firebase";
import { Link } from "expo-router";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useAuth } from "../../../services/AuthContext";

/* --- gráficos (web) --- */
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

/* ---------- KPI Card ---------- */
function KpiCard({
  title,
  value,
  subtitle,
  accent = "#16a34a",
  loading = false,
  href,
}: {
  title: string;
  value: number;
  subtitle?: string;
  accent?: string;
  loading?: boolean;
  href?: string;
}) {
  const content = (
    <View
      style={{
        flexGrow: 1,
        minWidth: 260,
        borderWidth: 1,
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <Text style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ fontSize: 32, fontWeight: "900" }}>{value}</Text>
        )}
        <View
          style={{
            marginLeft: "auto",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: "#eaf4ee",
            borderWidth: 1,
            borderColor: "#cbe7d4",
          }}
        >
          <Text style={{ color: "#166534", fontWeight: "700", fontSize: 12 }}>Live</Text>
        </View>
      </View>
      {!!subtitle && <Text style={{ marginTop: 6, color: "var(--muted)" }}>{subtitle}</Text>}
      <View
        style={{
          marginTop: 12,
          height: 3,
          width: "100%",
          backgroundColor: "var(--bg)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <View style={{ width: "35%", height: "100%", backgroundColor: accent }} />
      </View>
    </View>
  );

  if (href) {
    return (
      <Link href={href as any} asChild>
        <Pressable
          style={({ hovered }) => [
            { cursor: "pointer" as any },
            hovered && {
              transform: [{ translateY: -1 }],
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            },
          ]}
        >
          {content}
        </Pressable>
      </Link>
    );
  }

  return content;
}

/* ---------- Dashboard ---------- */
export default function AdminHomeWeb() {
  const { loading } = useAuth();

  const [loadingKpi, setLoadingKpi] = useState(true);

  const [usersCount, setUsersCount] = useState(0);
  const [reportsPendentes, setReportsPendentes] = useState(0);
  const [retomasAtivas, setRetomasAtivas] = useState(0);
  const [retomasTotal, setRetomasTotal] = useState(0);
  const [pontosCount, setPontosCount] = useState(0);

  // breakdowns (gráficos)
  const [admins, setAdmins] = useState(0);
  const [mods, setMods] = useState(0);
  const [usersRestantes, setUsersRestantes] = useState(0);

  const [repPend, setRepPend] = useState(0);
  const [repAprov, setRepAprov] = useState(0);
  const [repReprov, setRepReprov] = useState(0);

  // retomas por tipo
  const [retomasDoacao, setRetomasDoacao] = useState(0);
  const [retomasTroca, setRetomasTroca] = useState(0);
  const [retomasOutras, setRetomasOutras] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      setLoadingKpi(true);

      // Totais
      const usersSnap = await getCountFromServer(collection(db, "users"));

      const reportsPendSnap = await getCountFromServer(
        query(collection(db, "reportes"), where("status", "==", "pendente"))
      );

      const retomasAtivasSnap = await getCountFromServer(
        query(collection(db, "retomas"), where("estado", "==", "Ativa"))
      );
      const retomasTotalSnap = await getCountFromServer(collection(db, "retomas"));

      const pontosSnap = await getCountFromServer(collection(db, "pontoRecolha"));

      setUsersCount(usersSnap.data().count);
      setReportsPendentes(reportsPendSnap.data().count);
      setRetomasAtivas(retomasAtivasSnap.data().count);
      setRetomasTotal(retomasTotalSnap.data().count);
      setPontosCount(pontosSnap.data().count);

      // Utilizadores por role
      const adminsSnap = await getCountFromServer(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      const modsSnap = await getCountFromServer(
        query(collection(db, "users"), where("role", "==", "moderator"))
      );
      const a = adminsSnap.data().count;
      const m = modsSnap.data().count;
      setAdmins(a);
      setMods(m);
      setUsersRestantes(Math.max(usersSnap.data().count - a - m, 0));

      // Reports por estado (aceite/aprovado e rejeitado/reprovado)
      const aprovSnapA = await getCountFromServer(
        query(collection(db, "reportes"), where("status", "==", "aprovado"))
      );
      const aprovSnapB = await getCountFromServer(
        query(collection(db, "reportes"), where("status", "==", "aceite"))
      );
      const reprovSnapA = await getCountFromServer(
        query(collection(db, "reportes"), where("status", "==", "reprovado"))
      );
      const reprovSnapB = await getCountFromServer(
        query(collection(db, "reportes"), where("status", "==", "rejeitado"))
      );

      setRepPend(reportsPendSnap.data().count);
      setRepAprov(aprovSnapA.data().count + aprovSnapB.data().count);
      setRepReprov(reprovSnapA.data().count + reprovSnapB.data().count);

      // Retomas por tipo (tolerante a "Doacao")
      const doacaoA = await getCountFromServer(
        query(collection(db, "retomas"), where("tipo", "==", "Doação"))
      );
      const doacaoB = await getCountFromServer(
        query(collection(db, "retomas"), where("tipo", "==", "Doacao"))
      );
      const troca = await getCountFromServer(
        query(collection(db, "retomas"), where("tipo", "==", "Troca"))
      );
      const doacoes = doacaoA.data().count + doacaoB.data().count;
      const trocas = troca.data().count;
      const outras = Math.max(retomasTotalSnap.data().count - doacoes - trocas, 0);

      setRetomasDoacao(doacoes);
      setRetomasTroca(trocas);
      setRetomasOutras(outras);
    } catch (e) {
      console.error("Dashboard counts error:", e);
    } finally {
      setLoadingKpi(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) fetchCounts();
  }, [loading, fetchCounts]);

  // dados dos gráficos
  const usersData = useMemo(
    () => [
      { name: "Admins", value: admins },
      { name: "Moderadores", value: mods },
      { name: "Restantes", value: usersRestantes },
    ],
    [admins, mods, usersRestantes]
  );

  const reportsData = useMemo(
    () => [
      { name: "Pendentes", value: repPend },
      { name: "Aprovados", value: repAprov },
      { name: "Reprovados", value: repReprov },
    ],
    [repPend, repAprov, repReprov]
  );

  const retomasTipoData = useMemo(
    () => [
      { name: "Doação", value: retomasDoacao },
      { name: "Troca", value: retomasTroca },
      { name: "Outras", value: retomasOutras },
    ],
    [retomasDoacao, retomasTroca, retomasOutras]
  );

  const USER_COLORS = ["#16a34a", "#60a5fa", "#94a3b8"];
  const REPORT_COLORS = ["#f59e0b", "#22c55e", "#ef4444"];
  const RETOMA_TIPO_COLORS = ["#22c55e", "#0ea5e9", "#94a3b8"]; // verde / azul / cinza

  return (
    <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
      <Navbar />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Dashboard</Text>
            <Text style={{ color: "var(--muted)" }}>Visão geral da aplicação</Text>
          </View>
          <Pressable
            onPress={fetchCounts}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: "var(--bg)",
              borderWidth: 1,
              borderColor: "var(--border)",
            }}
          >
            <Text style={{ fontWeight: "600" }}>Atualizar</Text>
          </Pressable>
        </View>

        {/* KPIs */}
        <View style={{ gap: 12, rowGap: 12, flexDirection: "row", flexWrap: "wrap" as any }}>
          <KpiCard
            title="Utilizadores"
            value={usersCount}
            subtitle="Total de contas na plataforma"
            accent="#16a34a"
            loading={loadingKpi}
            href="/AdminScreens/users"
          />
          <KpiCard
            title="Reports pendentes"
            value={reportsPendentes}
            subtitle="A aguardar avaliação"
            accent="#f59e0b"
            loading={loadingKpi}
            href="/AdminScreens/reports"
          />
          <KpiCard
            title="Retomas ativas"
            value={retomasAtivas}
            subtitle="Disponíveis neste momento"
            accent="#0ea5e9"
            loading={loadingKpi}
            href="/AdminScreens/retomas"
          />
          <KpiCard
            title="Pontos de recolha"
            value={pontosCount}
            subtitle="Total existentes"
            accent="#10b981"
            loading={loadingKpi}
            href="/AdminScreens/retomas"
          />
        </View>

        {/* Gráficos */}
        <View
          style={{
            marginTop: 16,
            gap: 12,
            rowGap: 12,
            flexDirection: "row",
            flexWrap: "wrap" as any,
          }}
        >
          {/* Utilizadores por papel */}
          <View
            style={{
              flexGrow: 1,
              minWidth: 320,
              height: 320,
              borderWidth: 1,
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Utilizadores por papel</Text>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={usersData} dataKey="value" nameKey="name" outerRadius={90}>
                  {usersData.map((_, i) => (
                    <Cell key={`u-${i}`} fill={USER_COLORS[i % USER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </View>

          {/* Reports por estado */}
          <View
            style={{
              flexGrow: 1,
              minWidth: 320,
              height: 320,
              borderWidth: 1,
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Reports por estado</Text>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={reportsData} dataKey="value" nameKey="name" outerRadius={90}>
                  {reportsData.map((_, i) => (
                    <Cell key={`r-${i}`} fill={REPORT_COLORS[i % REPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </View>

          {/* Retomas — por tipo */}
          <View
            style={{
              flexGrow: 1,
              minWidth: 320,
              height: 320,
              borderWidth: 1,
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 8 }}>Retomas — por tipo</Text>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={retomasTipoData} dataKey="value" nameKey="name" outerRadius={90}>
                  {retomasTipoData.map((_, i) => (
                    <Cell key={`ret-tipo-${i}`} fill={RETOMA_TIPO_COLORS[i % RETOMA_TIPO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </View>
        </View>
      </View>
    </View>
  );
}
