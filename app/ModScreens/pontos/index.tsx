import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PONTOS = [
  { id: 'p1', nome: 'Ecoponto Centro', tipos: ['vidro'] },
  { id: 'p2', nome: 'Ecoponto Escola', tipos: ['papel','plastico','metal'] },
  { id: 'p3', nome: 'Ecoponto Mercado', tipos: ['organico','vidro'] },
];

export default function GestaoPontos() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const data = useMemo(() => PONTOS.filter(p => p.nome.toLowerCase().includes(q.toLowerCase())), [q]);

  const TipoCirculo = ({ t }: { t: string }) => {
    const cores: Record<string,string> = {
      papel:'#2196F3', plastico:'#FFEB3B', vidro:'#4CAF50', pilhas:'#F44336', organico:'#795548', metal:'#9E9E9E', outros:'#9C27B0'
    };
    return <View style={{ width:14,height:14,borderRadius:7, marginRight:6, backgroundColor: cores[t] || cores.outros, borderWidth:1, borderColor:'#00000020' }} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* LOGO + EcoCollab */}
      <View style={styles.brandBar}>
        <Image source={require('../../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
        <Text style={styles.brandText}>EcoCollab</Text>
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Gestão de Pontos</Text>
          <Text style={styles.subtitle}>Adicionar, editar ou eliminar</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/ModScreens/pontos/novo')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por nome..."
          placeholderTextColor="#888"
          value={q}
          onChangeText={setQ}
        />
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal:16, paddingTop:10, paddingBottom:16 }}
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/ModScreens/pontos/editar/${item.id}`)}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', marginTop:6 }}>
              {item.tipos.map((t, i) => <TipoCirculo key={`${item.id}-${t}-${i}`} t={t} />)}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2E7D32" style={{ position:'absolute', right:12, top:14 }} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={{ textAlign:'center', color:'#666', marginTop:30 }}>Sem pontos.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },

  // brand bar
   brandBar: {
    backgroundColor: '#EFEADB',          // bege do mockup
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCBBF',
  },
  brandLogo: { width: 195, height: 99, marginBottom: -20, marginTop: -10 },
  brandText: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },

  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:10 },
  title:{ fontSize:22, fontWeight:'800', color:'#111' },
  subtitle:{ color:'#666', marginTop:2 },

  addBtn:{ backgroundColor:'#2E7D32', width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center' },

  searchWrap:{
    marginTop:10, marginHorizontal:16,
    flexDirection:'row', alignItems:'center',
    backgroundColor:'#F7F7F7', borderRadius:12, paddingHorizontal:10, paddingVertical:10,
    borderWidth:1, borderColor:'#ECECEC'
  },
  searchInput:{ marginLeft:8, flex:1, color:'#111' },

  card:{
    backgroundColor:'#fff', borderRadius:16, padding:14,
    borderWidth:1, borderColor:'#ECECEC',
    shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, shadowOffset:{width:0,height:2}, elevation:2
  },
  cardTitle:{ fontWeight:'800', color:'#111' },
});
