import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublicar: (data: any) => void;
}

export default function NovaRetomaModal({ visible, onClose, onPublicar }: Props) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'Doação' | 'Troca'>('Doação');
  const [pontos, setPontos] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState<string | null>(null);

  const escolherImagem = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImagem(result.assets[0].uri);
    }
  };

  const publicar = () => {
    if (!nome.trim()) {
      alert('Preencha o nome do item.');
      return;
    }
    const nova = { nome: nome.trim(), tipo, pontos: parseInt(pontos) || 0, descricao: descricao.trim(), imagem };
    onPublicar(nova);
    onClose();
    // Reset
    setNome('');
    setTipo('Doação');
    setPontos('');
    setDescricao('');
    setImagem(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Nova Retoma</Text>
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            <Text style={styles.label}>Nome do item</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Garrafa de plástico"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.tipoContainer}>
              <TouchableOpacity
                style={[styles.tipoBtn, tipo === 'Doação' && styles.tipoAtivo]}
                onPress={() => setTipo('Doação')}
              >
                <Text style={[styles.tipoText, tipo !== 'Doação' && styles.tipoTextInativo]}>Doação</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tipoBtn, tipo === 'Troca' && styles.tipoAtivo]}
                onPress={() => setTipo('Troca')}
              >
                <Text style={[styles.tipoText, tipo !== 'Troca' && styles.tipoTextInativo]}>Troca</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Pontos</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 10"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={pontos}
              onChangeText={setPontos}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Descreva o estado ou mais detalhes..."
              placeholderTextColor="#999"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />

            <Text style={styles.label}>Imagem</Text>
            {imagem ? (
              <Image source={{ uri: imagem }} style={styles.imagemPreview} />
            ) : (
              <TouchableOpacity style={styles.uploadBtn} onPress={escolherImagem}>
                <Feather name="upload" size={20} color="#fff" />
                <Text style={styles.uploadText}>Selecionar imagem</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.publicarBtn} onPress={publicar}>
              <Text style={styles.publicarText}>Publicar Retoma</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelarBtn} onPress={onClose}>
              <Text style={styles.cancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  header: {
    backgroundColor: '#000',
    paddingVertical: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    backgroundColor: '#000',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  tipoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  tipoAtivo: {
    backgroundColor: '#2E7D32',
  },
  tipoText: {
    fontWeight: '700',
    color: '#fff'
  },
  tipoTextInativo: {
    color: '#333',
  },
  uploadBtn: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 12,
    width: '60%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  imagemPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 20,
  },
  publicarBtn: {
    backgroundColor: '#2E7D32', // verde
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  publicarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelarBtn: {
    backgroundColor: '#D32F2F', // vermelho
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
