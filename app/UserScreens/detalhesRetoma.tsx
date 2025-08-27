import { THEME } from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { auth } from '@/firebase';
import {
  getUserMinimalDoc,
  subscribeRetomaById,
  updateRetomaFavorite,
  type RetomaDoc,
} from '@/services/FirestoreService';

/* util */
function getIconForTipo(tipo?: string, fallbackIcon?: string) {
  if (fallbackIcon) return fallbackIcon as any;
  const t = (tipo || '').toLowerCase();
  if (t === 'troca') return 'swap-horizontal' as any;
  return 'gift-outline' as any;
}
type Estado = 'Ativa' | 'Reservada' | 'Concluída';

export default function DetalhesRetoma() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = THEME[scheme];
  const router = useRouter();

  const { id: idParam } = useLocalSearchParams();
  const id = typeof idParam === 'string' ? idParam : undefined;

  const [loading, setLoading] = useState(true);
  const [retoma, setRetoma] = useState<RetomaDoc | null>(null);
  const [autorNome, setAutorNome] = useState<string>('—');
  const uid = auth.currentUser?.uid;

  const isOwner = useMemo(
    () => !!uid && !!retoma?.criadoPor && uid === retoma.criadoPor,
    [uid, retoma?.criadoPor]
  );

  // favorito (derivado do doc)
  const isFavorite = useMemo(() => {
    if (!uid) return false;
    const arr = retoma?.favoritos ?? [];
    return Array.isArray(arr) && arr.includes(uid);
  }, [retoma?.favoritos, uid]);

  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = subscribeRetomaById(id, async (doc) => {
      setRetoma(doc);
      setLoading(false);

      if (doc?.criadoPor) {
        const u = await getUserMinimalDoc(doc.criadoPor);
        setAutorNome(u?.nome ?? doc.criadoPorDisplay ?? 'Utilizador');
      } else {
        setAutorNome(doc?.criadoPorDisplay ?? 'Utilizador');
      }
    });
    return () => unsub();
  }, [id]);

  const toggleFavorite = async () => {
    if (!uid) {
      Alert.alert('Sessão necessária', 'Inicie sessão para adicionar aos favoritos.');
      return;
    }
    if (!id) return;

    try {
      setFavLoading(true);
      await updateRetomaFavorite(id, uid, !isFavorite);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar favoritos.');
    } finally {
      setFavLoading(false);
    }
  };

  // Galeria completa
  const gallery = useMemo(() => {
    const arr = Array.isArray((retoma as any)?.fotos) ? ((retoma as any).fotos as string[]) : [];
    if (arr.length > 0) return arr;
    return retoma?.fotoUrl ? [retoma.fotoUrl] : [];
  }, [retoma]);

  const capa = gallery[0] ?? null;
  const thumbs = gallery.slice(1);
  const tipoIcon = getIconForTipo(retoma?.tipo, retoma?.icon);

  // Fullscreen viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const openViewerAt = (idx: number) => { setViewerIndex(idx); setViewerOpen(true); };
  const closeViewer = () => setViewerOpen(false);
  const prevImg = () => setViewerIndex((i) => Math.max(0, i - 1));
  const nextImg = () => setViewerIndex((i) => Math.min(gallery.length - 1, i + 1));

  const handlePrimaria = () => {
    if (retoma?.tipo?.toLowerCase() === 'troca') {
      Alert.alert('Propor troca', 'Funcionalidade por ligar à conversa/proposta.');
    } else {
      Alert.alert('Quero doar', 'Funcionalidade por ligar à conversa/confirmação.');
    }
  };

  const handleContactar = () => {
    Alert.alert('Contactar', 'Abrir chat interno — por implementar.');
  };

  const editar = () => {
    if (!id) return;
    router.push({ pathname: '/UserScreens/editarRetoma', params: { id } });
  };

  if (loading) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!retoma) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 12 }}>
          Não foi possível carregar a retoma.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.primary }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Detalhes
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Coração de favoritos */}
          <TouchableOpacity style={styles.iconBtn} onPress={toggleFavorite} disabled={favLoading}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ef4444' : colors.text}
            />
          </TouchableOpacity>

          {/* Editar */}
          <TouchableOpacity style={styles.iconBtn} onPress={editar}>
            <Ionicons name="create-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={tipoIcon} size={34} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textInput }]} numberOfLines={2}>
                {retoma.nome}
              </Text>

              <View style={styles.badgesRow}>
                <View style={[styles.chip, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.chipText, { color: colors.text }]}>{retoma.tipo}</Text>
                </View>

                <View style={[styles.chip, { backgroundColor: colors.card }]}>
                  <MaterialCommunityIcons
                    name="star-circle-outline"
                    size={16}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.chipText, { color: colors.textInput }]}>
                    +{retoma.pontos ?? 0} pts
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        retoma.estado === 'Concluída' ? '#8E8E93'
                        : retoma.estado === 'Reservada' ? '#FFCC00'
                        : '#34C759',
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.textInput }]}>
                  {(retoma.estado as Estado) ?? 'Ativa'}
                </Text>
              </View>
            </View>
          </View>

          {/* Capa */}
          {capa ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => openViewerAt(0)}>
              <Image source={{ uri: capa }} style={styles.cover} />
            </TouchableOpacity>
          ) : null}

          {/* Thumbs */}
          {thumbs.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
              {thumbs.map((url, idx) => (
                <TouchableOpacity key={url} onPress={() => openViewerAt(idx + 1)} activeOpacity={0.85}>
                  <Image source={{ uri: url }} style={styles.thumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Ações principais */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handlePrimaria}
            >
              <Text style={[styles.primaryBtnText, { color: colors.text }]}>
                {retoma.tipo?.toLowerCase() === 'troca' ? 'Propor troca' : 'Quero doar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
              onPress={handleContactar}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informação */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Informação</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Quantidade</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>
              {typeof (retoma as any).quantidade === 'number'
                ? (retoma as any).quantidade
                : (retoma as any).quantidade ?? '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Condição</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{retoma.condicao ?? '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Entrega</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{retoma.entrega ?? '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Local</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{retoma.local ?? '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Anunciante</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{autorNome}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Validade</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>
              {retoma && (retoma as any).validade
                ? ((): string => {
                    const v = (retoma as any).validade as string;
                    const d = new Date(v);
                    if (!isNaN(d.getTime())) {
                      const dd = String(d.getDate()).padStart(2, '0');
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const yy = d.getFullYear();
                      return `${dd}/${mm}/${yy}`;
                    }
                    return v;
                  })()
                : '—'}
            </Text>
          </View>
        </View>

        {/* Descrição */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Descrição</Text>
          <Text style={[styles.description, { color: colors.textInput }]}>
            {retoma.descricao ?? 'Sem descrição.'}
          </Text>
        </View>

        {/* Preferências & tags */}
        {(retoma.preferencias || (retoma.tags ?? []).length > 0) && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Preferências & Tags</Text>
            {retoma.preferencias ? (
              <Text style={[styles.description, { color: colors.textInput }]}>{retoma.preferencias}</Text>
            ) : null}
            {(retoma.tags ?? []).length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {(retoma.tags ?? []).map((t) => (
                  <View key={t} style={[styles.tag, { borderColor: colors.primary }]}>
                    <Text style={{ color: colors.textInput, fontWeight: '600' }}>#{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* Ações do proprietário */}
        {isOwner && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Gestão</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.ownerBtn, { borderColor: colors.primary }]}
                onPress={editar}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.ownerBtnText, { color: colors.primary }]}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ------- FULLSCREEN IMAGE VIEWER ------- */}
      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeViewer}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop} />
          <Image source={{ uri: gallery[viewerIndex] }} style={styles.viewerImage} resizeMode="contain" />

          <View style={styles.overlay} pointerEvents="box-none">
            <TouchableOpacity style={styles.viewerClose} onPress={closeViewer} hitSlop={12}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            {gallery.length > 1 && (
              <>
                <Pressable
                  onPress={prevImg}
                  style={[styles.navZone, styles.leftZone]}
                  pointerEvents={viewerIndex === 0 ? 'none' : 'auto'}
                >
                  <Ionicons
                    name="chevron-back"
                    size={34}
                    color={viewerIndex === 0 ? '#ffffff55' : '#fff'}
                  />
                </Pressable>

                <Pressable
                  onPress={nextImg}
                  style={[styles.navZone, styles.rightZone]}
                  pointerEvents={viewerIndex >= gallery.length - 1 ? 'none' : 'auto'}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={34}
                    color={viewerIndex >= gallery.length - 1 ? '#ffffff55' : '#fff'}
                  />
                </Pressable>
              </>
            )}

            <View style={styles.viewerIndicator}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {viewerIndex + 1} / {gallery.length}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const THUMB = 92;

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 120 },

  card: { borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    marginRight: 12, backgroundColor: '#EEEDD7',
  },
  title: { fontSize: 18, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  cover: { width: '100%', height: 220, borderRadius: 12, marginTop: 12 },
  thumb: { width: THUMB, height: THUMB, borderRadius: 10 },

  actionsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  primaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexDirection: 'row', gap: 6,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, opacity: 0.9 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 20 },
  tag: { borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },

  ownerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  ownerBtnText: { fontSize: 14, fontWeight: '700' },

  // Fullscreen viewer
  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000E6' },
  viewerImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject },
  viewerClose: { position: 'absolute', top: 46, right: 16, padding: 10 },

  navZone: {
    position: 'absolute', top: 0, bottom: 0, width: '35%', justifyContent: 'center', alignItems: 'center',
  },
  leftZone: { left: 0 },
  rightZone: { right: 0 },

  viewerIndicator: {
    position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#00000080',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
});
