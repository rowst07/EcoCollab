import {
  subscribeReportes,
  type ReporteStatus,
} from '@/services/FirestoreService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

// --------- Estados (labels de UI) ---------
// Core = os 3 usados no filtro
type EstadoCore = 'Pendente' | 'Aprovado' | 'Reprovado';
// Extras possíveis vindos do Firestore
type EstadoExtra = 'Em análise' | 'Resolvido' | 'Aberto';
type Estado = EstadoCore | EstadoExtra;

type EstadoFiltro = 'Todos' | EstadoCore;
type TipoMsg = 'reporte';

type Item = {
  id: string;
  tipo: TipoMsg;
  autor: string;
  titulo: string;
  estado: Estado;
  data: string;
  fotoUrl?: string | null;

  // 🧠 IA
  aiTipo?: string | null;
  aiConfidence?: number | null;
  discordante?: boolean;
};

// Para filtrar, só precisamos mapear os 3 principais (tipado como ReporteStatus):
const labelToFs: Record<EstadoCore, ReporteStatus> = {
  Pendente: 'pendente',
  Aprovado: 'aprovado',
  Reprovado: 'reprovado',
};

// Converte qualquer status vindo do Firestore para label de UI:
function fsToLabel(status?: string): Estado {
  switch ((status || '').toLowerCase()) {
    case 'pendente':     return 'Pendente';
    case 'aprovado':     return 'Aprovado';
    case 'reprovado':    return 'Reprovado';
    case 'em-analise':   return 'Em análise';
    case 'resolvido':    return 'Resolvido';
    case 'aberto':       return 'Aberto';
    default:             return 'Pendente';
  }
}

export default function MensagensModerador() {
  const router = useRouter();
  const params = useLocalSearchParams<{ estado?: EstadoCore }>();

  const [q, setQ] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('Todos');
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(true);

  // filtros IA
  const [onlyWithAI, setOnlyWithAI] = useState<boolean>(false);
  const [minConf, setMinConf] = useState<number>(0); // 0..1

  // Aplica filtro inicial vindo por parâmetro (ex.: estado=Pendente)
  useEffect(() => {
    if (params?.estado === 'Pendente' || params?.estado === 'Aprovado' || params?.estado === 'Reprovado') {
      setEstadoFiltro(params.estado);
    }
  }, [params?.estado]);

  // Subscrição aos reportes (respeita o filtro de estado)
  useEffect(() => {
    let statusIn: ReporteStatus[] | undefined;
    if (estadoFiltro !== 'Todos') {
      // estreita o tipo: aqui estadoFiltro é EstadoCore
      statusIn = [labelToFs[estadoFiltro]];
    }

    const unsub = subscribeReportes({
      statusIn,
      onData: (rows) => {
        const mapped: Item[] = rows.map((r) => {
          const aiTipo = (r as any).aiSugestaoTipo ?? null;
          const aiConfidence = (r as any).aiConfidence ?? null;
          const userTipo = r.tipo ?? '';
          const discordante = !!(aiTipo && userTipo && aiTipo !== userTipo);

          return {
            id: r.id,
            tipo: 'reporte',
            autor: r.criadoPorDisplay || 'Utilizador',
            titulo: userTipo ? userTipo.charAt(0).toUpperCase() + userTipo.slice(1) : 'Reporte',
            estado: fsToLabel(r.status),
            data: r.dataCriacao?.toDate ? r.dataCriacao.toDate().toLocaleDateString() : '',
            fotoUrl: r.fotoUrl ?? undefined,
            aiTipo,
            aiConfidence,
            discordante,
          };
        });
        setItems(mapped);
        setBusy(false);
      },
    });
    return unsub;
  }, [estadoFiltro]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = items;
    if (onlyWithAI) base = base.filter(i => i.aiTipo != null);
    if (minConf > 0) base = base.filter(i => (i.aiConfidence ?? 0) >= minConf);
    if (!term) return base;
    return base.filter(d =>
      (d.autor + ' ' + d.titulo).toLowerCase().includes(term)
    );
  }, [q, items, onlyWithAI, minConf]);

  const EstadoChip = ({ value }: { value: Estado }) => {
    const st =
      value === 'Aprovado' || value === 'Resolvido' ? styles.chipDone :
      value === 'Pendente' || value === 'Em análise' || value === 'Aberto' ? styles.chipProg :
      value === 'Reprovado' ? styles.chipIrrel :
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

  const ConfBar = ({ v }: { v?: number | null }) => {
    const pct = Math.round(Math.max(0, Math.min(1, v ?? 0)) * 100);
    return (
      <View style={{ marginTop: 6 }}>
        <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%' }} />
        </View>
        <Text style={{ fontSize: 12, color: '#616161', marginTop: 2 }}>{pct}%</Text>
      </View>
    );
  };

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
        {(['Todos', 'Pendente', 'Aprovado', 'Reprovado'] as EstadoFiltro[]).map(l =>
          <Filtro key={l} label={l} />
        )}
      </View>

      {/* Filtros IA */}
      <View style={[styles.filtersRow, { marginTop: 6 }]}>
        <TouchableOpacity
          onPress={() => setOnlyWithAI(v => !v)}
          style={[styles.filter, onlyWithAI && styles.filterActiveAI]}
        >
          <Text style={[styles.filterTextAI, onlyWithAI && styles.filterTextAIActive]}>
            {onlyWithAI ? 'Só com IA' : 'IA: todos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMinConf(c => (c >= 0.75 ? 0 : +(c + 0.25).toFixed(2)))}
          style={[styles.filter, styles.filterMinConf]}
        >
          <Text style={[styles.filterTextAI]}>
            Min conf: {Math.round(minConf * 100)}%
          </Text>
        </TouchableOpacity>
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

            {/* Linha do tipo (user) + IA */}
            <View style={{ gap: 4, marginBottom: 4 }}>
              <Text style={styles.cardSub}>Tipo (utilizador): {item.titulo || '—'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.cardSub, { fontWeight: '800' }]}>
                  IA: {item.aiTipo ? String(item.aiTipo).toUpperCase() : '—'}
                </Text>
                {item.discordante && (
                  <Text style={{ color: '#D32F2F', fontWeight: '900' }}>DISCORDANTE</Text>
                )}
              </View>
              {typeof item.aiConfidence === 'number' && <ConfBar v={item.aiConfidence} />}
            </View>

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

  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 10, marginBottom: 2 },
  filter: { backgroundColor: '#E8F1EA', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
  filterActive: { backgroundColor: '#2E7D32' },
  filterText: { color: '#2E7D32', fontWeight: '700' },
  filterTextActive: { color: '#fff' },

  // Filtros IA
  filterActiveAI: { backgroundColor: '#1976D2' },
  filterTextAI: { color: '#0F172A', fontWeight: '800' },
  filterTextAIActive: { color: '#fff' },
  filterMinConf: { backgroundColor: '#E3F2FD' },

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
  chipDone: { backgroundColor: '#2E7D32' },  // Aprovado / Resolvido
  chipProg: { backgroundColor: '#FFA000' },  // Pendente / Em análise / Aberto
  chipIrrel: { backgroundColor: '#D32F2F' }, // Reprovado
  chipNeutral: { backgroundColor: '#9E9E9E' },
});
