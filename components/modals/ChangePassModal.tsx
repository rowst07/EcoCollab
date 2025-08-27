// components/modals/ChangePasswordModal.tsx
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
};

export default function ChangePassModal({ visible, onClose }: Props) {
  const { changePassword } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Palavras-passe diferentes', 'Confirmação não coincide.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Palavra-passe curta', 'Use pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPass, newPass); // <- centralizado no AuthContext
      Alert.alert('Sucesso', 'Palavra-passe atualizada com sucesso.');
      onClose();
    } catch (err: any) {
      Alert.alert('Erro ao atualizar palavra-passe', err?.message ?? 'Tente novamente.');
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
            <Text style={styles.title}>Alterar palavra-passe</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color="#000" /></TouchableOpacity>
          </View>

          <Text style={styles.label}>Palavra-passe atual</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              value={currentPass}
              onChangeText={setCurrentPass}
              style={styles.input}
              placeholder="Palavra-passe atual"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <Text style={styles.label}>Nova palavra-passe</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              value={newPass}
              onChangeText={setNewPass}
              style={styles.input}
              placeholder="Nova palavra-passe"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <Text style={styles.label}>Confirmar nova palavra-passe</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              value={confirmPass}
              onChangeText={setConfirmPass}
              style={styles.input}
              placeholder="Confirmar nova palavra-passe"
              placeholderTextColor="#999"
              secureTextEntry
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
