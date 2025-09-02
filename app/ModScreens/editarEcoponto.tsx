// app/ModScreens/editarEcoponto.tsx
import { BRAND, RESIDUE_COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme, useThemeColor } from '@/hooks/useThemeColor';
import { useUserDoc } from '@/hooks/useUserDoc';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import {
  subscribePontoRecolhaFullById,
  updatePontoRecolha,
  type PontoRecolhaDoc,
  type PontoRecolhaStatus
} from '@/services/FirestoreService';

import { MapModal } from '@/components/modals/MapModal';

const ALL_RESIDUOS = [
  'vidro','papel','plastico','metal','organico','eletronicos','textil','oleo','pilhas','outros'
];

export default function EditarEcoponto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const pontoId = Array.isArray(id) ? id[0] : id;

  // Tema
  const t = useTheme();
  const scheme = useColorScheme();
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const card = useThemeColor('card');
  const bg = useThemeColor('bg');

  const { userDoc } = useUserDoc();
  const isModOrAdmin = useMemo(
    () => ['moderator', 'admin'].includes((userDoc?.role as any) || ''),
    [userDoc?.role]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doc, setDoc] = useState<PontoRecolhaDoc | null>(null);

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [residuos, setResiduos] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [showMap, setShowMap] = useState(false);
  const [status, setStatus] = useState<PontoRecolhaStatus>('pendente');

  useEffect(() => {
    if (!pontoId) return;
    const unsub = subscribePontoRecolhaFullById(pontoId, (d) => {
      setDoc(d);
      setLoading(false);
      if (d) {
        setNome(d.nome ?? '');
        setEndereco(d.endereco ?? '');
        setDescricao(d.descricao ?? '');
        setResiduos(Array.isArray(d.residuos) ? d.residuos : []);
        setLatitude(d.localizacao?.latitude != null ? String(d.localizacao.latitude) : '');
        setLongitude(d.localizacao?.longitude != null ? String(d.localizacao.longitude) : '');
        setStatus(d.status ?? 'pendente');
      }
    });
    return () => unsub();
  }, [pontoId]);

  useEffect(() => {
    if (!isModOrAdmin && !loading) {
      Alert.alert('Sem permissão', 'Apenas moderadores e administradores podem editar ecopontos.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [isModOrAdmin, loading]);

  const width = Dimensions.get('window').width;
  const height = Math.round((width * 9) / 16);

  const toggleResiduo = (key: string) => {
    setResiduos((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const validar = () => {
    if (!nome.trim()) {
      Alert.alert('Validação', 'Indique o nome do ecoponto.');
      return false;
    }
    const lat = latitude.trim() === '' ? null : Number(latitude);
    const lng = longitude.trim() === '' ? null : Number(longitude);
    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      Alert.alert('Validação', 'Latitude inválida (-90 a 90).');
      return false;
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      Alert.alert('Validação', 'Longitude inválida (-180 a 180).');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!pontoId || !validar()) return;
    if (!isModOrAdmin) return;
    try {
      setSaving(true);
      const patch: any = {
        nome: nome.trim(),
        endereco: endereco.trim(),
        descricao: descricao.trim(),
        residuos,
        status,
      };
      const lat = latitude.trim() === '' ? null : Number(latitude);
      const lng = longitude.trim() === '' ? null : Number(longitude);
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        patch.localizacao = { latitude: lat, longitude: lng };
      }
      await updatePontoRecolha(pontoId, patch);
      Alert.alert('Guardado', 'Ecoponto atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.error('updatePontoRecolha error', e);
      Alert.alert('Erro', e?.message ?? 'Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- RENDER ----------
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Ecoponto</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ color: muted, marginTop: 10 }}>A carregar…</Text>
          </View>
        </View>
      </>
    );
  }

  if (!doc) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Ecoponto</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Ionicons name="alert-circle" size={32} color={muted} />
            <Text style={{ color: muted, marginTop: 8, textAlign: 'center' }}>
              Não foi possível encontrar este ecoponto.
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header personalizado (preto) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Ecoponto</Text>
          <TouchableOpacity onPress={guardar} disabled={saving || !isModOrAdmin}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="save-outline" size={24} color={isModOrAdmin ? '#fff' : '#666'} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Placeholder da imagem */}
          <View style={[styles.placeholder, { width, height, borderColor: border, backgroundColor: card }]}>
            <Ionicons name="image" size={32} color={muted} />
            <Text style={{ color: muted, marginTop: 6 }}>Imagem do ecoponto (upload por ligar)</Text>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            <Text style={[styles.nome, { color: text }]}>{nome || 'Ecoponto'}</Text>

            <Text style={[styles.subTitle, { color: text }]}>Morada</Text>
            <TextInput
              style={[styles.input, { borderColor: border, backgroundColor: '#EEEDD7', color: '#000' }]}
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Rua, nº, localidade"
              placeholderTextColor="#555"
            />

            <Text style={[styles.subTitle, { color: text }]}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { borderColor: border, backgroundColor: '#EEEDD7', color: '#000' }]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Informações relevantes…"
              placeholderTextColor="#555"
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.subTitle, { color: text }]}>Tipos de resíduos aceites</Text>
            <View style={styles.tiposWrap}>
              {ALL_RESIDUOS.map((key) => {
                const active = residuos.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tipoChip, { backgroundColor: '#EEEDD7', borderColor: border }]}
                    onPress={() => toggleResiduo(key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.dot, { backgroundColor: RESIDUE_COLORS[key] || RESIDUE_COLORS.outros }]} />
                    <Text style={[styles.tipoChipText, { color: '#000', opacity: active ? 1 : 0.5 }]}>
                      {key.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.subTitle, { color: text }]}>Localização</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BRAND.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16 }}
                onPress={() => setShowMap(true)}
              >
                <Ionicons name="map" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Escolher no mapa</Text>
              </TouchableOpacity>
              <Text style={{ color: muted, fontSize: 13 }}>
                {latitude && longitude ? `Lat: ${latitude}, Lng: ${longitude}` : 'Sem localização definida'}
              </Text>
            </View>

            <Text style={[styles.subTitle, { color: text }]}>Estado</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              {(['pendente', 'aprovado', 'reprovado'] as PontoRecolhaStatus[]).map((st) => {
                const active = status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatus(st)}
                    style={[
                      styles.statusPill,
                      {
                        borderColor: active ? BRAND.primary : border, // ⬅️ usa a variável, sem chamar hook aqui
                        backgroundColor: active ? '#112016' : '#0b0b0b'
                      }
                    ]}
                  >
                    <Text style={{ color: active ? BRAND.primary : '#fff', fontWeight: '700' }}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: BRAND.primary }]}
                onPress={guardar}
                disabled={saving || !isModOrAdmin}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Guardar alterações</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <MapModal
          visible={showMap}
          onClose={() => setShowMap(false)}
          onConfirm={(coords) => {
            setLatitude(String(coords.lat));
            setLongitude(String(coords.lng));
            setShowMap(false);
          }}
          initialCoord={latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : null}
          scheme={scheme}
        />
      </View>
    </>
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
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12
  },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  tiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18
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
  dot: { width: 18, height: 18, borderRadius: 9, marginRight: 8 },
  tipoChipText: { fontSize: 16, fontWeight: '700' },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1
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
