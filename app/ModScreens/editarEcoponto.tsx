// app/UserScreens/editarEcoponto.tsx
import { BRAND, RESIDUE_COLORS } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useUserDoc } from '@/hooks/useUserDoc';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Firestore helpers (DOC COMPLETO)
import {
    subscribePontoRecolhaFullById,
    updatePontoRecolha,
    type PontoRecolhaDoc,
    type PontoRecolhaStatus
} from '@/services/FirestoreService';

const ALL_RESIDUOS = [
  'vidro', 'papel', 'plastico', 'metal', 'organico', 'eletronicos', 'textil', 'oleo', 'pilhas', 'outros'
];

export default function EditarEcoponto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const pontoId = Array.isArray(id) ? id[0] : id;

  // Tema
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

  // Estado local editável (doc completo)
  const [doc, setDoc] = useState<PontoRecolhaDoc | null>(null);

  // Campos editáveis locais
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [residuos, setResiduos] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<string>('');   // texto -> convertemos p/ número
  const [longitude, setLongitude] = useState<string>('');
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
        setLatitude(String(d.localizacao?.latitude ?? ''));
        setLongitude(String(d.localizacao?.longitude ?? ''));
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
    setResiduos((prev) => {
      if (prev.includes(key)) return prev.filter((x) => x !== key);
      return [...prev, key];
    });
  };

  const validar = () => {
    if (!nome.trim()) {
      Alert.alert('Validação', 'Indique o nome do ecoponto.');
      return false;
    }
    // lat/lng opcionais, mas se presentes, validar número
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
      // Patch parcial
      const patch: any = {
        nome: nome.trim(),
        endereco: endereco.trim(),
        descricao: descricao.trim(),
        residuos,
        status,
      };

      // Atualizar geoponto (se ambos válidos) — espera-se que o backend/SDK aceite GeoPoint
      const lat = latitude.trim() === '' ? null : Number(latitude);
      const lng = longitude.trim() === '' ? null : Number(longitude);
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        // passamos como objeto; a tua função updatePontoRecolha dá merge e nas rules/SDK deverás converter para GeoPoint
        // (Se já estás a aceitar { localizacao: new GeoPoint(lat,lng) } no client, substitui abaixo)
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

  if (loading) {
    return (
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
    );
  }

  if (!doc) {
    return (
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
    );
  }

  const tipos = residuos.length ? residuos : ['outros'];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header com botões */}
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
        {/* Placeholder de imagem igual ao detalhes (a gestão de foto fica para outra tarefa) */}
        <View
          style={[
            styles.placeholder,
            { width: Dimensions.get('window').width, height: Math.round((Dimensions.get('window').width * 9) / 16), borderColor: border, backgroundColor: card }
          ]}
        >
          <Ionicons name="image" size={32} color={muted} />
          <Text style={{ color: muted, marginTop: 6 }}>Imagem do ecoponto (upload por ligar)</Text>
        </View>

        {/* Conteúdo editável */}
        <View style={styles.content}>
          {/* Nome */}
          <Text style={[styles.label, { color: text }]}>Nome</Text>
          <TextInput
            style={[styles.input, { borderColor: border, backgroundColor: '#111', color: '#fff' }]}
            value={nome}
            onChangeText={setNome}
            placeholder="Nome do ecoponto"
            placeholderTextColor="#888"
          />

          {/* Endereço */}
          <Text style={[styles.label, { color: text, marginTop: 12 }]}>Morada</Text>
          <TextInput
            style={[styles.input, { borderColor: border, backgroundColor: '#111', color: '#fff' }]}
            value={endereco}
            onChangeText={setEndereco}
            placeholder="Rua, nº, localidade"
            placeholderTextColor="#888"
          />

          {/* Descrição */}
          <Text style={[styles.label, { color: text, marginTop: 12 }]}>Descrição</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              { borderColor: border, backgroundColor: '#111', color: '#fff' }
            ]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Informações relevantes…"
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
          />

          {/* Resíduos aceites (chips com toggle) */}
          <Text style={[styles.subTitle, { color: text, marginTop: 16 }]}>Tipos de resíduos aceites</Text>
          <View style={styles.tiposWrap}>
            {ALL_RESIDUOS.map((key) => {
              const active = residuos.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.tipoChip,
                    {
                      backgroundColor: active ? '#EEEDD7' : '#0b0b0b',
                      borderColor: active ? '#d6d3c2' : border
                    }
                  ]}
                  onPress={() => toggleResiduo(key)}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: RESIDUE_COLORS[key] || RESIDUE_COLORS.outros }
                    ]}
                  />
                  <Text style={[styles.tipoChipText, { color: active ? '#000' : '#fff' }]}>
                    {key.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Coordenadas */}
          <Text style={[styles.subTitle, { color: text, marginTop: 8 }]}>Coordenadas</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.labelSm, { color: muted }]}>Latitude</Text>
              <TextInput
                style={[styles.input, { borderColor: border, backgroundColor: '#111', color: '#fff' }]}
                keyboardType="numeric"
                value={latitude}
                onChangeText={setLatitude}
                placeholder="Ex.: 38.7223"
                placeholderTextColor="#888"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.labelSm, { color: muted }]}>Longitude</Text>
              <TextInput
                style={[styles.input, { borderColor: border, backgroundColor: '#111', color: '#fff' }]}
                keyboardType="numeric"
                value={longitude}
                onChangeText={setLongitude}
                placeholder="Ex.: -9.1393"
                placeholderTextColor="#888"
              />
            </View>
          </View>

          {/* Estado */}
          <Text style={[styles.subTitle, { color: text, marginTop: 8 }]}>Estado</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['pendente', 'aprovado', 'reprovado'] as PontoRecolhaStatus[]).map((st) => {
              const active = status === st;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setStatus(st)}
                  style={[
                    styles.statusPill,
                    { borderColor: active ? BRAND.primary : border, backgroundColor: active ? '#112016' : '#0b0b0b' }
                  ]}
                >
                  <Text style={{ color: active ? BRAND.primary : '#fff', fontWeight: '700' }}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Guardar */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: BRAND.primary }]}
            onPress={guardar}
            disabled={saving || !isModOrAdmin}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Guardar alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  labelSm: { fontSize: 12, fontWeight: '700', marginBottom: 6, opacity: 0.9 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15
  },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },

  subTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },

  tiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1
  },
  dot: { width: 18, height: 18, borderRadius: 9, marginRight: 8 },
  tipoChipText: { fontSize: 12, fontWeight: '800' },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1
  },

  saveBtn: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 }
});
