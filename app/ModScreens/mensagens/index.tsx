import {
  subscribeReportes,
  type ReporteStatus,
} from '@/services/FirestoreService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type Estado = 'Análise' | 'Resolvido' | 'Irrelevante';
type EstadoFiltro = 'Todos' | Estado;
type TipoMsg = 'reporte'; // (podemos juntar 'ponto' no futuro)

type Item = {
  id: string;
  tipo: TipoMsg;
  autor: string;
  titulo: string;
  estado: Estado;
  data: string;
  fotoUrl?: string | null;
};

// Mapeamentos Firestore <-> UI
const labelToFs: Record<Estado, ReporteStatus> = {
  'Análise': 'em_analise',
  'Resolvido': 'resolvido',
  'Irrelevante': 'rejeitado',
};
const fsToLabel: Record<ReporteStatus, Estado> = {
  'em_analise': 'Análise',
  'resolvido': 'Resolvido',
  'rejeitado': 'Irrelevante',
  'aberto': 'Análise', // fallback visual
};

export default function MensagensModerador() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('Todos');
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(true);

  // Subscrição aos reportes
  useEffect(() => {
    const statusIn = estadoFiltro === 'Todos' ? undefined : [labelToFs[estadoFiltro]];
    const unsub = subscribeReportes({
      statusIn,
      onData: (rows) => {
        const mapped: Item[] = rows.map((r) => ({
          id: r.id,
          tipo: 'reporte',
          autor: r.criadoPorDisplay || 'Utilizador',
          titulo: r.tipo ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1) : 'Reporte',
          estado: fsToLabel[r.status] ?? 'Análise',
          data: r.dataCriacao?.toDate ? r.dataCriacao.toDate().toLocaleDateString() : '',
          fotoUrl: r.fotoUrl ?? undefined,
        }));
        setItems(mapped);
        setBusy(false);
      },
    });
    return unsub;
  }, [estadoFiltro]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(d =>
      (d.autor + ' ' + d.titulo).toLowerCase().includes(term)
    );
  }, [q, items]);

  const EstadoChip = ({ value }: { value: Estado }) => {
    const st =
      value === 'Resolvido' ? styles.chipDone :
      value === 'Análise'   ? styles.chipProg :
      value === 'Irrelevante' ? styles.chipIrrel :
      styles.chipNeutral;
    return <Text style={[styles.chip, st]}>{value}</Text>;
  };

  const Filtro = ({ label }: { label: EstadoFiltro }) => (
    <TouchableOpacity
      onPress={() => setEstadoFiltro(label)}
      style={[styles.filter, estadoFiltro === label && styles.filterActive]}
    >
      <Text style={[styles.filterText, estadoFiltro === label && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* LOGO + EcoCollab */}
      <View style={styles.brandBar}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandText}>EcoCollab</Text>
      </View>

      {/* Header simples */}
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
        <Text style={styles.subtitle}>Reportes enviados pelos utilizadores</Text>
      </View>

      {/* Pesquisa */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por autor, título..."
          placeholderTextColor="#888"
          value={q}
          onChangeText={setQ}
        />
      </View>

      {/* Filtros por estado */}
      <View style={styles.filtersRow}>
        {(['Todos', 'Análise', 'Resolvido', 'Irrelevante'] as EstadoFiltro[]).map(l =>
          <Filtro key={l} label={l} />
        )}
      </View>

      {/* Lista */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}
        data={filtrados}
        keyExtractor={(i) => i.id}
        refreshing={busy}
        onRefresh={() => {/* live, noop */}}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/ModScreens/mensagens/[id]',
                params: { id: item.id, tipo: 'reporte' }
              })
            }
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.cardTitle}>Reporte de: {item.autor}</Text>
              <View style={{ marginLeft: 'auto' }}>
                <EstadoChip value={item.estado} />
              </View>
            </View>

            <Text style={styles.cardSub}>{item.titulo}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.rowCenter}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.cardMeta}>{item.data || '—'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 30 }}>
            {busy ? 'A carregar…' : 'Sem resultados.'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  brandBar: {
    backgroundColor: '#EFEADB',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCBBF',
  },
  brandLogo: { width: 195, height: 99, marginBottom: -20, marginTop: -10 },
  brandText: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },

  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  subtitle: { color: '#666', marginTop: 2 },

  searchWrap: {
    marginTop: 10,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ECECEC'
  },
  searchInput: { marginLeft: 8, flex: 1, color: '#111' },

  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 2
  },
  filter: { backgroundColor: '#E8F1EA', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
  filterActive: { backgroundColor: '#2E7D32' },
  filterText: { color: '#2E7D32', fontWeight: '700' },
  filterTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  cardTitle: { fontWeight: '800', color: '#111' },
  cardSub: { color: '#444', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardMeta: { marginLeft: 6, color: '#666' },

  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, fontWeight: '800', color: '#fff', fontSize: 12 },
  chipDone: { backgroundColor: '#2E7D32' },
  chipProg: { backgroundColor: '#FFA000' },
  chipIrrel: { backgroundColor: '#D32F2F' },
  chipNeutral: { backgroundColor: '#9E9E9E' },
});
