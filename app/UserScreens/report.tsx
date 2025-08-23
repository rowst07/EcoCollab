// app/UserScreens/report.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

// 🔥 Firestore + Auth + Cloudinary
import { useAuth } from '@/services/AuthContext';
import {
  addReporte,
  subscribePontoRecolhaById,
  type PontoMarker,
} from '@/services/FirestoreService';
import { CLOUDINARY_UPLOAD_PRESET, uploadToCloudinary } from '@/services/uploadCloudinary';

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
  const pontoId = Array.isArray(id) ? id[0] : id;

  const { user } = useAuth();

  // Tema escuro fixo (como tinhas)
  const colors = THEME.dark;
  const bg = colors.bg;
  const text = colors.text;
  const muted = colors.textMuted;
  const card = colors.card;
  const border = colors.border;

  const [eco, setEco] = useState<PontoMarker | null>(null);
  const [loading, setLoading] = useState(true);

  // buscar ecoponto ao Firestore (tempo-real)
  useEffect(() => {
    if (!pontoId) return;
    const unsub = subscribePontoRecolhaById(pontoId, (p) => {
      setEco(p);
      setLoading(false);
    });
    return () => unsub();
  }, [pontoId]);

  const width = Dimensions.get('window').width;
  const height = Math.round(width * 9 / 16);

  // Form state
  const [tipoProblema, setTipoProblema] = useState('cheio');
  const [descricao, setDescricao] = useState('');
  const [imagens, setImagens] = useState<string[]>([]); // <— várias imagens
  const [aEnviar, setAEnviar] = useState(false);

  const escolherImagem = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autoriza o acesso à galeria para anexar imagens.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImagens((prev) => [...prev, uri]);
    }
  };

  const removerImagem = (idx: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== idx));
  };

  const abrirNavegacao = () => {
    if (!eco) return;
    const { latitude: lat, longitude: lng, nome } = eco;
    const label = encodeURIComponent(nome);
    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`);
    } else {
      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
    }
  };

  const submeter = async () => {
    if (!user?.uid) return Alert.alert('Sessão', 'Tens de iniciar sessão para enviar um reporte.');
    if (!pontoId) return Alert.alert('Erro', 'ID do ponto em falta.');
    if (!tipoProblema) return Alert.alert('Validação', 'Escolhe um tipo de problema.');
    if (!descricao || descricao.trim().length < 5) {
      return Alert.alert('Validação', 'Escreve uma descrição mais detalhada (≥ 5 caracteres).');
    }

    try {
      setAEnviar(true);

      // 1) upload de TODAS as imagens (se existirem)
      let fotosUrl: string[] = [];
      if (imagens.length > 0) {
        const uploads = imagens.map((uri, i) =>
          uploadToCloudinary(uri, {
            folder: `ecocollab/reportes/${user.uid}`,
            uploadPreset: CLOUDINARY_UPLOAD_PRESET,
            publicId: `reporte_${Date.now()}_${i}`,
            tags: ['reporte', user.uid, String(pontoId)],
            context: { pontoId: String(pontoId), user: user.uid },
            contentType: 'image/jpeg',
          })
        );
        const resps = await Promise.all(uploads);
        fotosUrl = resps
          .map((r) => r?.secure_url)
          .filter((u): u is string => !!u);
      }

      // 2) gravar reporte no Firestore
      await addReporte({
        pontoId: String(pontoId),
        tipo: tipoProblema,
        descricao: descricao.trim(),
        fotoUrl: fotosUrl[0] ?? null,  // retrocompat (primeira)
        fotosUrl: fotosUrl,            // array completo
        criadoPor: user.uid,
        criadoPorDisplay: user.displayName ?? null,
        status: 'aberto',
      });

      Alert.alert('Obrigado!', 'O teu reporte foi enviado com sucesso.');
      router.back();
    } catch (e) {
      console.error(e);
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
        {/* Foto do ponto (se existir) ou placeholder */}
        {eco?.fotoUrl ? (
          <Image source={{ uri: eco.fotoUrl }} style={{ width, height }} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { width, height, backgroundColor: card, borderColor: border }]}>
            <Ionicons name="image" size={32} color={muted} />
            <Text style={{ color: muted, marginTop: 6 }}>Ponto de Recolha sem foto</Text>
          </View>
        )}

        {/* Conteúdo */}
        <View style={styles.content}>
          {/* Identificação */}
          <Text style={[styles.nome, { color: text }]}>{eco?.nome ?? 'Ecoponto'}</Text>
          {!!eco?.morada && <Text style={[styles.morada, { color: muted }]}>{eco.morada}</Text>}

          {/* Ações rápidas */}
          {eco?.latitude != null && eco?.longitude != null && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2E7D32' }]}
                onPress={abrirNavegacao}
              >
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Ir para o local</Text>
              </TouchableOpacity>
            </View>
          )}

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

          {/* Botões de imagens */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.bg, flex: 1 }]}
              onPress={escolherImagem}
            >
              <Ionicons name="image" size={20} color={colors.text} />
              <Text style={[styles.uploadBtnText, { color: colors.text }]}>Adicionar imagem</Text>
            </TouchableOpacity>

            {imagens.length > 0 && (
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: '#b00020' }]}
                onPress={() => setImagens([])}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.removeBtnText}>Remover todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Pré‑visualização (com remover por item) */}
          {imagens.length > 0 && (
            <View style={styles.previewWrap}>
              {imagens.map((uri, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <Image source={{ uri }} style={styles.previewImg} />
                  <TouchableOpacity
                    style={styles.removeThumbBtn}
                    onPress={() => removerImagem(idx)}
                    accessibilityLabel="Remover esta imagem"
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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

const THUMB = 86;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
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
  },
  uploadBtnText: {
    fontWeight: '800',
  },
  removeBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  previewWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  previewItem: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#00000088',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '900',
    fontSize: 16,
  },
});
