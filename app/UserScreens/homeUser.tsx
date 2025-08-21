import PesquisaModal from '@/components/modals/PesquisaModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

// 🔥 serviço Firestore (novas funções abaixo)
import { subscribePontosRecolha, type PontoMarker } from '@/services/FirestoreService';

const cores: Record<string, string> = {
  papel: '#2196F3',
  plastico: '#FFEB3B',
  vidro: '#4CAF50',
  pilhas: '#F44336',
  organico: '#795548',
  metal: '#9E9E9E',
  outros: '#9C27B0'
};

export default function HomeUser() {
  const router = useRouter();

  const [ecopontos, setEcopontos] = useState<PontoMarker[]>([]);
  const [pesquisaModal, setPesquisaModal] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [historico, setHistorico] = useState<string[]>([]);
  const [filtros, setFiltros] = useState({
    vidro: true,
    papel: true,
    plastico: true,
    metal: true,
    pilhas: true,
    organico: true,
    classificacao: 'todos'
  });

  // 📡 Subscrição Firestore (tempo-real)
  useEffect(() => {
    // Por omissão: só "aprovado". Para incluir "pendente", troca para { statusIn: ['aprovado','pendente'] }
    const unsub = subscribePontosRecolha({
      statusEq: 'aprovado',
      onData: setEcopontos,
    });
    return () => unsub();
  }, []);

  const aplicarPesquisa = () => {
    if (pesquisa.trim() && !historico.includes(pesquisa.trim())) {
      setHistorico([pesquisa.trim(), ...historico]);
    }
    setPesquisaModal(false);
  };

  const filtrados = useMemo(() => {
    return ecopontos.filter(e => {
      const nomeOk = e.nome.toLowerCase().includes(pesquisa.toLowerCase());
      const tipos = e.tipos?.length ? e.tipos : ['outros'];
      const algumTipoAtivo = tipos.some((t: string) => (filtros as any)[t] === true);
      const classOk = filtros.classificacao === 'todos' || (e.classificacao ?? 0) >= Number(filtros.classificacao);
      return nomeOk && algumTipoAtivo && classOk;
    });
  }, [ecopontos, pesquisa, filtros]);

  const abrirDetalhes = (eco: PontoMarker) => {
    router.push(`/UserScreens/detalhesEcoponto?id=${eco.id}`);
  };

  const renderCirculosTipos = (eco: PontoMarker) => {
    const tipos = eco.tipos?.length ? eco.tipos : ['outros'];
    return (
      <View style={styles.circulosRow}>
        {tipos.map((t, idx) => (
          <View key={idx} style={[styles.circulo, { backgroundColor: cores[t] || cores.outros }]} />
        ))}
      </View>
    );
  };

  const renderEstrelas = (n: number | undefined) => {
    const score = Math.max(0, Math.min(5, Math.floor(n ?? 0)));
    const arr = [1, 2, 3, 4, 5];
    return (
      <View style={styles.estrelasRow}>
        {arr.map(i => (
          <Ionicons
            key={i}
            name={i <= score ? 'star' : 'star-outline'}
            size={16}
            color="#FFA000"
          />
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Barra de Pesquisa (abre modal) */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.searchBar} onPress={() => setPesquisaModal(true)}>
          <Ionicons name="search" size={20} color="#888" />
          <Text style={styles.searchPlaceholder}>
            {pesquisa ? pesquisa : 'Pesquisar ecoponto...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 41.805,
          longitude: -6.756,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02
        }}
      >
        {filtrados.map(e => (
          <Marker
            key={e.id}
            coordinate={{ latitude: e.latitude, longitude: e.longitude }}
            onCalloutPress={() => abrirDetalhes(e)}
          >
            <Callout tooltip>
              <View style={styles.calloutCard}>
                <Text style={styles.calloutTitle}>{e.nome}</Text>

                {/* Resíduos (círculos coloridos) */}
                {renderCirculosTipos(e)}

                {/* Classificação (se não tiver, mostra 0) */}
                <View style={styles.classRow}>
                  {renderEstrelas(e.classificacao)}
                  <Text style={styles.classText}>{(e.classificacao ?? 0).toFixed(1)}</Text>
                </View>

                {/* “Botão” visual (sem onPress) */}
                <View style={styles.infoBtn}>
                  <Ionicons name="information-circle" size={18} color="#fff" />
                  <Text style={styles.infoBtnText}>Detalhes</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

      </MapView>

      {/* Botão flutuante para criar novo ponto */}
      <TouchableOpacity
        style={styles.fab}
        // caminho do teu ecrã de criação: está em SharedScreens
        onPress={() => router.push('/UserScreens/criarEcoponto')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Botão “Painel de Moderador” */}
      <TouchableOpacity
        style={styles.modBtn}
        onPress={() => router.push('/ModScreens')}
        accessibilityRole="button"
        accessibilityLabel="Abrir painel de moderador"
      >
        <Text style={styles.modBtnText}>Painel de Moderador</Text>
      </TouchableOpacity>

      {/* Modal de Pesquisa */}
      <PesquisaModal
        visible={pesquisaModal}
        onClose={() => setPesquisaModal(false)}
        pesquisa={pesquisa}
        setPesquisa={setPesquisa}
        aplicarPesquisa={aplicarPesquisa}
        historico={historico}
        setHistorico={setHistorico}
        filtros={filtros}
        setFiltros={setFiltros}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 60,
    left: 5,
    right: 5,
    paddingHorizontal: 10,
    zIndex: 1
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#888',
    fontSize: 16
  },

  // Callout
  calloutCard: {
    minWidth: 230,
    maxWidth: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6
  },
  circulosRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  circulo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#00000020'
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  estrelasRow: {
    flexDirection: 'row',
    marginRight: 6
  },
  classText: {
    color: '#555',
    fontWeight: '600'
  },
  infoBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8
  },
  infoBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: '#2E7D32',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },

  // Botão "Painel de Moderador"
  modBtn: {
    position: 'absolute',
    bottom: 110, // acima da bottom bar
    left: 12,
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 6,
    zIndex: 998,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  modBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  }
});
