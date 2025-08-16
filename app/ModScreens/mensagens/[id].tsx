import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ------------------ Tipos --------------------
type Estado = 'Análise' | 'Resolvido' | 'Irrelevante';
type TipoMsg = 'reporte' | 'ponto';

type DadosPonto = {
  tipo: 'ponto';
  id?: string;
  autor: string;
  data: string;
  titulo: string;
  descricao: string;
  morada: string;
  tipos: string[];
  lat: number;
  lng: number;
  imagem: string;
  estado: Estado;
};

type DadosReporte = {
  tipo: 'reporte';
  id?: string;
  autor: string;
  data: string;
  titulo: string;
  descricao: string;
  morada: string;
  imagem: string;
  estado: Estado;
};

type Dados = DadosPonto | DadosReporte;

// ------------------ Componente --------------------
export default function MensagemDetalhe() {
  const { id, tipo: tipoParam } = useLocalSearchParams<{ id: string; tipo?: TipoMsg }>();
  const router = useRouter();

  // Determina o tipo (pelo param ou pelo prefixo do id)
  const tipo: TipoMsg = (tipoParam as TipoMsg) || (id?.startsWith('p') ? 'ponto' : 'reporte');

  // MOCK: substitui por fetch real
  const dados: Dados = useMemo(() => {
    if (tipo === 'ponto') {
      const obj: DadosPonto = {
        tipo: 'ponto',
        id,
        autor: 'Pedro Silva',
        data: '15/08/2025',
        titulo: 'Proposta: Novo Ecoponto na Praça Velha',
        descricao: 'Sugiro criação de ecoponto com vidro/papel/plástico.',
        morada: 'Praça Velha, Bragança',
        tipos: ['vidro', 'papel', 'plastico'],
        lat: 41.806, lng: -6.757,
        imagem: 'https://picsum.photos/800/480?2',
        estado: 'Análise',
      };
      return obj;
    }
    const obj: DadosReporte = {
      tipo: 'reporte',
      id,
      autor: 'João Monteiro',
      data: '14/08/2025',
      titulo: 'Contentores cheios',
      descricao: 'Contentores cheios há alguns dias. Cheiro intenso e lixo fora dos baldes.',
      morada: 'Rua Camilo Castelo Branco, Bragança',
      imagem: 'https://picsum.photos/800/480?1',
      estado: 'Análise',
    };
    return obj;
  }, [id, tipo]);

  // Estado atual (editável via botões)
  const [estado, setEstado] = useState<Estado>(dados.estado);

  // --- UI helpers ---
  const EstadoChip = ({ v }: { v: Estado }) => (
    <Text
      style={[
        styles.chip,
        v === 'Resolvido' ? styles.chipDone : v === 'Análise' ? styles.chipProg : styles.chipIrrel,
      ]}
    >
      {v}
    </Text>
  );

  const TipoCirculo = ({ t }: { t: string }) => {
    const cores: Record<string, string> = {
      papel: '#2196F3', plastico: '#FFEB3B', vidro: '#4CAF50', pilhas: '#F44336',
      organico: '#795548', metal: '#9E9E9E', outros: '#9C27B0',
    };
    return (
      <View
        style={{
          backgroundColor: cores[t] || cores.outros,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 20,
          marginRight: 6,
          marginBottom: 6,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>{t}</Text>
      </View>
    );
  };

  // --- Ações com confirmação ---
  const confirm = (msg: string, onOk: () => void) =>
    Alert.alert('Confirmar', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onOk },
    ]);

  // Proposta de ponto
  const aprovarPonto = () => confirm('Aprovar novo ponto?', () => {
    // TODO: chamada ao backend para criar ponto + fechar a mensagem
    setEstado('Resolvido');
    Alert.alert('Aprovado', 'O ponto foi aprovado.');
  });

  const reprovarPonto = () => confirm('Reprovar a proposta de ponto?', () => {
    // TODO: backend
    setEstado('Irrelevante');
    Alert.alert('Reprovado', 'A proposta foi rejeitada.');
  });

  const enviarParaAnalise = () => confirm('Enviar para análise?', () => {
    // TODO: backend
    setEstado('Análise');
    Alert.alert('Enviado', 'Marcado para análise.');
  });

  // Reporte
  const marcarIrrelevante = () => confirm('Marcar como irrelevante?', () => {
    // TODO: backend
    setEstado('Irrelevante');
  });

  const marcarResolvido = () => confirm('Marcar como resolvido?', () => {
    // TODO: backend
    setEstado('Resolvido');
  });

  const guardarAlteracoes = () => {
    // TODO: persistir no backend o novo estado
    Alert.alert('Guardado', `Estado atualizado para "${estado}".`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header do Stack já dá back automático */}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Título + estado atual */}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {dados.titulo}
        </Text>
        <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <EstadoChip v={estado} />
        </View>
        <Text style={styles.meta}>de {dados.autor} • {dados.data}</Text>

        {/* Imagem */}
        <Image source={{ uri: dados.imagem }} style={styles.image} />

        {/* Descrição */}
        <Text style={styles.section}>Descrição</Text>
        <Text style={styles.box}>{dados.descricao}</Text>

        {/* Localização */}
        <Text style={styles.section}>Localização</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={18} color="#2E7D32" />
          <Text style={styles.locText}>{dados.morada}</Text>
          <Ionicons name="chevron-forward" size={18} color="#2E7D32" style={{ marginLeft: 'auto' }} />
        </View>

        {/* Secção extra se for proposta de ponto */}
        {dados.tipo === 'ponto' && (
          <>
            <Text style={styles.section}>Detalhes do novo ponto</Text>
            <View style={styles.boxRow}>
              <Text style={{ fontWeight: '700', marginBottom: 6 }}>Tipos sugeridos:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {dados.tipos.map((t, i) => <TipoCirculo t={t} key={`${t}-${i}`} />)}
              </View>
              <Text style={{ marginTop: 10, color: '#555' }}>
                Coordenadas sugeridas: {dados.lat.toFixed(3)}, {dados.lng.toFixed(3)}
              </Text>
            </View>
          </>
        )}

        {/* Botões de ação principais */}
        <View style={styles.actions}>
          {dados.tipo === 'ponto' ? (
            <>
              <TouchableOpacity style={[styles.btn, styles.green]} onPress={aprovarPonto}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Aprovar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.red]} onPress={reprovarPonto}>
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Reprovar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.amber]} onPress={enviarParaAnalise}>
                <Ionicons name="alert-circle-outline" size={18} color="#fff" style={styles.iconRightMargin} />
                <Text style={styles.btnText}>Enviar para análise</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.btn, styles.red]} onPress={marcarIrrelevante}>
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Irrelevante</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.amber]} onPress={enviarParaAnalise}>
                <Ionicons name="alert-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Análise</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.green]} onPress={marcarResolvido}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Resolvido</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Ações finais */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={[styles.btnGhost]} onPress={() => router.back()}>
            <Text style={[styles.btnGhostText]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSolid]} onPress={guardarAlteracoes}>
            <Text style={styles.btnSolidText}>Guardar alterações</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ------------------ Styles --------------------
