// app/SharedScreens/Perfil.tsx
import { useUserDoc } from '@/hooks/useUserDoc';
import { useAuth } from '@/services/AuthContext';
import {
  subscribeMinhasRetomas,
  subscribeUserStats,
  type RetomaDoc,
  type UserStats,
} from '@/services/FirestoreService';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const { userDoc, loading } = useUserDoc();
  const { user } = useAuth();

  // Labels de role (corrigido: 'moderator' em vez de 'mod')
  const ROLE_LABELS: Record<string, string> = {
    user: 'Utilizador',
    moderator: 'Moderador',
    admin: 'Administrador',
  };

  // stats em tempo-real: pontos criados + reportes submetidos
  const [stats, setStats] = useState<UserStats>({ pontosCriados: 0, reportes: 0 });

  // contagem de retomas do utilizador
  const [myRetomasCount, setMyRetomasCount] = useState<number>(0);

  // tab local: histórico | favoritos
  const [activeTab, setActiveTab] = useState<'historico' | 'favoritos'>('historico');

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserStats(user.uid, setStats);
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeMinhasRetomas({
      uid: user.uid,
      onData: (list: RetomaDoc[]) => setMyRetomasCount(list.length),
    });
    return () => unsub();
  }, [user?.uid]);

  const totalIntervencoes = stats.pontosCriados + stats.reportes;

  return (
    <View style={[styles.wrapper, { backgroundColor: THEME.dark.bgOther }]}>
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
        {userDoc?.fotoURL ? (
          <Image
            source={{ uri: userDoc.fotoURL }}
            style={[styles.avatar, { backgroundColor: T.card }]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: T.card, alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <Feather name="user" size={48} color={T.textMuted} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: T.text }]}>{userDoc?.nome || '—'}</Text>
          <Text style={[styles.role, { color: T.textMuted }]}>
            {userDoc?.role ? ROLE_LABELS[userDoc.role] || userDoc.role : ''}
          </Text>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsSection}>
        <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.statNumber, { color: BRAND.primary }]}>
            {loading ? '—' : totalIntervencoes}
          </Text>
          <Text style={[styles.statLabel, { color: T.textInput }]}>Intervenções</Text>
          <Text style={{ color: T.textMuted, marginTop: 4, fontSize: 12 }}>
            {`${stats.pontosCriados} EcoPts + ${stats.reportes} Reportes`}
          </Text>
        </View>

        {/* Substituído: "1240 Pontos" -> nº total de retomas do utilizador */}
        <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.statNumber, { color: BRAND.primary }]}>
            {loading ? '—' : myRetomasCount}
          </Text>
          <Text style={[styles.statLabel, { color: T.textInput }]}>Retomas</Text>
          <Text style={{ color: T.textMuted, marginTop: 4, fontSize: 12 }}>
            Criadas
          </Text>
        </View>
      </View>

      {/* Tabs: Histórico / Favoritos */}
      <View style={[styles.tabs, { backgroundColor: T.card, borderColor: T.border }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'historico' && { backgroundColor: T.border },
          ]}
          onPress={() => setActiveTab('historico')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'historico' ? T.text : T.textMuted },
            ]}
          >
            Histórico
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'favoritos' && { backgroundColor: T.border }]}
          onPress={() => setActiveTab('favoritos')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'favoritos' ? T.text : T.textMuted },
            ]}
          >
            Favoritos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo das tabs */}
      {activeTab === 'historico' ? (
        <View style={styles.historySection}>
          <TouchableOpacity
            style={[styles.historyItem, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <Text style={[styles.historyText, { color: T.textInput }]}>
              Histórico de Recompensas
            </Text>
            <Feather name="chevron-right" size={18} color={T.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyItem, { backgroundColor: T.card, borderColor: T.border }]}
          >
            <Text style={[styles.historyText, { color: T.textInput }]}>
              Histórico de Reciclagem
            </Text>
            <Feather name="chevron-right" size={18} color={T.icon} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.favSection}>
          <Text style={[styles.favInfo, { color: T.textMuted }]}>
            Guarda aqui retomas ou ecopontos para acesso rápido.
          </Text>
          <TouchableOpacity
            style={[styles.favBtn, { backgroundColor: BRAND.primary }]}
            onPress={() => router.push('/UserScreens/favoritos')}
          >
            <Feather name="star" size={18} color="#fff" />
            <Text style={styles.favBtnText}>Ver Favoritos</Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginBottom: 18,
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
    fontSize: 26,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 20,
    marginTop: 6,
  },

  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },

  historySection: {
    marginTop: 4,
    gap: 12,
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

  favSection: {
    marginTop: 6,
    alignItems: 'center',
  },
  favInfo: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  favBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  favBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
