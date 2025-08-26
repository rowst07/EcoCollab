// components/modals/CriarRetomaModal.tsx
import { THEME } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';

import { auth } from '@/firebase'; // garante que exportas { auth, db } daqui
import { addRetoma } from '@/services/FirestoreService';
import { CLOUDINARY_UPLOAD_PRESET, uploadToCloudinary } from '@/services/uploadCloudinary';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublicar: (data: any) => void;
  currentUserName?: string;
}

type Tipo = 'Doação' | 'Troca';
type Condicao = 'Novo' | 'Como novo' | 'Usado' | 'Para reciclar';
type Entrega = 'Levantamento' | 'Entrega a combinar' | 'Envio';

export default function NovaRetomaModal({
  visible,
  onClose,
  onPublicar,
  currentUserName,
}: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = THEME[scheme];

  // Básico
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<Tipo>('Doação');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Extra
  const [quantidade, setQuantidade] = useState('');
  const [condicao, setCondicao] = useState<Condicao>('Usado');
  const [entrega, setEntrega] = useState<Entrega>('Levantamento');
  const [local, setLocal] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [tags, setTags] = useState('');
  const [validade, setValidade] = useState(''); // <- manter string vazia em vez de undefined
  const [contacto, setContacto] = useState('');

  // Mapa
  const [region, setRegion] = useState<Region>({
    latitude: 41.805,
    longitude: -6.756,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);

  const escolherImagem = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) setImagem(result.assets[0].uri);
  };

  const pedirLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Não foi possível aceder à tua localização.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = pos.coords;
    setRegion((r) => ({ ...r, latitude, longitude }));
    setMarker({ latitude, longitude });
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
  };

  const hasDirtyFields = useMemo(() => {
    const base = [nome, descricao, imagem ?? '', quantidade, local, preferencias, tags, validade, contacto]
      .some((v) => (v ?? '').toString().trim().length > 0);
    const tipoDirty = tipo !== 'Doação';
    const condDirty = condicao !== 'Usado';
    const entrDirty = entrega !== 'Levantamento';
    const coordDirty = !!marker;
    return base || tipoDirty || condDirty || entrDirty || coordDirty;
  }, [nome, descricao, imagem, quantidade, local, preferencias, tags, validade, contacto, tipo, condicao, entrega, marker]);

  const attemptClose = () => {
    if (!hasDirtyFields || submitting) return onClose();
    Alert.alert(
      'Sair sem guardar?',
      'Tens alterações por guardar. Queres sair e perder o que foi preenchido?',
      [
        { text: 'Continuar a editar', style: 'cancel' },
        { text: 'Sair sem guardar', style: 'destructive', onPress: onClose },
      ],
    );
  };

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      attemptClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, hasDirtyFields, submitting]);

  const resetForm = () => {
    setNome(''); setTipo('Doação'); setDescricao(''); setImagem(null);
    setQuantidade(''); setCondicao('Usado'); setEntrega('Levantamento'); setLocal('');
    setPreferencias(''); setTags(''); setValidade(''); setMarker(null); setContacto('');
  };

  const isDark = scheme === 'dark';
  const inputBase = isDark
    ? { backgroundColor: '#EEEDD7', color: '#111' }
    : { backgroundColor: '#000', color: '#fff' };

  const publicar = async () => {
    if (!nome.trim()) {
      Alert.alert('Dados em falta', 'Preencha o nome do item.');
      return;
    }
    const user = auth.currentUser;
    if (!user?.uid) {
      Alert.alert('Sessão', 'Precisas de iniciar sessão para publicar.');
      return;
    }

    try {
      setSubmitting(true);

      // 1) Upload imagem (se existir)
      let fotoUrl: string | null = null;
      if (imagem) {
        const up = await uploadToCloudinary(imagem, {
          folder: `retomas/${user.uid}`,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          tags: ['retoma', user.uid],
          context: { uid: user.uid },
          contentType: 'image/jpeg',
        });
        fotoUrl = up.secure_url;
      }

      // 2) Normaliza campos opcionais (NUNCA 'undefined')
      const payload = {
        nome: nome.trim(),
        tipo,
        pontos: 0,
        descricao: descricao.trim() || '',
        fotoUrl: fotoUrl ?? null, // null explícito
        icon: 'recycle',
        quantidade: quantidade.trim() || '—',
        condicao,
        entrega,
        local: local.trim() || '—',
        lat: marker?.latitude ?? null, // se não tens coordenada, envia null
        lng: marker?.longitude ?? null,
        preferencias: preferencias.trim() || '—',
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        validade: validade.trim() || null, // string ou null (nunca undefined)
        estado: 'Ativa' as const,
        criadoPor: user.uid,
        criadoPorDisplay: currentUserName || user.displayName || 'Eu',
        contacto: contacto.trim() || null,
      };

      // 3) Grava no Firestore
      const newId = await addRetoma(payload);

      // 4) Notifica o host (para UI local / navegação)
      onPublicar?.({
        id: newId,
        ...payload,
        fotoUri: payload.fotoUrl, // para a página de detalhes
        createdAt: new Date().toLocaleDateString('pt-PT'),
        eMinha: true,
      });

      // 5) Fecha e limpa
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', err?.message ?? 'Não foi possível publicar a retoma.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={attemptClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          style={{ width: '100%' }}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.headerRow, { backgroundColor: colors.bg }]}>
              <TouchableOpacity
                onPress={attemptClose}
                style={[styles.backBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
                disabled={submitting}
              >
                <Feather name="arrow-left" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerText, { color: colors.text }]}>Nova Retoma</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Conteúdo */}
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: 0 }]}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {/* --- Detalhes do item --- */}
              <Text style={[styles.sectionTitle, { color: THEME[scheme].text }]}>Detalhes do item</Text>

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Nome do item</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Ex: Garrafa de plástico"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={nome}
                onChangeText={setNome}
                returnKeyType="next"
                editable={!submitting}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Tipo</Text>
              <SegmentedRow
                options={['Doação', 'Troca']}
                value={tipo}
                onChange={(v) => setTipo(v as Tipo)}
                activeColor={THEME[scheme].primary}
                textOnActive={THEME[scheme].text}
                isDark={isDark}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Descrição</Text>
              <TextInput
                style={[styles.input, inputBase, { height: 110, textAlignVertical: 'top' }]}
                placeholder="Descreve o estado, dimensões, etc."
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                editable={!submitting}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Quantidade</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Ex: 3 unidades / 1 saco (≈2kg)"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={quantidade}
                onChangeText={setQuantidade}
                returnKeyType="next"
                editable={!submitting}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Condição</Text>
              <Grid2x2
                options={['Novo', 'Como novo', 'Usado', 'Para reciclar']}
                value={condicao}
                onChange={(v) => setCondicao(v as Condicao)}
                activeColor={THEME[scheme].primary}
                textOnActive={THEME[scheme].text}
                isDark={isDark}
              />

              {/* --- Logística --- */}
              <Text style={[styles.sectionTitle, { color: THEME[scheme].text, marginTop: 8 }]}>Logística</Text>

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Entrega</Text>
              <SegmentedColumn
                options={['Levantamento', 'Entrega a combinar', 'Envio']}
                value={entrega}
                onChange={(v) => setEntrega(v as Entrega)}
                activeColor={THEME[scheme].primary}
                textOnActive={THEME[scheme].text}
                isDark={isDark}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Local (bairro/zona)</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Ex: Centro, Bragança"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={local}
                onChangeText={setLocal}
                returnKeyType="next"
                editable={!submitting}
              />

              {/* --- Contacto --- */}
              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Contacto (opcional)</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Email ou telemóvel p/ combinar"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={contacto}
                onChangeText={setContacto}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />

              {/* --- Localização --- */}
              <Text style={[styles.sectionTitle, { color: THEME[scheme].text, marginTop: 8 }]}>Localização</Text>
              <Text style={[styles.helper, { color: THEME[scheme].text ?? '#666' }]}>
                Toca no mapa para definir o ponto ou arrasta o marcador. Podes usar a tua localização atual.
              </Text>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  onRegionChangeComplete={setRegion}
                  onPress={onMapPress}
                >
                  {marker && (
                    <Marker
                      coordinate={marker}
                      draggable
                      onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
                    />
                  )}
                </MapView>

                <View style={styles.mapActions}>
                  <TouchableOpacity
                    onPress={pedirLocalizacao}
                    style={[styles.mapBtn, { backgroundColor: THEME[scheme].primary, opacity: submitting ? 0.6 : 1 }]}
                    disabled={submitting}
                  >
                    <Feather name="crosshair" size={16} color={THEME[scheme].text} />
                    <Text style={[styles.mapBtnText, { color: THEME[scheme].text }]}>Usar minha localização</Text>
                  </TouchableOpacity>

                  {marker && (
                    <TouchableOpacity
                      onPress={() => setMarker(null)}
                      style={[styles.mapBtn, { backgroundColor: '#D32F2F', opacity: submitting ? 0.6 : 1 }]}
                      disabled={submitting}
                    >
                      <Feather name="x" size={16} color="#fff" />
                      <Text style={[styles.mapBtnText, { color: '#fff' }]}>Limpar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.coordsText, { color: THEME[scheme].textInput ?? '#444' }]}>
                  {marker
                    ? `Coordenadas: ${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)}`
                    : 'Sem coordenadas definidas'}
                </Text>
              </View>

              {/* --- Extras --- */}
              <Text style={[styles.sectionTitle, { color: THEME[scheme].text, marginTop: 8 }]}>Extras</Text>

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Preferências de troca (opcional)</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Ex: Troco por tampas; aceito doação"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={preferencias}
                onChangeText={setPreferencias}
                editable={!submitting}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Tags (separadas por vírgulas)</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Ex: plástico, PET, garrafa"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={tags}
                onChangeText={setTags}
                autoCapitalize="none"
                editable={!submitting}
              />

              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Validade (opcional)</Text>
              <TextInput
                style={[styles.input, inputBase]}
                placeholder="Ex: 30/09/2025"
                placeholderTextColor={isDark ? '#333' : '#999'}
                value={validade}
                onChangeText={setValidade}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!submitting}
              />

              {/* --- Imagem --- */}
              <Text style={[styles.sectionTitle, { color: THEME[scheme].text, marginTop: 8 }]}>Imagem</Text>
              <Text style={[styles.label, { color: THEME[scheme].text ?? '#333' }]}>Foto do item (opcional)</Text>
              {imagem ? <Image source={{ uri: imagem }} style={styles.imagemPreview} /> : null}
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: THEME[scheme].bg, opacity: submitting ? 0.6 : 1 }]}
                onPress={escolherImagem}
                disabled={submitting}
              >
                <Feather name="upload" size={20} color={THEME[scheme].text} />
                <Text style={[styles.uploadText, { color: THEME[scheme].text }]}>Selecionar imagem</Text>
              </TouchableOpacity>

              {/* Ações */}
              <TouchableOpacity
                style={[styles.publicarBtn, { backgroundColor: THEME[scheme].primary, opacity: submitting ? 0.6 : 1 }]}
                onPress={publicar}
                disabled={submitting}
              >
                <Text style={[styles.publicarText, { color: THEME[scheme].text }]}>
                  {submitting ? 'A publicar…' : 'Publicar Retoma'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelarBtn, { backgroundColor: '#D32F2F', opacity: submitting ? 0.6 : 1 }]}
                onPress={attemptClose}
                disabled={submitting}
              >
                <Text style={styles.publicarText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ---------- Controles auxiliares e styles (iguais ao teu ficheiro) ---------- */
function BaseButton({
  active,
  activeColor,
  isDark,
  children,
}: {
  active: boolean;
  activeColor: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: active ? activeColor : (isDark ? '#333' : '#999'),
        backgroundColor: active ? activeColor : (isDark ? '#EEEDD7' : '#000'),
      }}
    >
      {children}
    </View>
  );
}

