import { BRAND, THEME } from '@/constants/Colors';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { auth } from '@/firebase';
import {
    getUserMinimalDoc,
    subscribeRetomaById,
    updateRetomaPartial,
    type RetomaDoc,
} from '@/services/FirestoreService';
import { CLOUDINARY_UPLOAD_PRESET, uploadToCloudinary } from '@/services/uploadCloudinary';

import { SimpleSelect } from '@/components/SimpleSelect';
import { MapModal } from '@/components/modals/MapModal';

/* ---------- helpers ---------- */
type Estado = 'Ativa' | 'Reservada' | 'Concluída';
type Role = 'user' | 'moderator' | 'admin';

function getIconForTipo(tipo?: string, fallbackIcon?: string) {
  if (fallbackIcon) return fallbackIcon as any;
  const t = (tipo || '').toLowerCase();
  if (t === 'troca') return 'swap-horizontal' as any;
  return 'gift-outline' as any;
}

function Chip({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

// Parse seguro: aceita 'YYYY-MM-DD' ou 'DD/MM/YYYY'
function parseDateSafe(input?: string | null): Date | null {
  if (!input || typeof input !== 'string') return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(input)) {
    const d = new Date(input + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  const pt = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const m = input.match(pt);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    const yyyy = parseInt(m[3], 10);
    const d = new Date(yyyy, mm, dd, 0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
function formatDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateHuman(isoOrPt?: string | null) {
  const d = parseDateSafe(isoOrPt ?? undefined);
  if (!d) return 'Sem data';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* ---------- página ---------- */
export default function EditarRetoma() {
  const scheme = (useColorScheme() === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const colors = THEME[scheme];

  const router = useRouter();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<RetomaDoc | null>(null);
  const [role, setRole] = useState<Role>('user');

  // form
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidadeNum, setQuantidadeNum] = useState(0);
  const [condicao, setCondicao] = useState('Usado');
  const [entrega, setEntrega] = useState('Levantamento');
  const [local, setLocal] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [estado, setEstado] = useState<Estado>('Ativa');

  // FOTOS (galeria) — ESTRATÉGIA “STAGED”: só faz upload no Guardar
  const [originalFotos, setOriginalFotos] = useState<string[]>([]);
  const [stagedFotos, setStagedFotos] = useState<string[]>([]);
  const [validade, setValidade] = useState<string | null>(null);

  // coords
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [mapOpen, setMapOpen] = useState(false);

  // “hero”
  const [tipo, setTipo] = useState<'Troca' | 'Doação' | string>('Troca');
  const [pontos, setPontos] = useState<number>(0);
  const [icon, setIcon] = useState<string | undefined>(undefined);

  const uid = auth.currentUser?.uid;
  const isOwner = useMemo(() => uid && doc?.criadoPor && uid === doc?.criadoPor, [uid, doc?.criadoPor]);
  const isModOrAdmin = role === 'moderator' || role === 'admin';

  useEffect(() => {
    if (!uid) return;
    getUserMinimalDoc(uid).then((u) => setRole((u?.role as Role) ?? 'user'));
  }, [uid]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = subscribeRetomaById(id, (d) => {
      setDoc(d);
      if (d) {
        setNome(d.nome ?? '');
        setDescricao(d.descricao ?? '');
        const q = (d as any).quantidade;
        const qNum =
          typeof q === 'number'
            ? q
            : typeof q === 'string'
            ? parseInt(q.replace(/\D+/g, ''), 10) || 0
            : 0;
        setQuantidadeNum(qNum);

        setCondicao(d.condicao ?? 'Usado');
        setEntrega(d.entrega ?? 'Levantamento');
        setLocal(d.local ?? '');
        setPreferencias(d.preferencias ?? '');
        setTagsStr((d.tags ?? []).join(', '));
        setEstado(((d.estado as Estado) ?? 'Ativa'));

        // FOTOS: usa d.fotos[] se existir; fallback para d.fotoUrl
        const arr = Array.isArray((d as any).fotos) ? ((d as any).fotos as string[]) : [];
        const initial = arr.length > 0 ? arr : (d.fotoUrl ? [d.fotoUrl] : []);
        setOriginalFotos(initial);
        setStagedFotos(initial);

        setTipo(d.tipo ?? 'Troca');
        setPontos(d.pontos ?? 0);
        setIcon(d.icon ?? undefined);

        setLat((d as any).lat);
        setLng((d as any).lng);
        setValidade((d as any).validade ?? null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const tipoIcon = getIconForTipo(tipo, icon);

  /* ---------- FOTOS (staged): adicionar, remover uma, remover todas ---------- */
  const escolherImagens = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled || result.assets.length === 0) return;

    // NÃO faz upload aqui — apenas adiciona local URIs ao staged
    const localUris = result.assets.map(a => a.uri);
    setStagedFotos(prev => [...prev, ...localUris]);
  };

  const removerUmaFoto = (url: string) => {
    setStagedFotos(prev => prev.filter(f => f !== url));
  };

  const removerTodasFotos = () => {
    Alert.alert('Remover todas as fotos?', 'Esta ação não pode ser desfeita ao guardar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover tudo', style: 'destructive', onPress: () => setStagedFotos([]) },
    ]);
  };

  /* ---------- quantidade / data / mapa ---------- */
  const incQtd = (delta: number) => {
    setQuantidadeNum((n) => Math.max(0, n + delta));
  };
  const [showDate, setShowDate] = useState(false);
  const onPickDate = (evt: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (evt.type === 'dismissed') return;
    if (d) setValidade(formatDateISO(d));
  };
  const abrirMapa = () => setMapOpen(true);
  const fecharMapa = () => setMapOpen(false);
  const confirmarMapa = (coords: { lat: number; lng: number }, address: string) => {
    setLat(coords.lat);
    setLng(coords.lng);
    if (address) setLocal(address);
    fecharMapa();
  };

  /* ---------- guardar ---------- */
  const guardar = async () => {
    if (!doc || !id) return;
    if (!isOwner && !isModOrAdmin) {
      Alert.alert('Sem permissão', 'Não tens permissão para editar esta retoma.');
      return;
    }
    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'Indica um nome para a retoma.');
      return;
    }

    try {
      setSaving(true);

      // 1) Fazer upload de todas as staged fotos que sejam locais (file:// ou content://)
      const isLocal = (u: string) => /^file:|^content:/.test(u);
      const locals = stagedFotos.filter(isLocal);

      let uploadedMap: Record<string, string> = {};
      if (locals.length > 0) {
        const uploads = locals.map(localUri =>
          uploadToCloudinary(localUri, {
            folder: `retomas/${id}/gallery`,
            uploadPreset: CLOUDINARY_UPLOAD_PRESET,
            publicId: `foto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            tags: ['retoma', id],
            contentType: 'image/jpeg',
            context: { app: 'ecocollab', entity: 'retoma' },
          }).then(out => ({ localUri, url: out.secure_url }))
        );
        const results = await Promise.all(uploads);
        results.forEach(({ localUri, url }) => { uploadedMap[localUri] = url; });
      }

      // 2) Construir a nova lista final de fotos (substitui locais pelos URLs)
      const finalFotos = stagedFotos.map(u => uploadedMap[u] ?? u);
      const finalFotoUrl = finalFotos[0] ?? null;

      // 3) Construir patch do resto dos campos
      const patch: Partial<RetomaDoc> = {};
      const push = (k: keyof RetomaDoc, v: any, current: any) => {
        if (v !== current) (patch as any)[k] = v;
      };

      push('nome', nome.trim(), doc.nome);
      push('descricao', descricao.trim(), doc.descricao ?? '');

      const currentQtd =
        typeof (doc as any).quantidade === 'number'
          ? (doc as any).quantidade
          : typeof (doc as any).quantidade === 'string'
          ? parseInt(String((doc as any).quantidade).replace(/\D+/g, ''), 10) || 0
          : 0;
      if (quantidadeNum !== currentQtd) (patch as any).quantidade = quantidadeNum;

      push('condicao', condicao, doc.condicao ?? 'Usado');
      push('entrega', entrega, doc.entrega ?? 'Levantamento');
      push('local', local.trim(), doc.local ?? '');
      push('preferencias', preferencias.trim(), doc.preferencias ?? '');

      const tagsArr = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
      if (JSON.stringify(tagsArr) !== JSON.stringify(doc.tags ?? [])) {
        (patch as any).tags = tagsArr;
      }

      // fotos (comparar com original)
      if (JSON.stringify(finalFotos) !== JSON.stringify(originalFotos)) {
        (patch as any).fotos = finalFotos;
        (patch as any).fotoUrl = finalFotoUrl;
      }

      const dLat = (doc as any).lat;
      const dLng = (doc as any).lng;
      if (typeof lat === 'number' && lat !== dLat) (patch as any).lat = lat;
      if (typeof lng === 'number' && lng !== dLng) (patch as any).lng = lng;

      const dVal = (doc as any).validade ?? null;
      if ((validade ?? null) !== (dVal ?? null)) {
        (patch as any).validade = validade ?? null;
      }

      if (isModOrAdmin) {
        push('estado', estado, doc.estado ?? 'Ativa');
      }

      if (Object.keys(patch).length === 0) {
        Alert.alert('Nada para guardar', 'Não existem alterações.');
        setSaving(false);
        return;
      }

      // 4) Update Firestore
      await updateRetomaPartial(id, patch);
      Alert.alert('Guardado', 'Retoma atualizada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.warn('Erro a guardar retoma:', e);
      Alert.alert('Erro', e?.message ?? 'Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- loading / erro ---------- */
  if (loading) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!doc) {
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

  /* ---------- UI ---------- */
  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Editar Retoma
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={getIconForTipo(tipo, icon)} size={34} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={nome}
                  onChangeText={setNome}
                  style={styles.titleInput}
                  placeholder="Nome da retoma"
                  placeholderTextColor={THEME.dark.inputBorder}
                />
                <View style={styles.badgesRow}>
                  <Chip bg={colors.primary} color={colors.text}>{tipo}</Chip>
                  <View style={[styles.chip, { backgroundColor: colors.card }]}>
                    <MaterialCommunityIcons
                      name="star-circle-outline"
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, { color: colors.textInput }]}>+{pontos} pts</Text>
                  </View>

                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          estado === 'Concluída'
                            ? '#8E8E93'
                            : estado === 'Reservada'
                            ? '#FFCC00'
                            : '#34C759',
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: colors.textInput }]}>{estado}</Text>
                </View>
              </View>
            </View>

            {/* GALERIA (staged) */}
            {stagedFotos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingTop: 12 }}
              >
                {stagedFotos.map((url) => (
                  <View key={url} style={styles.thumbWrap}>
                    <Image source={{ uri: url }} style={styles.thumb} />
                    <TouchableOpacity
                      onPress={() => removerUmaFoto(url)}
                      style={styles.thumbRemove}
                      accessibilityLabel="Remover foto"
                    >
                      <Feather name="x" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.primary }]}
                onPress={escolherImagens}
                disabled={saving}
              >
                <Ionicons name="images-outline" size={16} color={colors.primary} />
                <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                  Adicionar fotos
                </Text>
              </TouchableOpacity>

              {stagedFotos.length > 0 && (
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: '#D32F2F' }]}
                  onPress={removerTodasFotos}
                  disabled={saving}
                >
                  <Ionicons name="trash-outline" size={16} color="#D32F2F" />
                  <Text style={[styles.secondaryBtnText, { color: '#D32F2F' }]}>Remover todas</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Informação */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Informação</Text>

            {/* Quantidade */}
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Quantidade</Text>
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                onPress={() => incQtd(-1)}
                style={[styles.stepperBtn, { backgroundColor: colors.primary }]}
                disabled={quantidadeNum <= 0}
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: colors.textInput }]}>{quantidadeNum}</Text>
              <TouchableOpacity
                onPress={() => incQtd(1)}
                style={[styles.stepperBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Condição */}
            <Text style={[styles.infoLabel, { color: THEME.dark.textInput, marginTop: 12 }]}>Condição</Text>
            <View style={styles.fullWidth}>
              <SimpleSelect
                value={condicao}
                onChange={setCondicao}
                options={[
                  { value: 'Usado', label: 'Usado' },
                  { value: 'Como novo', label: 'Como novo' },
                  { value: 'Novo', label: 'Novo' },
                  { value: 'Para reciclar', label: 'Para reciclar' },
                ]}
                placeholder="Selecionar condição"
              />
            </View>

            {/* Entrega */}
            <Text style={[styles.infoLabel, { color: colors.textInput, marginTop: 12 }]}>Entrega</Text>
            <View style={styles.fullWidth}>
              <SimpleSelect
                value={entrega}
                onChange={setEntrega}
                options={[
                  { value: 'Levantamento', label: 'Levantamento' },
                  { value: 'Entrega a combinar', label: 'Entrega a combinar' },
                  { value: 'Envio', label: 'Envio' },
                ]}
                placeholder="Selecionar entrega"
              />
            </View>

            {/* Local + MapModal */}
            <Text style={[styles.infoLabel, { color: colors.textInput, marginTop: 12 }]}>Local</Text>
            <TextInput
              value={local}
              onChangeText={setLocal}
              style={styles.input}
              placeholder="Ex: Centro, Bragança"
              placeholderTextColor={THEME.dark.textInput}
            />
            <TouchableOpacity style={[styles.mapBtn, { backgroundColor: colors.primary }]} onPress={abrirMapa}>
              <Ionicons name="map" size={16} color={colors.text} />
              <Text style={[styles.mapBtnText, { color: colors.text }]}>Apontar no mapa</Text>
            </TouchableOpacity>

            {/* Validade */}
            <Text style={[styles.infoLabel, { color: colors.textInput, marginTop: 12 }]}>Validade</Text>
            <View style={styles.rowInline}>
              <TextInput
                value={formatDateHuman(validade)}
                editable={false}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity
                onPress={() => setShowDate(true)}
                style={[styles.mapBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="calendar" size={16} color={colors.text} />
                <Text style={[styles.mapBtnText, { color: colors.text }]}>Escolher</Text>
              </TouchableOpacity>
            </View>
            {showDate && (
              <DateTimePicker
                value={parseDateSafe(validade) ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onPickDate}
              />
            )}
          </View>

          {/* Descrição */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Descrição</Text>
            <Text style={[styles.helper, { color: colors.textInput }]}>
              Dá pormenores sobre o estado, dimensões, material, etc.
            </Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              style={styles.descriptionInput}
              placeholder="Descreve o estado, dimensões, etc."
              placeholderTextColor={THEME.dark.textInput}
              multiline
            />
          </View>

          {/* Preferências & Tags */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Preferências & Tags</Text>

            <Text style={[styles.helper, { color: colors.textInput }]}>
              Preferências de troca — ex.: “Troco por tampas”, “Aceito doação”.
            </Text>
            <TextInput
              value={preferencias}
              onChangeText={setPreferencias}
              style={styles.input}
              placeholder="Ex: Troco por tampas; aceito doação"
              placeholderTextColor={THEME.dark.textInput}
            />

            <Text style={[styles.helper, { color: colors.textInput, marginTop: 10 }]}>
              Tags — palavras-chave separadas por vírgulas (ex.: plástico, PET, garrafa).
            </Text>
            <TextInput
              value={tagsStr}
              onChangeText={setTagsStr}
              style={styles.input}
              placeholder="Tags separadas por vírgulas (ex: plástico, PET, garrafa)"
              placeholderTextColor={THEME.dark.text}
              autoCapitalize="none"
            />
          </View>

          {/* Estado (só mod/admin) */}
          {isModOrAdmin && (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Estado</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {(['Ativa', 'Reservada', 'Concluída'] as Estado[]).map((opt) => {
                  const active = estado === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setEstado(opt)}
                      style={[
                        styles.segment,
                        {
                          borderColor: active ? colors.primary : '#333',
                          backgroundColor: active ? colors.primary : THEME.dark.input,
                        },
                      ]}
                    >
                      <Text style={{ fontWeight: '700', color: active ? colors.text : THEME.dark.textInput }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Ações */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1, opacity: saving ? 0.7 : 1 }]}
              onPress={guardar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.text }]}>Guardar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: BRAND.danger }]}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={[styles.secondaryBtnText, { color: THEME.dark.text}]}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MapModal */}
      <MapModal
        visible={mapOpen}
        onClose={fecharMapa}
        scheme={scheme}
        initialCoord={typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null}
        onConfirm={confirmarMapa}
      />
    </View>
  );
}

/* ---------- estilos ---------- */
const THUMB = 90;

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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 120 },

  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#EEEDD7',
  },

  titleInput: {
    fontSize: 18,
    fontWeight: '700',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: THEME.dark.textInput,
    color: THEME.dark.input,
  },

  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // GALERIA
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000AA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  helper: { fontSize: 12, marginBottom: 6 },

  infoLabel: { fontSize: 14, opacity: 0.9 },

  input: {
    width: '100%',
    backgroundColor: THEME.dark.bg,
    color: THEME.dark.input,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 10,
    marginTop: 6,
  },
  descriptionInput: {
    height: 110,
    textAlignVertical: 'top',
    backgroundColor: THEME.dark.bg,
    color: THEME.dark.input,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 10,
  },

  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },

  mapBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  mapBtnText: { fontSize: 14, fontWeight: '700' },

  fullWidth: { width: '100%' },

  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 44,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },

  segment: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5 },

  primaryBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
});
