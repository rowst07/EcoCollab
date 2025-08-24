import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

type Estado = 'Análise' | 'Resolvido' | 'Irrelevante';   // estados reais
type EstadoFiltro = 'Todos' | Estado;                    // filtro pode ter "Todos"
type TipoMsg = 'reporte' | 'ponto';

type Item = {
  id: string;
  tipo: TipoMsg;
  autor: string;
  titulo: string;
  estado: Estado;
  data: string;
};

// MOCK com reportes e propostas de pontos
const DADOS: Item[] = [
  {
    id: 'r1',
    tipo: 'reporte',
    autor: 'João Monteiro',
    titulo: 'Contentores cheios',
    estado: 'Análise',
    data: '14/08/2025',
  },
  {
    id: 'r2',
    tipo: 'reporte',
    autor: 'Ana Martins',
    titulo: 'Falta de ecoponto vidro',
    estado: 'Resolvido',
    data: '13/08/2025',
  },
  {
    id: 'p1',
    tipo: 'ponto',
    autor: 'Pedro Silva',
    titulo: 'Novo Ecoponto na Praça Velha',
    estado: 'Análise',
    data: '15/08/2025',
  },
  {
    id: 'r3',
    tipo: 'reporte',
    autor: 'Beatriz F.',
    titulo: 'Mau cheiro no ponto',
    estado: 'Irrelevante',
    data: '11/08/2025',
  },
  {
    id: 'p2',
    tipo: 'ponto',
    autor: 'Carla Lopes',
    titulo: 'Adicionar ponto junto à escola',
    estado: 'Análise',
    data: '10/08/2025',
  },
];

export default function MensagensModerador() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('Todos');

  const filtrados = useMemo(() => {
    return DADOS.filter(d => {
      const qOk = (d.autor + ' ' + d.titulo).toLowerCase().includes(q.toLowerCase());
      const eOk = estadoFiltro === 'Todos' || d.estado === estadoFiltro;
      return qOk && eOk;
    });
  }, [q, estadoFiltro]);

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
        <Text style={styles.subtitle}>Reportes e propostas de novos pontos</Text>
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/ModScreens/mensagens/[id]',
                params: { id: item.id, tipo: item.tipo }
              })
            }
          >
            {/* Linha superior com tipo no título + estado (sem barras/pills) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.cardTitle}>
                {item.tipo === 'ponto'
                  ? `Proposta de ponto de: ${item.autor}`
                  : `Reporte de: ${item.autor}`}
              </Text>
              <View style={{ marginLeft: 'auto' }}>
                <EstadoChip value={item.estado} />
              </View>
            </View>

            {/* Título/assunto da mensagem */}
            <Text style={styles.cardSub}>{item.titulo}</Text>

            {/* Footer com data e seta */}
            <View style={styles.cardFooter}>
              <View style={styles.rowCenter}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.cardMeta}>{item.data}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 30 }}>
            Sem resultados.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // brand bar
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
  filter: {
    backgroundColor: '#E8F1EA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16
  },
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

  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontWeight: '800',
    color: '#fff',
    fontSize: 12
  },
  chipDone: { backgroundColor: '#2E7D32' },
  chipProg: { backgroundColor: '#FFA000' },
  chipIrrel: { backgroundColor: '#D32F2F' },
  chipNeutral: { backgroundColor: '#9E9E9E' },
});