function SegmentedRow({
  options,
  value,
  onChange,
  activeColor,
  textOnActive,
  isDark,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  activeColor: string;
  textOnActive: string;
  isDark: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)} style={{ flex: 1 }}>
            <BaseButton active={active} activeColor={activeColor} isDark={isDark}>
              <Text style={{ fontWeight: '700', color: active ? textOnActive : (isDark ? '#111' : '#fff') }} numberOfLines={1}>
                {opt}
              </Text>
            </BaseButton>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SegmentedColumn({
  options,
  value,
  onChange,
  activeColor,
  textOnActive,
  isDark,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  activeColor: string;
  textOnActive: string;
  isDark: boolean;
}) {
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)}>
            <BaseButton active={active} activeColor={activeColor} isDark={isDark}>
              <Text style={{ fontWeight: '700', color: active ? textOnActive : (isDark ? '#111' : '#fff') }} numberOfLines={1}>
                {opt}
              </Text>
            </BaseButton>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Grid2x2({
  options,
  value,
  onChange,
  activeColor,
  textOnActive,
  isDark,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  activeColor: string;
  textOnActive: string;
  isDark: boolean;
}) {
  const rows: string[][] = [];
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2));
  return (
    <View style={{ marginBottom: 12 }}>
      {rows.map((row, idx) => (
        <View key={`row-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: idx === rows.length - 1 ? 0 : 8 }}>
          {row.map((opt) => {
            const active = value === opt;
            return (
              <TouchableOpacity key={opt} onPress={() => onChange(opt)} style={{ width: '48%' }}>
                <BaseButton active={active} activeColor={activeColor} isDark={isDark}>
                  <Text style={{ fontWeight: '700', color: active ? textOnActive : (isDark ? '#111' : '#fff') }} numberOfLines={1}>
                    {opt}
                  </Text>
                </BaseButton>
              </TouchableOpacity>
            );
          })}
          {row.length === 1 && <View style={{ width: '48%' }} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalContainer: {
    maxHeight: '92%',
    minHeight: 300,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  headerRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { fontSize: 22, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  helper: { fontSize: 12, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  input: { paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 12, borderRadius: 10, marginBottom: 12 },
  mapContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: '#00000010' },
  map: { width: '100%', height: 220 },
  mapActions: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  mapBtnText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
  coordsText: { paddingHorizontal: 12, paddingBottom: 10, fontSize: 12, fontWeight: '600' },
  uploadBtn: { borderRadius: 10, padding: 12, width: 240, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 20, alignSelf: 'center' },
  uploadText: { fontWeight: '700', marginLeft: 8 },
  imagemPreview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  publicarBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  publicarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelarBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
});
