// app/SharedScreens/criarEcoponto.tsx
import { MapModal } from '@/components/modals/MapModal';
import { BRAND, RESIDUE_COLORS, THEME } from '@/constants/Colors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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

type NewPoint = {
  name: string;
  description: string;
  address: string;
  residues: string[];
  lat?: number;
  lng?: number;
  photoUri?: string | null;
};

const ALL_RESIDUES = Object.keys(RESIDUE_COLORS);

export default function CriarEcoponto() {
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const T = THEME[scheme];
  const TEXT_ON_INPUT = THEME.light.text;
  const PLACEHOLDER_ON_INPUT = THEME.light.textMuted;

  const [form, setForm] = useState<NewPoint>({
    name: '',
    description: '',
    address: '',
    residues: [],
    lat: undefined,
    lng: undefined,
    photoUri: undefined,
  });
  const [saving, setSaving] = useState(false);

  // Modal: resíduos
  const [residueModalOpen, setResidueModalOpen] = useState(false);
  const [tempResidues, setTempResidues] = useState<string[]>([]);
  const openResidueModal = () => {
    setTempResidues(form.residues);
    setResidueModalOpen(true);
  };
  const toggleResidueTemp = (key: string) => {
    setTempResidues((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const applyResidues = () => {
    setForm((f) => ({ ...f, residues: tempResidues }));
    setResidueModalOpen(false);
  };

  // Modal: mapa
  const [mapOpen, setMapOpen] = useState(false);
  const openMap = () => setMapOpen(true);

  // helpers
  const onChange = <K extends keyof NewPoint>(k: K, v: NewPoint[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const changed = useMemo(() => true, []); // criação: botão ativo

  const validate = () => {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('• Nome do ponto');
    if (form.residues.length === 0) errs.push('• Pelo menos um tipo de resíduo');
    if (form.lat == null || form.lng == null) errs.push('• Localização no mapa');
    return errs;
  };

  const handleCreate = async () => {
    const errs = validate();
    if (errs.length) {
      Alert.alert('Falta preencher', errs.join('\n'));
      return;
    }
    try {
      setSaving(true);
      // TODO: integra com a tua API/estado
      await new Promise((r) => setTimeout(r, 700));
      Alert.alert('Sucesso', 'Ponto criado com sucesso!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o ponto.');
    } finally {
      setSaving(false);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <View style={[styles.wrapper, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Ecoponto</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 30 }}>
          {/* Foto */}
          <View style={styles.photoRow}>
            <Image
              source={form.photoUri ? { uri: form.photoUri } : require('../../assets/placeholder.png')}
              style={[styles.photo, { backgroundColor: T.card }]}
            />
            <View style={styles.photoBtns}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: BRAND.primary }]}
                onPress={async () => {
                  const uri = await pickImage();
                  if (uri !== null) setForm((f) => ({ ...f, photoUri: uri }));
                }}
              >
                <Feather name="image" size={16} color={THEME.light.bg} />
                <Text style={[styles.primaryBtnText, { color: THEME.light.bg }]}>Adicionar foto</Text>
              </TouchableOpacity>
              {form.photoUri ? (
                <TouchableOpacity
                  style={[styles.secondaryBtn, { backgroundColor: T.input }]}
                  onPress={() => onChange('photoUri', null)}
                >
                  <Feather name="trash-2" size={16} color={TEXT_ON_INPUT} />
                  <Text style={[styles.secondaryBtnText, { color: TEXT_ON_INPUT }]}>Remover</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Campos */}
          <Field
            label="Nome do ponto"
            value={form.name}
            onChangeText={(t) => onChange('name', t)}
            placeholder="Ex: Ecoponto Central"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
          />
          <Field
            label="Descrição"
            value={form.description}
            onChangeText={(t) => onChange('description', t)}
            placeholder="Notas úteis (horário, acessos, etc.)"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
            multiline
            numberOfLines={4}
          />
          <Field
            label="Morada"
            value={form.address}
            onChangeText={(t) => onChange('address', t)}
            placeholder="Rua, nº, código-postal, localidade"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
          />

          {/* Tipos de resíduo */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: T.textMuted }]}>Tipos de resíduo</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openResidueModal}
              style={[styles.input, { backgroundColor: T.input, borderColor: T.inputBorder }]}
            >
              <Text style={{ color: TEXT_ON_INPUT, fontSize: 16 }}>
                {form.residues.length > 0
                  ? form.residues.map((r) => capitalize(r)).join(', ')
                  : 'Selecionar…'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mapa */}
          <View style={{ alignItems: 'center', width: '100%' }}>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: BRAND.primary, alignSelf: 'center' }]}
              onPress={openMap}
            >
              <Feather name="map-pin" size={18} color={THEME.light.bg} />
              <Text style={[styles.mapBtnText, { color: THEME.light.bg }]}>Selecionar localização no mapa</Text>
            </TouchableOpacity>
          </View>

          {/* Botões inferiores */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: BRAND.danger }]}
              onPress={() => router.back()}
            >
              <Feather name="x-circle" size={18} color={THEME.light.bg} />
              <Text style={[styles.footerBtnText, { color: THEME.light.bg }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: BRAND.primary }, saving ? { opacity: 0.6 } : null]}
              onPress={handleCreate}
              disabled={saving}
            >
              <Feather name="check-circle" size={18} color={THEME.light.bg} />
              <Text style={[styles.footerBtnText, { color: THEME.light.bg }]}>{saving ? 'A criar…' : 'Criar'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de seleção de resíduos */}
      <Modal
        visible={residueModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setResidueModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setResidueModalOpen(false)} />
        <View style={[styles.filterSheet, { backgroundColor: T.bg }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: T.text }]}>Seleciona os tipos</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {ALL_RESIDUES.map((key) => {
              const active = tempResidues.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.9}
                  style={[styles.filterItem, { borderColor: T.border }, active ? styles.filterItemActive : null]}
                  onPress={() => toggleResidueTemp(key)}
                >
                  <View style={[styles.colorDot, { backgroundColor: RESIDUE_COLORS[key] }]} />
                  <Text style={[styles.filterText, { color: T.text }]}>{capitalize(key)}</Text>
                  {active ? <Feather name="check" size={18} color={BRAND.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: T.input }]} onPress={() => setResidueModalOpen(false)}>
              <Text style={[styles.modalBtnText, { color: TEXT_ON_INPUT }]}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: BRAND.primary }]} onPress={applyResidues}>
              <Text style={[styles.modalBtnText, { color: THEME.light.bg }]}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de mapa (componente) */}
      <MapModal
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={(coords, address) => {
          setForm((f) => ({ ...f, lat: coords.lat, lng: coords.lng, address: address || f.address }));
          setMapOpen(false);
        }}
        initialCoord={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null}
        scheme={scheme}
      />
    </View>
  );
}