const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  meta: { color: '#666', marginTop: 2, marginBottom: 10 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: '#eee' },

  section: { fontWeight: '800', marginTop: 8, marginBottom: 6, color: '#111' },
  box: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: 12, color: '#333', borderWidth: 1, borderColor: '#EEE' },
  boxRow: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EEE' },

  locRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF4EC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#DDEFE1' },
  locText: { marginLeft: 8, fontWeight: '700', color: '#2E7D32', flexShrink: 1 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  btn: { flexGrow: 1, flexBasis: '30%', minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, flexDirection: 'row', gap: 8 },
  btnText: { color: '#fff', fontWeight: '800' },

  red: { backgroundColor: '#D32F2F' },
  amber: { backgroundColor: '#FFA000' },
  green: { backgroundColor: '#2E7D32' },

  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, fontWeight: '800', color: '#fff', fontSize: 12 },
  chipDone: { backgroundColor: '#2E7D32' },
  chipProg: { backgroundColor: '#FFA000' },
  chipIrrel: { backgroundColor: '#D32F2F' },

  btnGhost: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  btnGhostText: { fontWeight: '800', color: '#333' },
  btnSolid: { flex: 1, borderRadius: 12, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  btnSolidText: { fontWeight: '800', color: '#fff' },

  btnShiftLeft: {
  justifyContent: 'flex-start',
  paddingLeft: 12,   
},
iconRightMargin: {
  marginRight: 6,    
},
});
