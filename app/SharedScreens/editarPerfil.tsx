// app/SharedScreens/editarPerfil.tsx
import { BRAND, THEME } from '@/constants/Colors';
import { useAuth } from '@/services/AuthContext';
import {
  getUserMinimalDoc,
  updateUserMinimalDoc,
  userRef,
} from '@/services/FirestoreService';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import {
  deleteField,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  email: string;       // inalterável aqui
  address: string;
  phone: string;       // telemóvel (opcional)
  birthdate: string;   // YYYY-MM-DD (opcional)
  photoUri?: string | null; // usa URL remoto se já tiveres; local não persiste
};

export default function EditarPerfil() {
  const router = useRouter();
  const { user } = useAuth(); // auth user
  // Força tema dark neste ecrã (fundo todo preto)
  const T = THEME.dark;
  const TEXT_ON_INPUT = THEME.light.text;        // #111111
  const PLACEHOLDER_ON_INPUT = THEME.light.textMuted; // #666666

  // Estado inicial (placeholder enquanto carrega Firestore)
  const initial: ProfileData = useMemo(
    () => ({
      name: user?.displayName ?? '',
      email: user?.email ?? '',
      address: '',
      phone: '',
      birthdate: '',
      photoUri: undefined,
    }),
    [user?.displayName, user?.email]
  );

  const [form, setForm] = useState<ProfileData>(initial);
  const [original, setOriginal] = useState<ProfileData>(initial);
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // ---- DatePicker modal state ----
  const [showDOB, setShowDOB] = useState(false);
  const [tempDOB, setTempDOB] = useState<Date>(new Date(1990, 0, 1));

  // Carrega doc do Firestore
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.uid) {
        setLoadingDoc(false);
        return;
      }
      try {
        const doc = await getUserMinimalDoc(user.uid); // { id, nome, email, morada, ... }
        // Vamos buscar também extras diretamente ao snap para evitar alterar o serviço agora
        // (telemovel, birthdate, fotoURL) — se não existirem, ficam vazios
        const snap = await import('firebase/firestore').then(m =>
          m.getDoc(userRef(user.uid))
        );
        const data: any = snap.exists() ? snap.data() : {};
        const loaded: ProfileData = {
          name: doc?.nome ?? user.displayName ?? '',
          email: doc?.email ?? user.email ?? '',
          address: doc?.morada ?? '',
          phone: data?.telemovel ?? '',
          birthdate: data?.birthdate ?? '',
          photoUri: data?.fotoURL ?? undefined,
        };
        if (mounted) {
          setForm(loaded);
          setOriginal(loaded);
          setTempDOB(loaded.birthdate ? parseISO(loaded.birthdate) : new Date(1990, 0, 1));
        }
      } catch (e) {
        // fallback mínimo (usa Auth)
        const fb: ProfileData = {
          name: user?.displayName ?? '',
          email: user?.email ?? '',
          address: '',
          phone: '',
          birthdate: '',
          photoUri: undefined,
        };
        if (mounted) {
          setForm(fb);
          setOriginal(fb);
        }
      } finally {
        if (mounted) setLoadingDoc(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const changed = JSON.stringify(form) !== JSON.stringify(original);
  const onChange = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = useCallback(() => {
    const phoneOk = form.phone.trim() === '' || /^\d{9}$/.test(form.phone.trim());
    const birthOk =
      form.birthdate.trim() === '' ||
      /^\d{4}-\d{2}-\d{2}$/.test(form.birthdate.trim());
    const nameOk = form.name.trim().length >= 2;
    return { ok: phoneOk && birthOk && nameOk, phoneOk, birthOk, nameOk };
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
        quality: 0.85,
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
    if (!user?.uid) return;

    const v = validate();
    if (!v.ok) {
      const msgs = [];
      if (!v.nameOk) msgs.push('• Nome (mín. 2 caracteres)');
      if (!v.phoneOk) msgs.push('• Telefone: 9 dígitos PT (opcional)');
      if (!v.birthOk) msgs.push('• Data: YYYY-MM-DD (opcional)');
      Alert.alert('Verifica os campos', msgs.join('\n'));
      return;
    }

    try {
      setSaving(true);

      // 1) Atualiza mínimos (nome, morada) — NÃO mexe no email aqui
      await updateUserMinimalDoc(user.uid, {
        nome: form.name.trim(),
        morada: form.address.trim(),
      });

      // 2) Atualiza extras diretamente no doc
      //    - se o campo ficar vazio, removemos (deleteField) para manter o doc limpo
      const extrasUpdate: Record<string, any> = {
        dataAtualizacao: serverTimestamp(),
      };
      extrasUpdate.telemovel = form.phone.trim() ? form.phone.trim() : deleteField();
      extrasUpdate.birthdate = form.birthdate.trim() ? form.birthdate.trim() : deleteField();
      // Se photoUri for URL remoto, persiste; se for local (file://), não persiste (opcional)
      if (form.photoUri && /^https?:\/\//i.test(form.photoUri)) {
        extrasUpdate.fotoURL = form.photoUri;
      } else if (!form.photoUri) {
        extrasUpdate.fotoURL = deleteField();
      }
      await updateDoc(userRef(user.uid), extrasUpdate);

      setOriginal(form);
      Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível atualizar.');
    } finally {
      setSaving(false);
    }
  }, [form, user?.uid, router, validate]);

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
              (!changed || saving || loadingDoc) ? styles.iconBtnDisabled : null,
            ]}
            onPress={handleSave}
            disabled={!changed || saving || loadingDoc}
          >
            <Feather
              name="check"
              size={22}
              color={!changed || saving || loadingDoc ? T.textMuted : BRAND.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar centrado */}
          <View style={styles.avatarBlock}>
            {form.photoUri ? (
              <Image
                source={{ uri: form.photoUri }}
                style={[styles.avatar, { backgroundColor: T.card }]}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: T.card, alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="user" size={48} color={T.textMuted} />
              </View>
            )}
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

          {/* Email — INALTERÁVEL AQUI */}
          <Field
            label="Email (não editável aqui)"
            value={form.email}
            onChangeText={() => {}}
            placeholder="nome@exemplo.com"
            theme={T}
            textOnInput={TEXT_ON_INPUT}
            placeholderOnInput={PLACEHOLDER_ON_INPUT}
            keyboardType="email-address"
            editable={false}
            disabled
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
            label="Telemóvel"
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

          {/* Modal do DatePicker */}
          <Modal
            visible={showDOB}
            transparent
            animationType="fade"
            onRequestClose={cancelDOB}
          >
            <Pressable style={styles.modalBackdrop} onPress={cancelDOB} />
            <View style={[styles.modalSheet, { backgroundColor: T.bg }]}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Seleciona a data</Text>
              <DateTimePicker
                value={tempDOB}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  if (d) setTempDOB(d);
                }}
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
              (!changed || saving || loadingDoc) ? { opacity: 0.6 } : null,
            ]}
            onPress={handleSave}
            disabled={!changed || saving || loadingDoc}
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
  editable?: boolean;
  disabled?: boolean;
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
    editable = true,
    disabled = false,
  } = props;

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: editable ? theme.input : '#D8D8D8',
            color: editable ? textOnInput : '#555',
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
        editable={editable && !disabled}
        keyboardAppearance="dark"
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
