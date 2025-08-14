// app/SharedScreens/Perfil.tsx
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { BRAND, THEME } from '@/constants/Colors';

export default function Perfil() {
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const T = THEME[scheme];

  return (
    <View style={[styles.wrapper, { backgroundColor: T.bg }]}>
      {/* Header com título e ícones */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>Perfil</Text>
        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: T.border }]}
            onPress={() => router.push('/SharedScreens/editarPerfil')}
          >
            <Feather name="edit-3" size={22} color={T.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: T.border }]}
            onPress={() => router.push('/SharedScreens/definicoes')}
          >
            <Feather name="settings" size={22} color={T.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + Nome e Role */}
      <View style={styles.profileSection}>
        <Image
          source={require('../../assets/placeholder.png')}
          style={[styles.avatar, { backgroundColor: T.card }]}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: T.text }]}>João Moutinho</Text>
          <Text style={[styles.role, { color: T.textMuted }]}>Utilizador</Text>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsSection}>
        <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.statNumber, { color: BRAND.primary }]}>38</Text>
          <Text style={[styles.statLabel, { color: T.text }]}>{'Retomas'}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.statNumber, { color: BRAND.primary }]}>1240</Text>
          <Text style={[styles.statLabel, { color: T.text }]}>{'Pontos'}</Text>
        </View>
      </View>

      {/* Histórico */}
      <View style={styles.historySection}>
        <Text style={[styles.historyTitle, { color: T.text }]}>Histórico</Text>

        <TouchableOpacity
          style={[styles.historyItem, { backgroundColor: T.card, borderColor: T.border }]}
        >
          <Text style={[styles.historyText, { color: T.text }]}>Histórico de Recompensas</Text>
          <Feather name="chevron-right" size={18} color={T.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.historyItem, { backgroundColor: T.card, borderColor: T.border }]}
        >
          <Text style={[styles.historyText, { color: T.text }]}>Histórico de Reciclagem</Text>
          <Feather name="chevron-right" size={18} color={T.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  },
  iconGroup: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 12,
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
  },
  role: {
    fontSize: 16,
  },

  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 6,
  },

  historySection: {
    marginTop: 10,
    gap: 12,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  historyText: {
    fontSize: 16,
  },
});
