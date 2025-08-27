// components/modals/DeactivateAccountModal.tsx
import { useAuth } from '@/services/AuthContext';
import { deactivateAccount } from '@/services/FirestoreService';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDeactivated?: () => void; // ex.: terminar sessão + navegar
};

export default function DesativarContaModal({ visible, onClose, onDeactivated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Utilizador não autenticado.');
      return;
    }
    try {
      setLoading(true);
      await deactivateAccount(user.uid); // <- centralizado no FirestoreService
      Alert.alert('Conta desativada', 'A sua conta foi colocada em estado inativo.');
      onClose?.();
      onDeactivated?.();
    } catch (err: any) {
      Alert.alert('Erro ao desativar conta', err?.message ?? 'Tente novamente.');
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
            <Text style={styles.title}>Desativar conta</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color="#000" /></TouchableOpacity>
          </View>

          <Text style={styles.warning}>
            Esta ação <Text style={{ fontWeight: '800' }}>não apaga</Text> a sua conta. Será marcada como <Text style={{ fontWeight: '800' }}>inativa</Text>.
            Poderá reativá-la contactando o suporte.
          </Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#b91c1c' }]}
            onPress={handleDeactivate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar desativação</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#111', marginTop: 10 }]} onPress={onClose}>
            <Text style={styles.btnText}>Cancelar</Text>
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
  warning: { color: '#111', fontSize: 14, marginBottom: 14 },
  btn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
