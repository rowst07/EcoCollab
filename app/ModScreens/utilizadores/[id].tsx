import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function UtilizadorDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const user = useMemo(() => ({
    id, nome: 'João Monteiro', role: 'Membro' as 'Membro' | 'Moderador',
    avatar: `https://i.pravatar.cc/200?u=${id}`, retomas: 38, pontos: 1240, email: 'joao.monteiro@exemplo.pt',
  }), [id]);

  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<'Membro' | 'Moderador'>(user.role);
  const [edit, setEdit] = useState(false);

  const guardar = () => { Alert.alert('Guardado', `Nome: ${nome}\nEmail: ${email}\nRole: ${role}`); setEdit(false); };
  const eliminar = () => {
    Alert.alert('Eliminar utilizador?', 'Esta ação é permanente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { Alert.alert('Eliminado'); router.back(); } },
    ]);
  };

  const RolePill = ({ v }: { v: 'Membro'|'Moderador' }) =>
    <Text style={[styles.pill, v==='Moderador'?styles.pillMod:styles.pillMem]}>{v}</Text>;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilizador #{id}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:24 }}>
        <View style={styles.card}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={{ marginLeft: 12, flex:1 }}>
            {edit ? (
              <>
                <TextInput value={nome} onChangeText={setNome} style={styles.input} placeholder="Nome" placeholderTextColor="#888" />
                <TextInput value={email} onChangeText={setEmail} style={[styles.input,{ marginTop:8 }]} placeholder="Email" placeholderTextColor="#888" keyboardType="email-address" />
              </>
            ) : (
              <>
                <Text style={{ fontSize:18, fontWeight:'800', color:'#111' }}>{nome}</Text>
                <Text style={{ color:'#555', marginTop:2 }}>{email}</Text>
              </>
            )}
            <View style={{ marginTop:8 }}><RolePill v={role} /></View>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNum}>{user.retomas}</Text><Text>Retomas</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{user.pontos}</Text><Text>Pontos</Text></View>
        </View>

        <View style={styles.roleRow}>
          <Text style={{ fontWeight:'800', color:'#111' }}>Permissões</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <TouchableOpacity style={[styles.roleBtn, role==='Membro' && styles.roleBtnActive]} onPress={() => setRole('Membro')}>
              <Text style={[styles.roleText, role==='Membro' && styles.roleTextActive]}>Membro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleBtn, role==='Moderador' && styles.roleBtnActive]} onPress={() => setRole('Moderador')}>
              <Text style={[styles.roleText, role==='Moderador' && styles.roleTextActive]}>Moderador</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection:'row', gap:10, marginTop:14 }}>
          {!edit ? (
            <>
              <TouchableOpacity style={[styles.btn, styles.edit]} onPress={() => setEdit(true)}><Text style={styles.btnText}>Editar Perfil</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.delete]} onPress={eliminar}><Text style={styles.btnText}>Eliminar</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => { setEdit(false); setNome(user.nome); setEmail(user.email); setRole(user.role); }}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.save]} onPress={guardar}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:12, paddingTop:10, paddingBottom:6 },
  back:{ width:36, height:36, borderRadius:10, backgroundColor:'#F1F1F1', alignItems:'center', justifyContent:'center' },
  headerTitle:{ fontSize:18, fontWeight:'800', color:'#111' },
  card:{ flexDirection:'row', alignItems:'center', backgroundColor:'#F7F7F7', borderRadius:16, padding:12, borderWidth:1, borderColor:'#ECECEC' },
  avatar:{ width:80, height:80, borderRadius:40 },
  input:{ backgroundColor:'#fff', borderRadius:10, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:'#E6E6E6', color:'#111' },
  stats:{ flexDirection:'row', gap:10, marginTop:12 },
  stat:{ flex:1, backgroundColor:'#EEE', borderRadius:12, alignItems:'center', paddingVertical:14 },
  statNum:{ fontSize:18, fontWeight:'800', color:'#111' },
  roleRow:{ marginTop:16, backgroundColor:'#F7F7F7', borderRadius:12, padding:12, borderWidth:1, borderColor:'#ECECEC', flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  roleBtn:{ backgroundColor:'#E8F1EA', paddingVertical:8, paddingHorizontal:12, borderRadius:16 },
  roleBtnActive:{ backgroundColor:'#2E7D32' },
  roleText:{ color:'#2E7D32', fontWeight:'800' },
  roleTextActive:{ color:'#fff' },
  pill:{ alignSelf:'flex-start', paddingVertical:4, paddingHorizontal:10, borderRadius:12, fontWeight:'800', color:'#fff', fontSize:12 },
  pillMem:{ backgroundColor:'#2E7D32' }, pillMod:{ backgroundColor:'#6A1B9A' },
  btn:{ flex:1, alignItems:'center', justifyContent:'center', borderRadius:12, paddingVertical:12 },
  edit:{ backgroundColor:'#FFA000' }, delete:{ backgroundColor:'#D32F2F' },
  cancel:{ backgroundColor:'#9E9E9E' }, save:{ backgroundColor:'#2E7D32' },
  btnText:{ color:'#fff', fontWeight:'800' },
});
