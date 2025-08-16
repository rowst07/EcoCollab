import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ModHome() {
  const router = useRouter();

  const Card = ({
    icon, title, subtitle, to,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    to: '/ModScreens/mensagens' | '/ModScreens/utilizadores' | '/ModScreens/pontos';
  }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: to })}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={22} color="#2E7D32" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#2E7D32" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* LOGO + EcoCollab (logo por baixo do header verde) */}
      <View style={styles.brandBar}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandText}>EcoCollab</Text>
      </View>

      <Text style={styles.headerTitle}>Painel de Moderador</Text>
      <Text style={styles.headerSub}>Escolhe uma secção para gerir</Text>

      <View style={{ height: 16 }} />

      <Card
        icon="chatbubbles-outline"
        title="Mensagens"
        subtitle="Ver e tratar reportes dos membros"
        to="/ModScreens/mensagens"
      />
      <Card
        icon="people-outline"
        title="Gestão de Utilizadores"
        subtitle="Editar, remover e ver detalhes"
        to="/ModScreens/utilizadores"
      />
      <Card
        icon="location-outline"
        title="Gestão de Pontos"
        subtitle="Adicionar, editar ou eliminar pontos"
        to="/ModScreens/pontos"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },

  // brand bar
  brandBar: {
    backgroundColor: '#EFEADB',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCBBF',
    marginHorizontal: -16, // esticar a faixa até às margens
    marginTop: -16,        // colar mais ao header
    marginBottom: 12,
  },
  brandLogo: { width: 200, height: 99, marginBottom: -30, marginTop:-20  }, // logo maior
  brandText: { fontSize: 22, fontWeight: '800', color: '#2E7D32' },

  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2E7D32' },
  headerSub: { fontSize: 14, color: '#666', marginTop: 4 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EAF4EC',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 2 },
});
