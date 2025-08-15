import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Estado = 'Análise' | 'Resolvido' | 'Irrelevante';

export default function MensagemDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const reporte = useMemo(() => ({
    id,
    autor: 'João Monteiro',
    data: '14/08/2025',
    titulo: 'Contentores cheios',
    descricao: 'Contentores cheios há alguns dias. Cheiro intenso e lixo fora dos baldes.',
    morada: 'Rua Camilo Castelo Branco, Bragança',
    imagem: 'https://picsum.photos/800/480',
    estado: 'Análise' as Estado,
  }), [id]);

  const [estado, setEstado] = useState<Estado>(reporte.estado);

  const confirmar = (novo: Estado) => {
    if (novo === estado) return;
    Alert.alert('Confirmar', `Mudar estado para "${novo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: () => setEstado(novo) },
    ]);
  };

  const Chip = ({ v }: { v: Estado }) => (
    <Text style={[
      styles.chip,
      v === 'Resolvido' ? styles.done : v === 'Análise' ? styles.prog : styles.irrel,
    ]}>{v}</Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reporte #{reporte.id}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>{reporte.titulo}</Text>
          <View style={{ marginLeft: 'auto' }}><Chip v={estado} /></View>
        </View>
        <Text style={styles.meta}>de {reporte.autor} • {reporte.data}</Text>

        <Image source={{ uri: reporte.imagem }} style={styles.image} />

        <Text style={styles.section}>Descrição</Text>
        <Text style={styles.box}>{reporte.descricao}</Text>

        <Text style={styles.section}>Localização</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={18} color="#2E7D32" />
          <Text style={styles.locText}>{reporte.morada}</Text>
          <Ionicons name="chevron-forward" size={18} color="#2E7D32" style={{ marginLeft: 'auto' }} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.irrelBtn]} onPress={() => confirmar('Irrelevante')}>
            <Ionicons name="close-circle-outline" size={18} color="#fff" /><Text style={styles.btnTxt}>Irrelevante</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.progBtn]} onPress={() => confirmar('Análise')}>
            <Ionicons name="alert-circle-outline" size={18} color="#fff" /><Text style={styles.btnTxt}>Enviar para análise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.doneBtn]} onPress={() => confirmar('Resolvido')}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={styles.btnTxt}>Resolvido</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:12, paddingTop:10, paddingBottom:6 },
  back:{ width:36, height:36, borderRadius:10, backgroundColor:'#F1F1F1', alignItems:'center', justifyContent:'center' },
  headerTitle:{ fontSize:18, fontWeight:'800', color:'#111' },
  title:{ fontSize:20, fontWeight:'800', color:'#111' },
  meta:{ color:'#666', marginTop:2, marginBottom:10 },
  image:{ width:'100%', height:200, borderRadius:12, marginBottom:12, backgroundColor:'#eee' },
  section:{ fontWeight:'800', marginTop:8, marginBottom:6, color:'#111' },
  box:{ backgroundColor:'#F7F7F7', borderRadius:12, padding:12, color:'#333', borderWidth:1, borderColor:'#EEE' },
  locRow:{ flexDirection:'row', alignItems:'center', backgroundColor:'#EAF4EC', borderRadius:12, padding:12, borderWidth:1, borderColor:'#DDEFE1' },
  locText:{ marginLeft:8, fontWeight:'700', color:'#2E7D32', flexShrink:1 },
  actions:{ flexDirection:'row', gap:8, marginTop:16, flexWrap:'wrap' },
  btn:{ flexGrow:1, flexBasis:'30%', minHeight:44, borderRadius:12, alignItems:'center', justifyContent:'center', paddingVertical:12, flexDirection:'row', gap:8 },
  btnTxt:{ color:'#fff', fontWeight:'800' },
  irrelBtn:{ backgroundColor:'#D32F2F' },
  progBtn:{ backgroundColor:'#FFA000' },
  doneBtn:{ backgroundColor:'#2E7D32' },
  chip:{ paddingVertical:4, paddingHorizontal:10, borderRadius:12, fontWeight:'800', color:'#fff', fontSize:12 },
  done:{ backgroundColor:'#2E7D32' }, prog:{ backgroundColor:'#FFA000' }, irrel:{ backgroundColor:'#D32F2F' },
});

