import PesquisaModal from '@/components/modals/PesquisaModal';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function HomeUser() {
  const [ecopontos, setEcopontos] = useState([]);
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

  useEffect(() => {
    setEcopontos([
      { id: 1, nome: 'Ecoponto Vidro Centro', tipo: 'vidro', classificacao: 4, latitude: 41.805, longitude: -6.756 },
      { id: 2, nome: 'Ecoponto Papel Escola', tipo: 'papel', classificacao: 3, latitude: 41.808, longitude: -6.754 },
    ]);
  }, []);

  const aplicarPesquisa = () => {
    if (pesquisa.trim() && !historico.includes(pesquisa.trim())) {
      setHistorico([pesquisa.trim(), ...historico]);
    }
    setPesquisaModal(false);
  };

  const filtrados = ecopontos.filter(e =>
    e.nome.toLowerCase().includes(pesquisa.toLowerCase()) &&
    filtros[e.tipo] &&
    (filtros.classificacao === 'todos' || e.classificacao >= Number(filtros.classificacao))
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Barra de Pesquisa */}
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
            title={e.nome}
            description={`Tipo: ${e.tipo} | Classificação: ${e.classificacao}`}
          />
        ))}
      </MapView>

      {/* Botão flutuante para criar novo ponto */}
      <TouchableOpacity style={styles.fab} onPress={() => console.log('Criar novo ponto')}>
        <Ionicons name="add" size={28} color="#fff" />
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
  }
});
