// app/UserScreens/detalhesEcoponto.tsx
import { BRAND, RESIDUE_COLORS } from '@/constants/Colors';
import { useTheme, useThemeColor } from '@/hooks/useThemeColor';
import { useUserDoc } from '@/hooks/useUserDoc';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// 🔥 Firestore
import { auth } from '@/firebase';
import {
  subscribePontoRecolhaById,
  updatePontoFavorito,
  type PontoMarker
} from '@/services/FirestoreService';

// 👉 Planeador interno (context)
import { useRoutePlanner } from '@/services/RoutePlannerContext';

export default function DetalhesEcoponto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const pontoId = Array.isArray(id) ? id[0] : id;

  // Tema
  const t = useTheme();
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const card = useThemeColor('card');
  const bg = useThemeColor('bg');

  // Role do user (para mostrar botão Editar)
  const { userDoc } = useUserDoc();
  const isModOrAdmin = useMemo(
    () => ['moderator', 'admin'].includes((userDoc?.role as any) || ''),
    [userDoc?.role]
  );

  const uid = auth.currentUser?.uid;

  const [eco, setEco] = useState<PontoMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);

  // Planeador de rotas (interno)
  const { setDestination, addStop } = useRoutePlanner();

  // subscrição em tempo real ao documento
  useEffect(() => {
    if (!pontoId) return;
    const unsub = subscribePontoRecolhaById(pontoId, (p) => {
      setEco(p);
      setLoading(false);
    });
    return () => unsub();
  }, [pontoId]);

  const isFavorite = useMemo(() => {
    if (!uid) return false;
    const arr = (eco as any)?.favoritos ?? [];
    return Array.isArray(arr) && arr.includes(uid);
  }, [eco, uid]);

  const width = Dimensions.get('window').width;
  const height = Math.round((width * 9) / 16);

  const renderEstrelas = (n?: number) => {
    const val = Math.max(0, Math.min(5, Math.floor(n ?? 0)));
    return (
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= val ? 'star' : 'star-outline'}
            size={26}
            color={BRAND.star}
          />
        ))}
      </View>
    );
  };

  const toggleFavorito = async () => {
    if (!uid) {
      Alert.alert('Sessão necessária', 'Inicie sessão para adicionar aos favoritos.');
      return;
    }
    if (!pontoId) return;

    try {
      setFavLoading(true);
      await updatePontoFavorito(pontoId, uid, !isFavorite);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar favoritos.');
    } finally {
      setFavLoading(false);
    }
  };

  const editarPonto = () => {
    if (!isModOrAdmin || !pontoId) return;
    router.push({ pathname: '/ModScreens/editarEcoponto', params: { id: pontoId } });
  };

  // 👉 Ir para o local (no planeador interno)
  const irParaLocal = () => {
    if (!eco?.latitude || !eco?.longitude) {
      return Alert.alert('Sem coordenadas', 'Este ecoponto não tem localização válida.');
    }
    setDestination({
      id: eco.id,
      nome: eco.nome,
      lat: eco.latitude,
      lng: eco.longitude
    });
    router.push('/UserScreens/planeadorRota'); // garante que este ecrã existe
  };

  // 👉 Adicionar como paragem (no planeador interno)
  const adicionarComoParagem = () => {
    if (!eco?.latitude || !eco?.longitude) {
      return Alert.alert('Sem coordenadas', 'Este ecoponto não tem localização válida.');
    }
    addStop({
      id: eco.id,
      nome: eco.nome,
      lat: eco.latitude,
      lng: eco.longitude
    });
    router.push('/UserScreens/planeadorRota'); // garante que este ecrã existe
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Ecoponto</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ color: muted, marginTop: 10 }}>A carregar…</Text>
        </View>
      </View>
    );
  }

  if (!eco) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Ecoponto</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="alert-circle" size={32} color={muted} />
          <Text style={{ color: muted, marginTop: 8, textAlign: 'center' }}>
            Não foi possível encontrar este ecoponto.
          </Text>
        </View>
      </View>
    );
  }

  const tipos = eco.tipos?.length ? eco.tipos : ['outros'];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detalhes do Ecoponto</Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Editar (mods/admins) */}
          {isModOrAdmin ? (
            <TouchableOpacity onPress={editarPonto}>
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22 }} />
          )}

          {/* Favorito */}
          <TouchableOpacity onPress={toggleFavorito} disabled={favLoading}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#ef4444' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Foto do ponto ou placeholder */}
        {eco.fotoUrl ? (
          <Image source={{ uri: eco.fotoUrl }} style={{ width, height }} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { width, height, borderColor: border, backgroundColor: card }]}>
            <Ionicons name="image" size={32} color={muted} />
            <Text style={{ color: muted, marginTop: 6 }}>
              Ponto de Recolha sem foto
            </Text>
          </View>
        )}

        {/* Conteúdo */}
        <View style={[styles.content]}>
          {/* Título centrado e morada */}
          <Text style={[styles.nome, { color: text }]}>{eco.nome}</Text>
          {!!eco.morada && <Text style={[styles.morada, { color: muted }]}>{eco.morada}</Text>}
          {!!eco.descricao && (
            <Text style={[{ color: text, marginBottom: 16 }]}>{eco.descricao}</Text>
          )}

          {/* Resíduos aceites */}
          <Text style={[styles.subTitle, { color: text }]}>Tipos de resíduos aceites</Text>
          <View style={styles.tiposWrap}>
            {tipos.map((tpo: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.tipoChip,
                  { backgroundColor: '#EEEDD7', borderColor: border }
                ]}
              >
                <View style={[styles.dot, { backgroundColor: RESIDUE_COLORS[tpo] || RESIDUE_COLORS.outros }]} />
                <Text style={[styles.tipoChipText, { color: '#000' }]}>{tpo.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Classificação (placeholder) */}
          <Text style={[styles.subTitle, { color: text }]}>Classificação</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            {renderEstrelas(eco.classificacao)}
            <Text style={[styles.classText, { color: text }]}>
              {(eco.classificacao ?? 0).toFixed(1)}
            </Text>
          </View>

          {/* Ações */}
          <View style={styles.actionsCol}>
            {/* 👉 Agora usa o planeador interno */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: BRAND.primary }]}
              onPress={irParaLocal}
              disabled={eco.latitude == null || eco.longitude == null}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Ir para o local</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: BRAND.accent }]}
              onPress={adicionarComoParagem}
              disabled={eco.latitude == null || eco.longitude == null}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Adicionar como paragem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: BRAND.danger }]}
              onPress={() => router.push(`/UserScreens/report?id=${eco.id}`)}
            >
              <Ionicons name="alert-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Reportar problema</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#111'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1
  },
  content: {
    padding: 18
  },
  nome: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6
  },
  morada: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10
  },
  tiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#EEEDD7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8
  },
  tipoChipText: {
    fontSize: 16,
    fontWeight: '700'
  },
  classText: {
    marginLeft: 8,
    fontWeight: '800',
    fontSize: 18
  },
  actionsCol: {
    marginTop: 6,
    alignItems: 'center'
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '80%'
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16
  }
});
