import NovaRetomaModal from '@/components/modals/CriarRetomaModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const retomasDisponiveis = [
  {
    id: '1',
    nome: 'Garrafa PET usada',
    tipo: 'Troca',
    pontos: 10,
    icon: 'bottle-soda-classic-outline',
  },
  {
    id: '2',
    nome: 'Tampas plásticas',
    tipo: 'Doação',
    pontos: 0,
    icon: 'recycle',
  },
];

const minhasRetomasIniciais = [
  {
    id: '3',
    nome: 'Cartão velho',
    tipo: 'Doação',
    pontos: 0,
    icon: 'credit-card-outline',
  },
];

export default function Retomas() {
  const [abaAtiva, setAbaAtiva] = useState<'disponiveis' | 'minhas'>('disponiveis');
  const [minhasRetomas, setMinhasRetomas] = useState(minhasRetomasIniciais);
  const [modalVisible, setModalVisible] = useState(false);

  const lista = abaAtiva === 'disponiveis' ? retomasDisponiveis : minhasRetomas;

  const handleNovaRetoma = (nova) => {
    setMinhasRetomas((prev) => [...prev, { ...nova, id: Date.now().toString(), icon: 'recycle' }]);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Retomas</Text>

      {/* Abas */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'disponiveis' && styles.activeTab]}
          onPress={() => setAbaAtiva('disponiveis')}
        >
          <Text style={[styles.tabText, abaAtiva === 'disponiveis' && styles.activeTabText]}>
            Disponíveis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, abaAtiva === 'minhas' && styles.activeTab]}
          onPress={() => setAbaAtiva('minhas')}
        >
          <Text style={[styles.tabText, abaAtiva === 'minhas' && styles.activeTabText]}>
            Minhas Retomas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MaterialCommunityIcons name={item.icon} size={32} color="#2E7D32" style={styles.icon} />
            <View style={styles.cardContent}>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemType}>Tipo: {item.tipo}</Text>
              <Text style={styles.itemPoints}>+{item.pontos} pontos</Text>
              <TouchableOpacity style={styles.btn}>
                <Text style={styles.btnText}>Ver detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Botão de publicar retoma */}
      {abaAtiva === 'minhas' && (
        <TouchableOpacity style={styles.floatingBtn} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.floatingBtnText}>Publicar retoma</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <NovaRetomaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPublicar={handleNovaRetoma}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  icon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemType: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  itemPoints: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  btn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 15,
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    paddingHorizontal: 20,
    elevation: 5,
  },
  floatingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
