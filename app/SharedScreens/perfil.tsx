import { Feather } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Perfil() {
  return (
    <View style={styles.wrapper}>
      {/* Header com título e ícones */}
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <View style={styles.iconGroup}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="edit-3" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="settings" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + Nome e Role */}
      <View style={styles.profileSection}>
        <Image
          source={require('../../assets/placeholder.png')}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.name}>João Moutinho</Text>
          <Text style={styles.role}>Utilizador</Text>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsSection}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>38</Text>
          <Text style={styles.statLabel}>Retomas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>1240</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
      </View>

      {/* Histórico */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Histórico</Text>
        <TouchableOpacity style={styles.historyItem}>
          <Text style={styles.historyText}>Histórico de Recompensas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyItem}>
          <Text style={styles.historyText}>Histórico de Reciclagem</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100, // espaço para navbar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  iconGroup: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 15,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 40,
    marginRight: 20,
  },
  userInfo: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  role: {
    fontSize: 18,
    color: '#666',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyText: {
    fontSize: 16,
    color: '#333',
  },
});
