// app/SharedScreens/editarPerfil.tsx
import { BRAND, THEME } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';

type ProfileData = {
  name: string;
  email: string;
  address: string;
  phone: string;
  birthdate: string; // YYYY-MM-DD
  photoUri?: string | null;
};

export default function EditarPerfil() {
  const router = useRouter();
  // Força tema dark neste ecrã (fundo todo preto)
  const T = THEME.dark;
  const TEXT_ON_INPUT = THEME.light.text;        // #111111
  const PLACEHOLDER_ON_INPUT = THEME.light.textMuted; // #666666

  const current: ProfileData = useMemo(
    () => ({
      name: 'João Moutinho',
      email: 'joao@example.com',
      address: 'Rua das Flores 123, 4800-000 Guimarães',
      phone: '912345678',
      birthdate: '1995-06-20',
      photoUri: undefined,
    }),
    []
  );

  const [form, setForm] = useState<ProfileData>(current);
  const [saving, setSaving] = useState(false);

  // ---- DatePicker modal state ----
  const [showDOB, setShowDOB] = useState(false);
  const [tempDOB, setTempDOB] = useState<Date>(parseISO(current.birthdate));

  const changed = JSON.stringify(form) !== JSON.stringify(current);
  const onChange = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = useCallback(() => {
    const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());
    const phoneOk = /^\d{9}$/.test(form.phone.trim());
    const birthOk =
      form.birthdate.trim() === '' ||
      /^\d{4}-\d{2}-\d{2}$/.test(form.birthdate.trim());
    const nameOk = form.name.trim().length >= 2;
    return { ok: emailOk && phoneOk && birthOk && nameOk, emailOk, phoneOk, birthOk, nameOk };
  }, [form]);

  const pickImage = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker').then((m) => m.default ?? m);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão', 'Precisamos de acesso às fotos para alterar o avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri;
        if (uri) onChange('photoUri', uri);
      }
    } catch {
      Alert.alert(
        'Seleção de imagem indisponível',
        'Instala "expo-image-picker" para escolher uma foto do dispositivo.'
      );
    }
  }, []);

  const removeImage = useCallback(() => onChange('photoUri', null), []);

  const handleSave = useCallback(async () => {
    const v = validate();
    if (!v.ok) {
      const msgs = [];
      if (!v.nameOk) msgs.push('• Nome (mín. 2 caracteres)');
      if (!v.emailOk) msgs.push('• Email inválido');
      if (!v.phoneOk) msgs.push('• Telefone: 9 dígitos PT');
      if (!v.birthOk) msgs.push('• Data: YYYY-MM-DD');
      Alert.alert('Verifica os campos', msgs.join('\n'));
      return;
    }
    try {
      setSaving(true);
      // TODO: integra com a tua API/estado
      await new Promise((r) => setTimeout(r, 600));
      Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
    } finally {
      setSaving(false);
    }
  }, [validate, router]);

  // ---- Handlers DatePicker ----
  const openDOBPicker = () => {
    setTempDOB(form.birthdate ? parseISO(form.birthdate) : new Date(1990, 0, 1));
    setShowDOB(true);
  };
  const confirmDOB = () => {
    onChange('birthdate', toISO(tempDOB));
    setShowDOB(false);
  };
  const cancelDOB = () => setShowDOB(false);

  return (
    <View style={[styles.wrapper, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.leftIcon} onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: T.text }]}>Editar Perfil</Text>
        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: T.border },
              !changed || saving ? styles.iconBtnDisabled : null,
            ]}
            onPress={handleSave}
            disabled={!changed || saving}
          >
            <Feather
              name="check"
              size={22}
              color={!changed || saving ? T.textMuted : BRAND.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // <- evita “barra” visual no Android
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar centrado */}
          <View style={styles.avatarBlock}>
            <Image
              source={form.photoUri ? { uri: form.photoUri } : require('../../assets/placeholder.png')}
              style={[styles.avatar, { backgroundColor: T.input }]}
            />
            <View style={styles.avatarBtnsRow}>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: BRAND.primary }]} onPress={pickImage}>
                <Feather name="image" size={16} color={THEME.light.bg} />
                <Text style={[styles.primaryBtnText, { color: THEME.light.bg }]}>Alterar foto</Text>
              </TouchableOpacity>
              {form.photoUri ? (
                <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: T.input }]} onPress={removeImage}>
                  <Feather name="trash-2" size={16} color={TEXT_ON_INPUT} />
                  <Text style={[styles.secondaryBtnText, { color: TEXT_ON_INPUT }]}>Remover</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Campos */}
          <Field
            label="Nome"
            value={form.name}
            onChangeText={(t) => onChange('name', t)}
            placeholder="O teu nome"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
          />
          <Field
            label="Email"
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(t) => onChange('email', t)}
            placeholder="nome@exemplo.com"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
          />
          <Field
            label="Morada"
            value={form.address}
            onChangeText={(t) => onChange('address', t)}
            placeholder="Rua, nº, código‑postal, localidade"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
          />
          <Field
            label="Telefone"
            value={form.phone}
            keyboardType="phone-pad"
            onChangeText={(t) => onChange('phone', t.replace(/[^\d]/g, '').slice(0, 9))}
            placeholder="9 dígitos"
            maxLength={9}
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
          />

          {/* ---- Campo Data de nascimento com modal/spinner ---- */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: T.textMuted }]}>Data de nascimento</Text>
            <TouchableOpacity
              onPress={openDOBPicker}
              activeOpacity={0.8}
              style={[
                styles.input,
                { backgroundColor: T.input, borderColor: T.inputBorder },
              ]}
            >
              <Text style={{ color: TEXT_ON_INPUT, fontSize: 16 }}>
                {form.birthdate ? form.birthdate : 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal do DatePicker: só fecha em OK/Cancelar */}
          <Modal
            visible={showDOB}
            transparent
            animationType="fade"
            onRequestClose={cancelDOB}
          >
            <Pressable style={styles.modalBackdrop} onPress={cancelDOB} />
            <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Seleciona a data</Text>
              <DateTimePicker
                value={tempDOB}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  if (d) setTempDOB(d); // não fecha ao mudar — só atualiza a temp
                }}
                // spinner tem altura própria; no iOS escuro fica ok; no Android também
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: BRAND.danger }]} onPress={cancelDOB}>
                  <Text style={[styles.modalBtnText, { color: THEME.light.bg }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: BRAND.primary }]} onPress={confirmDOB}>
                  <Text style={[styles.modalBtnText, { color: THEME.light.bg }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: BRAND.primary },
              !changed || saving ? { opacity: 0.6 } : null,
            ]}
            onPress={handleSave}
            disabled={!changed || saving}
          >
            <Feather name="check-circle" size={18} color={THEME.light.bg} />
            <Text style={[styles.saveBtnText, { color: THEME.light.bg }]}>
              {saving ? 'A gravar…' : 'Guardar alterações'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Campo reutilizável */
function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  theme: typeof THEME.dark;
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
        keyboardAppearance="dark"   // iOS: teclado coerente com tema
      />
    </View>
  );
}

// ---- Helpers ----
function parseISO(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return new Date(1990, 0, 1);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  leftIcon: { position: 'absolute', left: 0, padding: 6 },
  title: { fontSize: 26, fontWeight: 'bold' },
  iconGroup: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 12, padding: 6, borderRadius: 10 },
  iconBtnDisabled: { opacity: 0.6 },

  // Avatar centrado
  avatarBlock: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignSelf: 'center',
  },
  avatarBtnsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
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

  saveBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700' },

  // ---- Modal DatePicker ----
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000099',
  },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
