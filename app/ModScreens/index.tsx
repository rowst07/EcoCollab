import { THEME } from '@/constants/Colors';
import {
  subscribePontosRecolha,
  subscribeReportes,
  subscribeUsers,
} from '@/services/FirestoreService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

export default function ModHome() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'dark';
  const colors = THEME[scheme];
  const router = useRouter();

  const [kpiReportesPend, setKpiReportesPend] = useState<number>(0);
  const [kpiPontosPend, setKpiPontosPend] = useState<number>(0);
  const [kpiUsers, setKpiUsers] = useState<number>(0);

  // 🔁 (Re)subscreve sempre que o ecrã ganha foco; limpa quando perde foco
  useFocusEffect(
    useCallback(() => {
      const unsubRep = subscribeReportes({
        statusEq: 'pendente',
        onData: (rows) => setKpiReportesPend(rows.length),
      });
      const unsubPontos = subscribePontosRecolha({
        statusEq: 'pendente',
        onData: (rows) => setKpiPontosPend(rows.length),
      });
      const unsubUsers = subscribeUsers((list) => setKpiUsers(list.length));

      return () => {
        unsubRep();
        unsubPontos();
        unsubUsers();
      };
    }, [])
  );

  const CardNav = ({
    icon, title, subtitle, to,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    to: '/ModScreens/mensagens' | '/ModScreens/utilizadores' | '/ModScreens/pontos';
  }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: '#00000020' }]}
      onPress={() => router.push({ pathname: to })}
      accessibilityRole="button"
    >
      <View style={[styles.cardIconWrap, { backgroundColor: colors.bgOther }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.textOnCard }]}>{title}</Text>
        <Text style={[styles.cardSub, { color: colors.textOnCard }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  const Stat = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) => (
    <View style={[styles.stat, { backgroundColor: colors.card }]}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.textOnCard }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: colors.textOnCard }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgOther }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Painel de Moderador</Text>

      <Text style={[styles.headerSub, { color: colors.text }]}>
        Acompanha o estado geral e gere os recursos
      </Text>

      <View style={styles.kpisRow}>
        <Stat icon="alert-circle-outline" label="Reportes pendentes" value={kpiReportesPend} />
        <Stat icon="location-outline" label="Pontos pendentes" value={kpiPontosPend} />
        <Stat icon="people-outline" label="Utilizadores" value={kpiUsers} />
      </View>

      <View style={{ height: 10 }} />
      <CardNav
        icon="chatbubbles-outline"
        title="Mensagens"
        subtitle="Ver e tratar reportes de utilizadores"
        to="/ModScreens/mensagens"
      />
      <CardNav
        icon="people-outline"
        title="Visualização Utilizadores"
        subtitle="Consultar perfis e estatísticas"
        to="/ModScreens/utilizadores"
      />
      <CardNav
        icon="location-outline"
        title="Gestão de Pontos"
        subtitle="Adicionar, editar ou eliminar pontos"
        to="/ModScreens/pontos"
      />

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.primary }]}
        onPress={() => router.push({ pathname: '/ModScreens/mensagens', params: { estado: 'Pendente' } })}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
        <Text style={[styles.ctaText, { color: colors.text }]}>Abrir fila de pendentes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 24 },
  headerTitle: { fontSize: 30, fontWeight: '800', textAlign: 'left' },
  headerSub: { fontSize: 14, marginTop: 6, marginBottom: 16 },
  kpisRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#00000020' },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, opacity: 0.9 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 13, marginTop: 2 },
  cta: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    elevation: 6,
  },
  ctaText: { fontSize: 14, fontWeight: '800' },
});
