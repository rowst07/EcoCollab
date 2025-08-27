// app/SharedScreens/Perfil.tsx
import { useUserDoc } from '@/hooks/useUserDoc';
import { useAuth } from '@/services/AuthContext';
import {
  subscribeMinhasRetomas, // retomas favoritas
  subscribePontosFavoritos,
  subscribeUserFavorites,
  subscribeUserStats,
  type PontoRecolhaDoc, // pontos favoritos
  type RetomaDoc,
  type UserStats,
} from '@/services/FirestoreService';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
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

  const ROLE_LABELS: Record<string, string> = {
    user: 'Utilizador',
    moderator: 'Moderador',
    admin: 'Administrador',
  };

  const [stats, setStats] = useState<UserStats>({ pontosCriados: 0, reportes: 0 });
  const [myRetomasCount, setMyRetomasCount] = useState<number>(0);

  // favoritos
  const [favRetomas, setFavRetomas] = useState<RetomaDoc[]>([]);
  const [favPontos, setFavPontos] = useState<PontoRecolhaDoc[]>([]);

  // tab local
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

  // subscrever retomas favoritas
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserFavorites(user.uid, setFavRetomas);
    return () => unsub();
  }, [user?.uid]);

  // subscrever pontos de recolha favoritos
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribePontosFavoritos(user.uid, setFavPontos);
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

        {/* nº total de retomas do utilizador */}
        <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.statNumber, { color: BRAND.primary }]}>
            {loading ? '—' : myRetomasCount}
          </Text>
          <Text style={[styles.statLabel, { color: T.textInput }]}>Retomas</Text>
          <Text style={{ color: T.textMuted, marginTop: 4, fontSize: 12 }}>Criadas</Text>
        </View>
      </View>

      {/* Tabs: Histórico / Favoritos */}
      <View style={[styles.tabs, { backgroundColor: T.card, borderColor: T.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'historico' && { backgroundColor: T.border }]}
          onPress={() => setActiveTab('historico')}
        >
          <Text
            style={[styles.tabText, { color: activeTab === 'historico' ? T.text : T.textMuted }]}
          >
            Histórico
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'favoritos' && { backgroundColor: T.border }]}
          onPress={() => setActiveTab('favoritos')}
        >
          <Text
            style={[styles.tabText, { color: activeTab === 'favoritos' ? T.text : T.textMuted }]}
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
        // ====== FAVORITOS ======
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Retomas Favoritas */}
          <View style={{ marginTop: 6 }}>
            <Text style={[styles.groupTitle, { color: T.text }]}>Retomas favoritas</Text>
            {favRetomas.length === 0 ? (
              <Text style={[styles.emptyText, { color: T.textMuted }]}>
                Ainda não tens retomas favoritas.
              </Text>
            ) : (
              favRetomas.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => router.push(`/UserScreens/detalhesRetoma?id=${r.id}`)}
                  style={[styles.cardRow, { backgroundColor: T.card, borderColor: T.border }]}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardRowLeft}>
                    <View style={styles.thumb}>
                      {r.fotoUrl ? (
                        <Image source={{ uri: r.fotoUrl }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons name="gift-outline" size={20} color="#999" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.cardTitle, { color: T.textInput }]}>
                        {r.nome}
                      </Text>
                      <Text style={[styles.cardSub, { color: T.textMuted }]}>{r.tipo}</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={T.icon} />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Pontos de Recolha Favoritos */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.groupTitle, { color: T.text }]}>Pontos de recolha favoritos</Text>
            {favPontos.length === 0 ? (
              <Text style={[styles.emptyText, { color: T.textMuted }]}>
                Ainda não tens ecopontos favoritos.
              </Text>
            ) : (
              favPontos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/UserScreens/detalhesEcoponto?id=${p.id}`)}
                  style={[styles.cardRow, { backgroundColor: T.card, borderColor: T.border }]}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardRowLeft}>
                    <View style={styles.thumb}>
                      {p.fotoUrl ? (
                        <Image source={{ uri: p.fotoUrl }} style={styles.thumbImg} />
                      ) : (
                        <Ionicons name="leaf-outline" size={20} color="#999" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.cardTitle, { color: T.textInput }]}>
                        {p.nome}
                      </Text>
                      <Text numberOfLines={1} style={[styles.cardSub, { color: T.textMuted }]}>
                        {p.endereco ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={T.icon} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
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

  // Favoritos
  groupTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },

  cardRow: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
});
