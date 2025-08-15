import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const USERS = [
  { id: 'u1', nome: 'Ana Martins',    role: 'Membro' },
  { id: 'u2', nome: 'Beatriz Fonseca', role: 'Membro' },
  { id: 'u3', nome: 'João Monteiro',   role: 'Membro' },
  { id: 'u4', nome: 'Rita Alves',      role: 'Moderador' },
];

export default function GestaoUtilizadores() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const data = useMemo(() => USERS.filter(u => u.nome.toLowerCase().includes(q.toLowerCase())), [q]);

  const RolePill = ({ role }: { role: string }) => (
    <Text style={[styles.pill, role === 'Moderador' ? styles.pillMod : styles.pillMem]}>
      {role}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* LOGO + EcoCollab */}
      <View style={styles.brandBar}>
        <Image source={require('../../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
        <Text style={styles.brandText}>EcoCollab</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Utilizadores</Text>
        <Text style={styles.subtitle}>Editar, eliminar e ver detalhes</Text>
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
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/ModScreens/utilizadores/${item.id}`)}>
            <Image source={{ uri: `https://i.pravatar.cc/100?u=${item.id}` }} style={styles.avatar} />
            <View style={{ flex:1 }}>
              <Text style={styles.rowTitle}>{item.nome}</Text>
              <View style={{ marginTop:4 }}><RolePill role={item.role} /></View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2E7D32" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={{ textAlign:'center', color:'#666', marginTop:30 }}>Sem utilizadores.</Text>}
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
    paddingTop: -20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCBBF',
  },
  brandLogo: { width: 195, height: 99, marginBottom: -20 },
  brandText: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },

  header:{ paddingHorizontal:16, paddingTop:10, paddingBottom:4 },
  title:{ fontSize:22, fontWeight:'800', color:'#111' },
  subtitle:{ color:'#666', marginTop:2 },

  searchWrap:{
    marginTop:10, marginHorizontal:16,
    flexDirection:'row', alignItems:'center',
    backgroundColor:'#F7F7F7', borderRadius:12, paddingHorizontal:10, paddingVertical:10,
    borderWidth:1, borderColor:'#ECECEC'
  },
  searchInput:{ marginLeft:8, flex:1, color:'#111' },

  row:{
    flexDirection:'row', alignItems:'center',
    backgroundColor:'#F7F7F7', borderRadius:16, padding:12,
    borderWidth:1, borderColor:'#ECECEC'
  },
  avatar:{ width:40, height:40, borderRadius:20, marginRight:12 },
  rowTitle:{ fontWeight:'800', color:'#111' },

  pill:{ alignSelf:'flex-start', paddingVertical:4, paddingHorizontal:10, borderRadius:12, fontWeight:'800', color:'#fff', fontSize:12 },
  pillMem:{ backgroundColor:'#2E7D32' },
  pillMod:{ backgroundColor:'#6A1B9A' },
});
