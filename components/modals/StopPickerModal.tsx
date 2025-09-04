// components/route/StopPickerModal.tsx
import { BRAND, THEME } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { subscribePontosRecolha, type PontoMarker } from '@/services/FirestoreService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (p: { id: string; nome?: string; lat: number; lng: number }) => void;
};

export const StopPickerModal: React.FC<Props> = ({ visible, onClose, onPick }) => {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const card = useThemeColor('card');

  const [loading, setLoading] = useState(true);
  const [pontos, setPontos] = useState<PontoMarker[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const unsub = subscribePontosRecolha({
      statusEq: 'aprovado',
      onData: (markers) => {
        setPontos(markers.filter(m => !!m.latitude && !!m.longitude));
        setLoading(false);
      }
    });
    return () => unsub();
  }, [visible]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return pontos;
    return pontos.filter(p =>
      p.nome?.toLowerCase().includes(s) ||
      p.morada?.toLowerCase().includes(s) ||
      p.tipos?.join(' ').toLowerCase().includes(s)
    );
  }, [pontos, q]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: THEME.dark.bg, borderColor: border }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: text }]}>Adicionar paragem</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={text} /></TouchableOpacity>
          </View>

          <TextInput
            placeholder="Procurar por nome, morada ou tipo…"
            placeholderTextColor={muted}
            value={q}
            onChangeText={setQ}
            style={[styles.search, { borderColor: border, color: text }]}
          />

          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator />
              <Text style={{ color: muted, marginTop: 8 }}>A carregar pontos…</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 360 }}>
              {filtered.map(p => (
                <View key={p.id} style={[styles.item, { borderColor: border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: text }]}>{p.nome}</Text>
                    {!!p.morada && <Text style={{ color: muted, fontSize: 12 }}>{p.morada}</Text>}
                    {!!p.tipos?.length && <Text style={{ color: muted, fontSize: 12 }}>Tipos: {p.tipos.join(', ')}</Text>}
                  </View>
                  <TouchableOpacity
                    onPress={() => { onPick({ id: p.id, nome: p.nome, lat: p.latitude, lng: p.longitude }); onClose(); }}
                    style={styles.addBtn}
                  >
                    <Ionicons name="add-circle" size={22} color="#fff" />
                    <Text style={styles.addTxt}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {!filtered.length && (
                <Text style={{ color: muted, padding: 16, textAlign: 'center' }}>
                  Sem resultados para “{q}”.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex:1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, padding: 12 },
  sheetHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: 8 },
  sheetTitle: { fontWeight:'900', fontSize: 16 },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  item: { flexDirection:'row', gap:10, alignItems:'center', paddingVertical: 10, borderBottomWidth: 1 },
  itemTitle: { fontWeight:'800' },
  addBtn: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor: BRAND.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  addTxt: { color:'#fff', fontWeight:'800' }
});
