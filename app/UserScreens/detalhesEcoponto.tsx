import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Dimensions, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const cores: Record<string, string> = {
  papel: '#2196F3',
  plastico: '#FFEB3B',
  vidro: '#4CAF50',
  pilhas: '#F44336',
  organico: '#795548',
  metal: '#9E9E9E',
  outros: '#9C27B0'
};

// MOCK: substitui por fetch/estado global
const MOCK: any[] = [
  { id: 1, nome: 'Ecoponto Vidro Centro', morada: 'Centro, Bragança', tipos: ['vidro'], classificacao: 4, latitude: 41.805, longitude: -6.756 },
  { id: 2, nome: 'Ecoponto Escola', morada: 'Junto à Escola X', tipos: ['papel','plastico','metal'], classificacao: 3, latitude: 41.808, longitude: -6.754 },
];

export default function DetalhesEcoponto() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const ecoponto = useMemo(() => {
    const nId = Number(id);
    return MOCK.find((e) => e.id === nId) ?? MOCK[0];
  }, [id]);

  const width = Dimensions.get('window').width;
  const height = Math.round(width * 9 / 16);

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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
        <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={26} color="#FFA000" />
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header preto */}
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
          <View style={[styles.placeholder, { width, height }]}>
            <Ionicons name="image" size={32} color="#aaa" />
            <Text style={{ color: '#aaa', marginTop: 6 }}>Street View não disponível</Text>
          </View>
        )}

        {/* Conteúdo */}
        <View style={styles.content}>
          {/* Título centrado */}
          <Text style={styles.nome}>{ecoponto.nome}</Text>
          <Text style={styles.morada}>{ecoponto.morada}</Text>

          {/* Resíduos aceites */}
          <Text style={styles.subTitle}>Tipo de resíduos aceites</Text>
          <View style={styles.tiposWrap}>
            {ecoponto.tipos.map((t: string, idx: number) => (
              <View key={idx} style={styles.tipoChip}>
                <View style={[styles.dot, { backgroundColor: cores[t] || cores.outros }]} />
                <Text style={styles.tipoChipText}>{t.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Classificação */}
          <Text style={styles.subTitle}>Classificação</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            {renderEstrelas(ecoponto.classificacao)}
            <Text style={styles.classText}>{ecoponto.classificacao}.0</Text>
          </View>

          {/* Ações (mesma largura) */}
          <View style={styles.actionsCol}>
            <TouchableOpacity style={styles.actionBtn} onPress={abrirNavegacao}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Ir para o local</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportBtn} onPress={() => console.log('Reportar problema')}>
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
    paddingTop: 60,
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
    padding: 18,
  },
  nome: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center'
  },
  morada: {
    fontSize: 16,
    color: '#666',
    marginBottom: 18,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10
  },
  tiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEDD7',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  dot: {
    width: 18, // círculo maior
    height: 18,
    borderRadius: 9,
    marginRight: 8
  },
  tipoChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  classText: {
    marginLeft: 8,
    color: '#444',
    fontWeight: '800',
    fontSize: 18 // maior
  },
  actionsCol: {
    marginTop: 6,
    alignItems: 'center'
  },
  actionBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    marginTop: 15,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '80%'
  },
  reportBtn: {
    backgroundColor: '#EA3323',
    marginTop: 15,
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
