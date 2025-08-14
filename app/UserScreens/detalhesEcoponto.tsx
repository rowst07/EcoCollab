// app/UserScreens/detalhesEcoponto.tsx
import { BRAND, RESIDUE_COLORS } from '@/constants/Colors';
import { useTheme, useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type Ecoponto = {
  id: number;
  nome: string;
  morada: string;
  tipos: string[];
  classificacao: number; // 0-5
  latitude: number;
  longitude: number;
};

// ⚠️ MOCK: troca por fetch a API/estado global
const MOCK: Ecoponto[] = [
  { id: 1, nome: 'Ecoponto Vidro Centro', morada: 'Centro, Bragança', tipos: ['vidro'], classificacao: 4, latitude: 41.805, longitude: -6.756 },
  { id: 2, nome: 'Ecoponto Escola',       morada: 'Junto à Escola X',  tipos: ['papel','plastico','metal'], classificacao: 3, latitude: 41.808, longitude: -6.754 },
];

export default function DetalhesEcoponto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Tema
  const t = useTheme();
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const card = useThemeColor('card');
  const bg = useThemeColor('bg');

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

  const abrirNavegacao = () => {
    const { latitude: lat, longitude: lng, nome } = ecoponto;
    const label = encodeURIComponent(nome);
    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`);
    } else {
      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
    }
  };

  const renderEstrelas = (n: number) => (
    <View style={{ flexDirection: 'row' }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons
          key={i}
          name={i <= n ? 'star' : 'star-outline'}
          size={26}
          color={BRAND.star}
        />
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header (mantemos preto para consistência visual do app) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Ecoponto</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Street View full width */}
        {streetViewUrl ? (
          <Image source={{ uri: streetViewUrl }} style={{ width, height }} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { width, height, borderColor: border, backgroundColor: card }]}>
            <Ionicons name="image" size={32} color={muted} />
            <Text style={{ color: muted, marginTop: 6 }}>Street View não disponível</Text>
          </View>
        )}

        {/* Conteúdo */}
        <View style={[styles.content]}>
          {/* Título centrado e morada */}
          <Text style={[styles.nome, { color: text }]}>{ecoponto.nome}</Text>
          <Text style={[styles.morada, { color: muted }]}>{ecoponto.morada}</Text>

          {/* Resíduos aceites */}
          <Text style={[styles.subTitle, { color: text }]}>Tipos de resíduos aceites</Text>
          <View style={styles.tiposWrap}>
            {ecoponto.tipos.map((tpo: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.tipoChip,
                  { backgroundColor: '#EEEDD7', borderColor: border }
                ]}
              >
                <View style={[styles.dot, { backgroundColor: RESIDUE_COLORS[tpo] || RESIDUE_COLORS.outros }]} />
                <Text style={[styles.tipoChipText, { color: '#000' }]}>{tpo.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Classificação (maior) */}
          <Text style={[styles.subTitle, { color: text }]}>Classificação</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            {renderEstrelas(ecoponto.classificacao)}
            <Text style={[styles.classText, { color: text }]}>{ecoponto.classificacao}.0</Text>
          </View>

          {/* Ações (mesmas dimensões, empilhadas) */}
          <View style={styles.actionsCol}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: BRAND.primary }]}
              onPress={abrirNavegacao}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Ir para o local</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: BRAND.danger }]}
              onPress={() => router.push(`/UserScreens/report?id=${ecoponto.id}`)}
            >
              <Ionicons name="alert-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Reportar problema</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#111'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
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
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6
  },
  morada: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10
  },
  tiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#EEEDD7',
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
  classText: {
    marginLeft: 8,
    fontWeight: '800',
    fontSize: 18
  },
  actionsCol: {
    marginTop: 6,
    alignItems: 'center'
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '80%'
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16
  }
});
