import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Platform, Dimensions, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

type Ecoponto = {
  id: number;
  nome: string;
  morada: string;
  tipos: string[];
  classificacao: number;
  latitude: number;
  longitude: number;
};

// MOCK (substitui por fetch/estado global)
const MOCK: Ecoponto[] = [
  { id: 1, nome: 'Ecoponto Vidro Centro', morada: 'Centro, Bragança', tipos: ['vidro'], classificacao: 4, latitude: 41.805, longitude: -6.756 },
  { id: 2, nome: 'Ecoponto Escola', morada: 'Junto à Escola X', tipos: ['papel','plastico','metal'], classificacao: 3, latitude: 41.808, longitude: -6.754 },
];

const PROBLEMAS = [
  { value: 'cheio', label: 'Contentor cheio' },
  { value: 'partido', label: 'Contentor danificado' },
  { value: 'mau-odor', label: 'Mau cheiro' },
  { value: 'acesso', label: 'Acesso bloqueado' },
  { value: 'outro', label: 'Outro' }
];

export default function ReportarProblema() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const ecoponto: Ecoponto = useMemo(() => {
    const nId = Number(id);
    return MOCK.find((e) => e.id === nId) ?? MOCK[0];
  }, [id]);

  const width = Dimensions.get('window').width;
  const height = Math.round(width * 9 / 16);

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  const streetViewUrl = API_KEY
    ? `https://maps.googleapis.com/maps/api/streetview?size=${Math.min(width, 1200)}x${Math.min(height, 800)}&location=${ecoponto.latitude},${ecoponto.longitude}&fov=80&pitch=0&key=${API_KEY}`
    : null;

  const [tipoProblema, setTipoProblema] = useState<string>('cheio');
  const [descricao, setDescricao] = useState<string>('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const escolherImagem = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autoriza o acesso à galeria para anexar imagens.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled && result.assets.length > 0) {
      setImagemUri(result.assets[0].uri);
    }
  };

  const submeter = async () => {
    if (!tipoProblema) return Alert.alert('Validação', 'Escolhe um tipo de problema.');
    if (!descricao || descricao.trim().length < 5) {
      return Alert.alert('Validação', 'Escreve uma descrição mais detalhada (≥ 5 caracteres).');
    }

    try {
      setAEnviar(true);
      const payload = {
        ecopontoId: ecoponto.id,
        tipo: tipoProblema,
        descricao: descricao.trim(),
        imagemUri
      };
      // TODO: chamar a tua API aqui (fetch/axios)
      console.log('REPORTAR_PROBLEMA_PAYLOAD', payload);

      Alert.alert('Obrigado!', 'O teu reporte foi enviado com sucesso.');
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o reporte. Tenta novamente.');
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header preto */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar problema</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Street View full width (opcional) */}
        {streetViewUrl ? (
          <Image source={{ uri: streetViewUrl }} style={{ width, height }} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { width, height }]}>
            <Ionicons name="image" size={32} color="#aaa" />
            <Text style={{ color: '#aaa', marginTop: 6 }}>Street View não disponível</Text>
          </View>
        )}

        {/* Conteúdo */}
        <View style={styles.content}>
          {/* Título/identificação do ecoponto */}
          <Text style={styles.nome}>{ecoponto.nome}</Text>
          <Text style={styles.morada}>{ecoponto.morada}</Text>

          {/* Dropdown tipo de problema */}
          <Text style={styles.subTitle}>Tipo de problema</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={tipoProblema}
              onValueChange={(v) => setTipoProblema(String(v))}
              dropdownIconColor="#111"
              style={styles.picker}
            >
              {PROBLEMAS.map(p => (
                <Picker.Item key={p.value} label={p.label} value={p.value} />
              ))}
            </Picker>
          </View>

          {/* Descrição */}
          <Text style={styles.subTitle}>Descrição</Text>
          <TextInput
            style={styles.inputDesc}
            placeholder="Explica o que está a acontecer..."
            placeholderTextColor="#999"
            multiline
            value={descricao}
            onChangeText={setDescricao}
          />

          {/* Upload imagem */}
          <TouchableOpacity style={styles.uploadBtn} onPress={escolherImagem}>
            <Ionicons name="image" size={20} color="#fff" />
            <Text style={styles.uploadBtnText}>{imagemUri ? 'Alterar imagem' : 'Anexar imagem'}</Text>
          </TouchableOpacity>
          {imagemUri && (
            <Image source={{ uri: imagemUri }} style={styles.preview} />
          )}

          {/* Submeter */}
          <TouchableOpacity style={styles.submitBtn} onPress={submeter} disabled={aEnviar}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>{aEnviar ? 'A enviar...' : 'Submeter'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  placeholder: {
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: 18
  },
  nome: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
    textAlign: 'center'
  },
  morada: {
    fontSize: 15,
    color: '#666',
    marginBottom: 18,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  picker: {
    height: 50
  },
  inputDesc: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: '#111',
    marginBottom: 14
  },
  uploadBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '800'
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16
  },
  submitBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16
  }
});
