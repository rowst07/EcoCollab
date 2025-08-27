// components/modals/ChangeEmailModal.tsx
import { useAuth } from '@/services/AuthContext';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
};

export default function ChangeEmailModal({ visible, onClose, initialEmail = '' }: Props) {
  const { changeEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [confirmEmail, setConfirmEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setConfirmEmail(initialEmail);
    setPassword('');
  }, [initialEmail, visible]);

  const handleSubmit = async () => {
    const newMail = email.trim();
    const conf = confirmEmail.trim();

    if (!newMail || !conf || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (newMail !== conf) {
      Alert.alert('Emails diferentes', 'Os emails inseridos não coincidem.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newMail)) {
      Alert.alert('Email inválido', 'Indique um email válido.');
      return;
    }

    try {
      setLoading(true);
      await changeEmail(password, newMail); // <- centralizado no AuthContext
      Alert.alert(
        'Email atualizado',
        'Se necessário, verifique a sua caixa de correio para confirmar o novo email.'
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Erro ao atualizar email', err?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Alterar email</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color="#000" /></TouchableOpacity>
          </View>

          <Text style={styles.help}>Introduza o novo email e a sua palavra-passe atual para confirmar.</Text>

          <Text style={styles.label}>Novo email</Text>
          <View style={styles.inputRow}>
            <Feather name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              onChangeText={setEmail}
              style={styles.input}
              placeholder="novo@email.pt"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Confirmar novo email</Text>
          <View style={styles.inputRow}>
            <Feather name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              onChangeText={setConfirmEmail}
              style={styles.input}
              placeholder="Repita o novo email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Palavra-passe atual</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Palavra-passe"
              placeholderTextColor="#999"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { width: '88%', backgroundColor: '#EEEDD7', borderRadius: 16, padding: 18, elevation: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#000' },
  help: { fontSize: 14, color: '#333', marginBottom: 12 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 6 },
  inputRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', backgroundColor: '#000',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12
  },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  btn: { backgroundColor: '#EA3323', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
