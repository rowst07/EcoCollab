import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ALL_TIPOS = ['vidro','papel','plastico','metal','pilhas','organico','outros'] as const;
type Tipo = typeof ALL_TIPOS[number];

export default function EditarPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ⚠️ MOCK: substituir por fetch ao carregar
  const inicial = useMemo(() => ({
    id,
    nome: 'Ecoponto Centro',
    tipos: ['vidro','papel'] as Tipo[],
    morada: 'Centro, Bragança',
    lat: '41.805',
    lng: '-6.756',
  }), [id]);

  const [nome, setNome] = useState(inicial.nome);
  const [morada, setMorada] = useState(inicial.morada);
  const [tipos, setTipos] = useState<Tipo[]>(inicial.tipos);
  const [lat, setLat] = useState<string>(inicial.lat);
  const [lng, setLng] = useState<string>(inicial.lng);

  const toggleTipo = (t: Tipo) => {
    setTipos(prev => prev.includes(t) ? prev.filter(x => x!==t) : [...prev, t]);
  };

  const onGuardar = () => {
    if (!nome.trim()) return Alert.alert('Nome obrigatório');
    // 👉 integra API para atualizar
    Alert.alert('Guardado', `Ponto #${id} atualizado.`);
    router.back();
  };

  const onEliminar = () => {
    Alert.alert(
      'Eliminar ponto?',
      'Esta ação é permanente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
            // 👉 integra API para eliminar
            Alert.alert('Eliminado', `Ponto #${id} eliminado.`);
            router.replace('/ModScreens/pontos');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:24 }}>
        <Text style={styles.title}>Editar Ponto #{id}</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ecoponto Centro" placeholderTextColor="#888" />

        <Text style={styles.label}>Tipos de resíduo</Text>
        <View style={styles.chipsRow}>
          {ALL_TIPOS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, tipos.includes(t) && styles.chipActive]}
              onPress={() => toggleTipo(t)}
            >
              <Text style={[styles.chipText, tipos.includes(t) && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Morada (opcional)</Text>
        <TextInput style={styles.input} value={morada} onChangeText={setMorada} placeholder="Rua / Local" placeholderTextColor="#888" />

        <View style={{ flexDirection:'row', gap:10 }}>
          <View style={{ flex:1 }}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput style={styles.input} value={lat} onChangeText={setLat} placeholder="41.805" placeholderTextColor="#888" keyboardType="numeric" />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput style={styles.input} value={lng} onChangeText={setLng} placeholder="-6.756" placeholderTextColor="#888" keyboardType="numeric" />
          </View>
        </View>

        <View style={{ flexDirection:'row', gap:10, marginTop:14 }}>
          <TouchableOpacity style={[styles.btn, styles.delete]} onPress={onEliminar}>
            <Text style={styles.btnText}>Eliminar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.save]} onPress={onGuardar}>
            <Text style={styles.btnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title:{ fontSize:22, fontWeight:'800', color:'#111', marginBottom:8 },
  label:{ fontWeight:'800', color:'#111', marginTop:10, marginBottom:6 },
  input:{ backgroundColor:'#F7F7F7', borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:'#ECECEC', color:'#111' },
  chipsRow:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:{ paddingVertical:8, paddingHorizontal:12, borderRadius:16, backgroundColor:'#E8F1EA' },
  chipActive:{ backgroundColor:'#2E7D32' },
  chipText:{ color:'#2E7D32', fontWeight:'800' },
  chipTextActive:{ color:'#fff' },
  btn:{ flex:1, alignItems:'center', justifyContent:'center', borderRadius:12, paddingVertical:12 },
  delete:{ backgroundColor:'#D32F2F' },
  save:{ backgroundColor:'#2E7D32' },
  btnText:{ color:'#fff', fontWeight:'800' },
});
