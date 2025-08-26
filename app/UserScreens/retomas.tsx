import NovaRetomaModal from '@/components/modals/CriarRetomaModal';
import { THEME } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

// Firestore (subs em tempo-real)
import { auth } from '@/firebase';
import {
  subscribeMinhasRetomas,
  subscribeRetomasDisponiveis,
  type RetomaDoc,
} from '@/services/FirestoreService';

type Aba = 'disponiveis' | 'minhas';

// helper: escolhe o ícone com base no tipo (respeita item.icon se existir)
function getIconForTipo(tipo?: string, fallbackIcon?: string) {
  if (fallbackIcon) return fallbackIcon as any;
  const t = (tipo || '').toLowerCase();
  if (t === 'troca') return 'handshake-outline' as any; // troca
  return 'gift-outline' as any;                       // doação (ou default)
}

export default function Retomas() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'dark';
  const colors = THEME[scheme];
  const router = useRouter();

  const [abaAtiva, setAbaAtiva] = useState<Aba>('disponiveis');
  const [disponiveis, setDisponiveis] = useState<RetomaDoc[]>([]);
  const [minhas, setMinhas] = useState<RetomaDoc[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(true);
  const [loadingMinhas, setLoadingMinhas] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // subscrições
  useEffect(() => {
    const unsubDisp = subscribeRetomasDisponiveis({
      onData: (list) => {
        setDisponiveis(list);
        setLoadingDisp(false);
      },
    });

    let unsubMine = () => {};
    const uid = auth.currentUser?.uid;
    if (uid) {
      unsubMine = subscribeMinhasRetomas({
        uid,
        onData: (list) => {
          setMinhas(list);
          setLoadingMinhas(false);
        },
      });
    } else {
      setLoadingMinhas(false);
    }

    return () => {
      unsubDisp();
      unsubMine();
    };
  }, []);

  const lista = useMemo(() => {
    return abaAtiva === 'disponiveis' ? disponiveis : minhas;
  }, [abaAtiva, disponiveis, minhas]);

  const carregando = abaAtiva === 'disponiveis' ? loadingDisp : loadingMinhas;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const abrirDetalhes = (item: RetomaDoc) => {
    router.push({
      pathname: '/UserScreens/detalhesRetoma',
      params: {
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        pontos: item.pontos ?? 0,
        icon: item.icon ?? '', // enviado mas pode ser ignorado se vazio
        descricao: item.descricao ?? '',
        quantidade: item.quantidade ?? '—',
        local: item.local ?? '—',
        lat: item.lat ?? undefined,
        lng: item.lng ?? undefined,
        estado: item.estado,
        autor: item.criadoPorDisplay ?? 'Utilizador',
        condicao: item.condicao ?? 'Usado',
        entrega: item.entrega ?? 'Levantamento',
        preferencias: item.preferencias ?? '—',
        tags: (item.tags ?? []).join(','),
        createdAt: item.dataCriacao ? '' : '',
        validade: item.validade ?? undefined,
        eMinha: auth.currentUser?.uid === item.criadoPor,
        fotoUri: item.fotoUrl ?? '', // fallback visual imediato
      },
    });
  };

  const renderItem = ({ item }: { item: RetomaDoc }) => {
    const iconName = getIconForTipo(item.tipo);
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <MaterialCommunityIcons
          name={iconName}
          size={32}
          color={colors.primary}
          style={styles.icon}
        />
        <View style={styles.cardContent}>
          <Text style={[styles.itemTitle, { color: colors.textOnCard }]} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={[styles.itemType, { color: colors.textOnCard }]} numberOfLines={1}>
            {`Tipo: ${item.tipo}`}
          </Text>
          <Text style={[styles.itemPoints, { color: colors.primary }]}>
            +{item.pontos ?? 0} pontos
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => abrirDetalhes(item)}
          >
            <Text style={[styles.btnText, { color: colors.text }]}>Ver detalhes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (carregando) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {abaAtiva === 'disponiveis' ? 'Sem retomas ativas' : 'Ainda não publicaste nenhuma retoma'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bgOther }]}>
      <Text style={[styles.title, { color: colors.text }]}>Retomas</Text>

      {/* Abas */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.card }, abaAtiva === 'disponiveis' && { backgroundColor: colors.primary }]}
          onPress={() => setAbaAtiva('disponiveis')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textInput },
              abaAtiva === 'disponiveis' && { color: colors.text, fontWeight: 'bold' },
            ]}
          >
            Disponíveis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.card }, abaAtiva === 'minhas' && { backgroundColor: colors.primary }]}
          onPress={() => setAbaAtiva('minhas')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textInput },
              abaAtiva === 'minhas' && { color: colors.text, fontWeight: 'bold' },
            ]}
          >
            Minhas Retomas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {carregando && lista.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Botão de publicar retoma */}
      {abaAtiva === 'minhas' && (
        <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
          <Text style={styles.floatingBtnText}>Publicar retoma</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <NovaRetomaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPublicar={() => {}}
        currentUserName={auth.currentUser?.displayName ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  tabs: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 5 },
  tabText: { fontSize: 16 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center', elevation: 2 },
  icon: { marginRight: 16 },
  cardContent: { flex: 1 },
  itemTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  itemType: { fontSize: 14, marginBottom: 2 },
  itemPoints: { fontSize: 14, marginBottom: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  btnText: { fontSize: 14, fontWeight: '500' },
  floatingBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15,
    position: 'absolute', bottom: 110, alignSelf: 'center', paddingHorizontal: 20, elevation: 5, gap: 8,
  },
  floatingBtnText: { fontSize: 16, fontWeight: '600', color: THEME.dark.text, },
  emptyWrap: { alignItems: 'center', marginTop: 24, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  
});
