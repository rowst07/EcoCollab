// components/modals/RecoverPassModal.tsx
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

type RecoverPassModalProps = {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
};

export default function RecoverPassModal({
  visible,
  onClose,
  initialEmail = '',
}: RecoverPassModalProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(initialEmail ?? '');
  }, [initialEmail, visible]);

  const handleSend = async () => {
    const mail = email.trim();
    if (!mail) {
      Alert.alert('Campo obrigatório', 'Indique o seu email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      Alert.alert('Email inválido', 'Indique um email válido.');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(mail);
      Alert.alert(
        'Email enviado',
        'Se o email existir, receberá uma mensagem para redefinir a palavra-passe. Verifique a sua caixa de entrada, incluindo a caixa de spam.'
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível enviar o email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centered}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Recuperar palavra-passe</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar">
              <Feather name="x" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.helper}>
            Introduza o email associado à sua conta. Iremos enviar um link para
            redefinir a palavra-passe.
          </Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="email@exemplo.pt"
              placeholderTextColor="#999"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.8 }]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Enviar link</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    width: '88%',
    backgroundColor: '#EEEDD7',
    borderRadius: 16,
    padding: 18,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  helper: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#EA3323',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
