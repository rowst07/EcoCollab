import {
  subscribePontoRecolhaById,
  subscribeReporteById,
  updateReporteStatus,
  type ReporteStatus,
} from '@/services/FirestoreService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/* ========= Estados (UI) ========= */
// Core usados nas ações/filtros
type EstadoCore = 'Pendente' | 'Aprovado' | 'Reprovado';
// Extras que podem existir no Firestore
type EstadoExtra = 'Em análise' | 'Resolvido' | 'Aberto';
type Estado = EstadoCore | EstadoExtra;

/** Firestore -> UI label */
function fsToLabel(status?: string): Estado {
  switch ((status || '').toLowerCase()) {
    case 'pendente':    return 'Pendente';
    case 'aprovado':    return 'Aprovado';
    case 'reprovado':   return 'Reprovado';
    case 'em-analise':  return 'Em análise';
    case 'resolvido':   return 'Resolvido';
    case 'aberto':      return 'Aberto';
    default:            return 'Pendente';
  }
}

/** UI core -> Firestore (para ações de estado) */
const labelToFs: Record<EstadoCore, ReporteStatus> = {
  Pendente:  'pendente',
  Aprovado:  'aprovado',
  Reprovado: 'reprovado',
};

export default function MensagemDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState<string>('Reporte');
  const [descricao, setDescricao] = useState<string>('');
  const [autor, setAutor] = useState<string>('Utilizador');
  const [dataStr, setDataStr] = useState<string>('');
  const [imagem, setImagem] = useState<string | undefined>(undefined);
  const [morada, setMorada] = useState<string | undefined>(undefined);
  const [estado, setEstado] = useState<Estado>('Pendente');
  const [pontoId, setPontoId] = useState<string | undefined>(undefined);

  // Carrega reporte + (opcional) morada do ponto associado
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeReporteById(id, (r) => {
      if (!r) { setLoading(false); return; }
      setTitulo(r.tipo ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1) : 'Reporte');
      setDescricao(r.descricao || '');
      setAutor(r.criadoPorDisplay || 'Utilizador');
      setDataStr(r.dataCriacao?.toDate ? r.dataCriacao.toDate().toLocaleDateString() : '');
      setImagem(r.fotoUrl ?? undefined);
      setEstado(fsToLabel(r.status));
      setPontoId(r.pontoId); // pode ser undefined
      setLoading(false);
    });
    return unsub;
  }, [id]);

  // Se houver pontoId, subscreve ponto para obter morada
  useEffect(() => {
    if (!pontoId) return;
    const unsub = subscribePontoRecolhaById(pontoId, (p) => {
      setMorada(p?.morada);
    });
    return unsub;
  }, [pontoId]);

  // --- UI helpers ---
  const EstadoChip = ({ v }: { v: Estado }) => (
    <Text
      style={[
        styles.chip,
        v === 'Aprovado' || v === 'Resolvido'
          ? styles.chipDone
          : v === 'Pendente' || v === 'Em análise' || v === 'Aberto'
          ? styles.chipProg
          : v === 'Reprovado'
          ? styles.chipIrrel
          : styles.chipProg,
      ]}
    >
      {v}
    </Text>
  );

  const confirm = (msg: string, onOk: () => void) =>
    Alert.alert('Confirmar', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onOk },
    ]);

  // Ações — gravam no Firestore (usamos apenas estados core)
  const marcarPendente = () =>
    confirm('Marcar como pendente?', async () => {
      await updateReporteStatus(String(id), labelToFs['Pendente']);
      setEstado('Pendente');
      Alert.alert('Atualizado', 'Marcado como pendente.');
    });

  const marcarAprovado = () =>
    confirm('Marcar como aprovado?', async () => {
      await updateReporteStatus(String(id), labelToFs['Aprovado']);
      setEstado('Aprovado');
      Alert.alert('Atualizado', 'Marcado como aprovado.');
    });

  const marcarReprovado = () =>
    confirm('Marcar como reprovado?', async () => {
      await updateReporteStatus(String(id), labelToFs['Reprovado']);
      setEstado('Reprovado');
      Alert.alert('Atualizado', 'Marcado como reprovado.');
    });

  const guardarAlteracoes = async () => {
    // Se o estado atual for um extra (ex.: "Em análise"), faz fallback para 'Pendente'
    const core: EstadoCore =
      estado === 'Aprovado' || estado === 'Reprovado' ? estado : 'Pendente';
    await updateReporteStatus(String(id), labelToFs[core]);
    setEstado(core);
    Alert.alert('Guardado', `Estado atualizado para "${core}".`);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop:8 }}>A carregar…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Título + estado atual */}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {titulo}
        </Text>
        <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
          <EstadoChip v={estado} />
        </View>
        <Text style={styles.meta}>de {autor}{dataStr ? ` • ${dataStr}` : ''}</Text>

        {/* Imagem */}
        {imagem ? <Image source={{ uri: imagem }} style={styles.image} /> : null}

        {/* Descrição */}
        <Text style={styles.section}>Descrição</Text>
        <Text style={styles.box}>{descricao || '—'}</Text>

        {/* Localização (se houver ponto associado) */}
        {morada ? (
          <>
            <Text style={styles.section}>Localização</Text>
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={18} color="#2E7D32" />
              <Text style={styles.locText}>{morada}</Text>
              <Ionicons name="chevron-forward" size={18} color="#2E7D32" style={{ marginLeft: 'auto' }} />
            </View>
          </>
        ) : null}

        {/* Botões de ação */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.red]} onPress={marcarReprovado}>
            <Ionicons name="close-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Reprovado</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.amber]} onPress={marcarPendente}>
            <Ionicons name="alert-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Pendente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.green]} onPress={marcarAprovado}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Aprovado</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  meta: { color: '#666', marginTop: 2, marginBottom: 10 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: '#eee' },

  section: { fontWeight: '800', marginTop: 8, marginBottom: 6, color: '#111' },
  box: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: 12, color: '#333', borderWidth: 1, borderColor: '#EEE' },

  locRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF4EC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#DDEFE1' },
  locText: { marginLeft: 8, fontWeight: '700', color: '#2E7D32', flexShrink: 1 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  btn: { flexGrow: 1, flexBasis: '30%', minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, flexDirection: 'row', gap: 8 },
  btnText: { color: '#fff', fontWeight: '800' },

  red: { backgroundColor: '#D32F2F' },
  amber: { backgroundColor: '#FFA000' },
  green: { backgroundColor: '#2E7D32' },

  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, fontWeight: '800', color: '#fff', fontSize: 12 },
  chipDone: { backgroundColor: '#2E7D32' },  // Aprovado / Resolvido
  chipProg: { backgroundColor: '#FFA000' },  // Pendente / Em análise / Aberto
  chipIrrel: { backgroundColor: '#D32F2F' }, // Reprovado

  btnGhost: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  btnGhostText: { fontWeight: '800', color: '#333' },
  btnSolid: { flex: 1, borderRadius: 12, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  btnSolidText: { fontWeight: '800', color: '#fff' },
});
