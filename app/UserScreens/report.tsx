import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { SimpleSelect } from '@/components/SimpleSelect';
import { THEME } from '@/constants/Colors';

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

export default function Report() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Tema escuro fixo
  const colors = THEME.dark;
  const bg = colors.bg;
  const text = colors.text;
  const muted = colors.textMuted;
  const card = colors.card;
  const border = colors.border;

  const ecoponto = useMemo<Ecoponto>(() => {
    const nId = Number(id);
    return MOCK.find((e) => e.id === nId) ?? MOCK[0];
  }, [id]);

  const width = Dimensions.get('window').width;
  const height = Math.round(width * 9 / 16);

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  const streetViewUrl = API_KEY
    ? `https://maps.googleapis.com/maps/api/streetview?size=${Math.min(width, 1200)}x${Math.min(height, 800)}&location=${ecoponto.latitude},${ecoponto.longitude}&fov=80&pitch=0&key=${API_KEY}`
    : null;

  // Form state
  const [tipoProblema, setTipoProblema] = useState('cheio');
  const [descricao, setDescricao] = useState('');
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

  const abrirNavegacao = () => {
    const { latitude: lat, longitude: lng, nome } = ecoponto;
    const label = encodeURIComponent(nome);
    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`);
    } else {
      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
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
      // TODO: ligar à tua API (multipart/form-data se precisares da imagem)
      console.log('REPORT_PAYLOAD', payload);
      Alert.alert('Obrigado!', 'O teu reporte foi enviado com sucesso.');
      router.back();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o reporte. Tenta novamente.');
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header dark */}
      <View style={[styles.header, { backgroundColor: colors.bg, borderColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reportar problema</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Street View */}
        {streetViewUrl ? (
          <Image source={{ uri: streetViewUrl }} style={{ width, height }} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { width, height, backgroundColor: card, borderColor: border }]}> 
            <Ionicons name="image" size={32} color={muted} />
            <Text style={{ color: muted, marginTop: 6 }}>Street View não disponível</Text>
          </View>
        )}

        {/* Conteúdo */}
        <View style={styles.content}>
          {/* Identificação */}
          <Text style={[styles.nome, { color: text }]}>{ecoponto.nome}</Text>
          <Text style={[styles.morada, { color: muted }]}>{ecoponto.morada}</Text>
  
          {/* Formulário */}
          <Text style={[styles.subTitle, { color: text }]}>Tipo de problema</Text>
          <SimpleSelect value={tipoProblema} onChange={setTipoProblema} options={PROBLEMAS} />

          <Text style={[styles.subTitle, { color: text }]}>Descrição</Text>
          <TextInput
            style={[
              styles.inputDesc,
              { backgroundColor: card, borderColor: border, color: text }
            ]}
            placeholder="Explica o que está a acontecer..."
            placeholderTextColor={muted}
            multiline
            value={descricao}
            onChangeText={setDescricao}
          />

          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: colors.card }]}
            onPress={escolherImagem}
          >
            <Ionicons name="image" size={20} color={colors.text} />
            <Text style={[styles.uploadBtnText, { color: colors.text }]}>{imagemUri ? 'Alterar imagem' : 'Anexar imagem'}</Text>
          </TouchableOpacity>

          {imagemUri && (
            <Image source={{ uri: imagemUri }} style={styles.preview} />
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={submeter}
            disabled={aEnviar}
          >
            <Ionicons name="send" size={20} color={colors.bg} />
            <Text style={[styles.submitBtnText, { color: colors.bg }]}>{aEnviar ? 'A enviar...' : 'Submeter'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    // backgroundColor e borderColor definidos inline pelo tema
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    // color definido inline pelo tema
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1
  },
  content: {
    padding: 18
  },
  nome: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4
  },
  morada: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8
  },
  tiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8
  },
  tipoChipText: {
    fontSize: 16,
    fontWeight: '700'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800'
  },
  inputDesc: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 14
  },
  uploadBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  uploadBtnText: {
    // color definido inline pelo tema
    fontWeight: '800',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  submitBtnText: {
    // color definido inline pelo tema
    fontWeight: '900',
    fontSize: 16,
  },
});
