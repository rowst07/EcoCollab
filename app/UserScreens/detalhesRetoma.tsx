// app/SharedScreens/detalhesRetoma.tsx
import { THEME } from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

type Retoma = {
  id: string;
  nome: string;
  tipo: 'Troca' | 'Doação' | string;
  pontos: number;
  icon?: string;
  descricao?: string;
  fotoUri?: string | null;
  quantidade?: string;        // ex.: "1 saco (≈2kg)"
  local?: string;             // ex.: "Centro, Bragança"
  estado?: 'Ativa' | 'Reservada' | 'Concluída';
  autor?: string;             // ex.: "João Monteiro"
  eMinha?: boolean;           // para mostrar ações de edição
};

export default function DetalhesRetoma() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = THEME[scheme];
  const router = useRouter();
  const params = useLocalSearchParams();

  // Aceita navegação tanto por id isolado como pelo objeto completo
  const retoma: Retoma = useMemo(() => {
    // Quando navegas com params simples, chegam como string
    const base: Retoma = {
      id: String(params.id ?? Date.now()),
      nome: String(params.nome ?? 'Retoma'),
      tipo: (params.tipo as string) ?? 'Troca',
      pontos: Number(params.pontos ?? 0),
      icon: (params.icon as string) ?? 'recycle',
      descricao:
        (params.descricao as string) ??
        'Sem descrição. Adiciona uma descrição para facilitar a troca/doação.',
      fotoUri: (params.fotoUri as string) ?? null,
      quantidade: (params.quantidade as string) ?? '—',
      local: (params.local as string) ?? '—',
      estado: ((params.estado as Retoma['estado']) ?? 'Ativa'),
      autor: (params.autor as string) ?? 'Utilizador',
      eMinha: String(params.eMinha ?? '') === 'true',
    };
    return base;
  }, [params]);

  const [favorito, setFavorito] = useState(false);

  const handlePrimaria = () => {
    if (retoma.tipo?.toLowerCase() === 'troca') {
      Alert.alert('Propor troca', 'Funcionalidade por ligar à conversa / proposta.');
    } else {
      Alert.alert('Quero doar', 'Funcionalidade por ligar à conversa / confirmação.');
    }
  };

  const handleContactar = () => {
    Alert.alert('Contactar', 'Abrir chat interno ou partilhar contacto — por implementar.');
  };

  const handleEditar = () => {
    // Leva-te para o teu modal/página de edição se já existir
    Alert.alert('Editar retoma', 'Navegar para editar (a ligar).');
  };

  const handleDesativar = () => {
    Alert.alert('Desativar retoma', 'Marcar como concluída/reservada (a ligar à BD).');
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Detalhes
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setFavorito((f) => !f)}>
          <Ionicons
            name={favorito ? 'heart' : 'heart-outline'}
            size={22}
            color={favorito ? colors.danger : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero / Ícone + Título */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name={(retoma.icon as any) || 'recycle'}
                size={34}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textInput }]} numberOfLines={2}>
                {retoma.nome}
              </Text>
              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.text }]}>
                    {retoma.tipo}
                  </Text>
                </View>

                <View style={[styles.chip, { backgroundColor: colors.card }]}>
                  <MaterialCommunityIcons
                    name="star-circle-outline"
                    size={16}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.chipText, { color: colors.textInput }]}>
                    +{retoma.pontos} pts
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        retoma.estado === 'Concluída'
                          ? '#8E8E93'
                          : retoma.estado === 'Reservada'
                          ? '#FFCC00'
                          : '#34C759',
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.textInput }]}>
                  {retoma.estado}
                </Text>
              </View>
            </View>
          </View>

          {/* Foto se existir */}
          {retoma.fotoUri ? (
            <Image source={{ uri: retoma.fotoUri }} style={styles.photo} />
          ) : null}

          {/* Ações principais */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handlePrimaria}
            >
              <Text style={[styles.primaryBtnText, { color: colors.text }]}>
                {retoma.tipo?.toLowerCase() === 'troca' ? 'Propor troca' : 'Quero doar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
              onPress={handleContactar}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informação */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Informação</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Quantidade</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{retoma.quantidade}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Local</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{retoma.local}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textInput }]}>Anunciante</Text>
            <Text style={[styles.infoValue, { color: colors.textInput }]}>{retoma.autor}</Text>
          </View>
        </View>

        {/* Descrição */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Descrição</Text>
          <Text style={[styles.description, { color: colors.textInput }]}>{retoma.descricao}</Text>
        </View>

        {/* Ações do proprietário */}
        {retoma.eMinha && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textInput }]}>Gestão</Text>

            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.ownerBtn, { borderColor: colors.primary }]}
                onPress={handleEditar}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.ownerBtnText, { color: colors.primary }]}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ownerBtn, { borderColor: '#FF3B30' }]}
                onPress={handleDesativar}
              >
                <Ionicons name="close-circle-outline" size={16} color="#FF3B30" />
                <Text style={[styles.ownerBtnText, { color: '#FF3B30' }]}>Desativar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 120 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#EEEDD7', // mantém o padrão dos chips “resíduos”
  },
  title: { fontSize: 18, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    marginRight: 6,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  actionsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, opacity: 0.9 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 20 },
  ownerActions: { flexDirection: 'row', gap: 10 },
  ownerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ownerBtnText: { fontSize: 14, fontWeight: '700' },
});
