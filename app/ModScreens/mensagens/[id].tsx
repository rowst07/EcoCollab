import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Estado = 'Análise' | 'Resolvido' | 'Irrelevante';

export default function MensagemDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  //MOCK: substitui por fetch real
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

  const EstadoChip = ({ value }: { value: Estado }) => {
    const st =
      value === 'Resolvido' ? styles.chipDone :
      value === 'Análise'   ? styles.chipProg :
      styles.chipIrrel;
    return <Text style={[styles.chip, st]}>{value}</Text>;
  };

  const confirmarMudanca = (novo: Estado) => {
    if (novo === estado) return;
    Alert.alert(
      novo === 'Irrelevante' ? 'Marcar como irrelevante?' :
      novo === 'Análise' ? 'Enviar para análise?' :
      'Marcar como resolvido?',
      'Podes reverter depois, se necessário.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'destructive', onPress: () => setEstado(novo) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Sem botão manual de recuo aqui – fica só o back do header do Stack */}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Título + estado */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>{reporte.titulo}</Text>
          <View style={{ marginLeft: 'auto' }}>
            <EstadoChip value={estado} />
          </View>
        </View>
        <Text style={styles.meta}>de {reporte.autor} • {reporte.data}</Text>

        {/* Imagem */}
        <Image source={{ uri: reporte.imagem }} style={styles.image} />

        {/* Descrição */}
        <Text style={styles.sectionLabel}>Descrição</Text>
        <Text style={styles.box}>{reporte.descricao}</Text>

        {/* Localização */}
        <Text style={styles.sectionLabel}>Localização</Text>
        <TouchableOpacity style={styles.locationRow} onPress={() => { /* abre mapa futuramente */ }}>
          <Ionicons name="location-outline" size={18} color="#2E7D32" />
          <Text style={styles.locationText}>{reporte.morada}</Text>
          <Ionicons name="chevron-forward" size={18} color="#2E7D32" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Ações de estado */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.irrelevante]}
            onPress={() => confirmarMudanca('Irrelevante')}
          >
            <Ionicons name="close-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Irrelevante</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.analise]}
            onPress={() => confirmarMudanca('Análise')}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Enviar para análise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.resolvido]}
            onPress={() => confirmarMudanca('Resolvido')}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Resolvido</Text>
          </TouchableOpacity>
        </View>

        {/* Ações finais */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={[styles.btnGhost]} onPress={() => router.back()}>
            <Text style={[styles.btnGhostText]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSolid]}
            onPress={() => {
              // 👉 integra a tua API para persistir o novo estado
              Alert.alert('Guardado', `Estado atualizado para "${estado}".`);
            }}
          >
            <Text style={styles.btnSolidText}>Guardar alterações</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title:{ fontSize:20, fontWeight:'800', color:'#111' },
  meta:{ color:'#666', marginTop:2, marginBottom:10 },

  image:{ width:'100%', height:200, borderRadius:12, marginBottom:12, backgroundColor:'#eee' },

  sectionLabel:{ fontWeight:'800', marginTop:8, marginBottom:6, color:'#111' },
  box:{ backgroundColor:'#F7F7F7', borderRadius:12, padding:12, color:'#333', borderWidth:1, borderColor:'#EEE' },

  locationRow:{ flexDirection:'row', alignItems:'center', backgroundColor:'#EAF4EC', borderRadius:12, padding:12, borderWidth:1, borderColor:'#DDEFE1' },
  locationText:{ marginLeft:8, fontWeight:'700', color:'#2E7D32', flexShrink:1 },

  actions:{ flexDirection:'row', gap:8, marginTop:16, flexWrap:'wrap' },
  btn:{ flexGrow:1, flexBasis:'30%', minHeight:44, borderRadius:12, alignItems:'center', justifyContent:'center', paddingVertical:12, flexDirection:'row', gap:8 },
  btnText:{ color:'#fff', fontWeight:'800' },
  irrelevante:{ backgroundColor:'#D32F2F' },
  analise:{ backgroundColor:'#FFA000' },
  resolvido:{ backgroundColor:'#2E7D32' },

  chip:{ paddingVertical:4, paddingHorizontal:10, borderRadius:12, fontWeight:'800', color:'#fff', fontSize:12 },
  chipDone:{ backgroundColor:'#2E7D32' },
  chipProg:{ backgroundColor:'#FFA000' },
  chipIrrel:{ backgroundColor:'#D32F2F' },

  btnGhost:{ flex:1, borderRadius:12, borderWidth:1, borderColor:'#DDD', alignItems:'center', justifyContent:'center', paddingVertical:12 },
  btnGhostText:{ fontWeight:'800', color:'#333' },
  btnSolid:{ flex:1, borderRadius:12, backgroundColor:'#2E7D32', alignItems:'center', justifyContent:'center', paddingVertical:12 },
  btnSolidText:{ fontWeight:'800', color:'#fff' },
});