/** Campo reutilizável */
function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  theme: typeof THEME.light | typeof THEME.dark;
  textOnInput: string;
  placeholderOnInput: string;
}) {
  const {
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    multiline,
    numberOfLines,
    maxLength,
    theme,
    textOnInput,
    placeholderOnInput,
  } = props;

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.input,
            color: textOnInput,
            borderColor: theme.inputBorder,
          },
          multiline ? styles.inputMultiline : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderOnInput}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        keyboardAppearance={Platform.OS === 'ios' ? (theme.bg === '#000000' ? 'dark' : 'light') : undefined}
      />
    </View>
  );
}

/* Upload da foto (import dinâmico, sem crash se não existir o pacote) */
async function pickImage() {
  try {
    const ImagePicker = await import('expo-image-picker').then((m) => m.default ?? m);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso às fotos para anexar uma imagem.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      return result.assets?.[0]?.uri ?? null;
    }
  } catch {
    Alert.alert('Seleção de imagem indisponível', 'Instala "expo-image-picker" para escolher uma foto.');
  }
  return null;
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  photo: { width: 110, height: 82, borderRadius: 10, marginRight: 12 },
  photoBtns: { gap: 8 },

  wrapper: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
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

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryBtnText: { fontWeight: '600' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  secondaryBtnText: { fontWeight: '600' },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, marginBottom: 6 },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputMultiline: { height: 120, textAlignVertical: 'top' },

  // Modal filtros (resíduos)
  filterSheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00000033',
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterItemActive: {
    backgroundColor: '#00000010',
  },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  filterText: { flex: 1, fontSize: 16 },

  // Modal base
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000099',
  },
  modalActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalBtnText: { fontSize: 14, fontWeight: '600' },

  // Botões inferiores
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
  },
  footerBtnText: { fontSize: 16, fontWeight: '700' },

  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginTop: 8,
  },
  mapBtnText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
