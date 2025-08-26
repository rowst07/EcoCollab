import { useAuth } from '@/services/AuthContext';
import { addPontoRecolha, type PontoRecolhaCreate } from '@/services/FirestoreService';
import { useRouter } from 'expo-router';
import { GeoPoint } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ALL_TIPOS = ['vidro','papel','plastico','metal','pilhas','organico','outros'] as const;
type Tipo = typeof ALL_TIPOS[number];

export default function NovoPonto() {
  const router = useRouter();
  const { user } = useAuth();

  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [lat, setLat] = useState(''); const [lng, setLng] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (t: Tipo) => setTipos(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  const onCriar = async () => {
    try {
      if (!nome.trim()) return Alert.alert('Nome obrigatório');
      const latN = Number(lat), lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
        return Alert.alert('Coordenadas inválidas', 'Introduz latitude/longitude válidas.');
      }
      if (!tipos.length) return Alert.alert('Seleciona pelo menos um tipo de resíduo');

      if (!user?.uid) return Alert.alert('Sessão inválida', 'Volta a iniciar sessão.');

      setSaving(true);

      const payload: PontoRecolhaCreate = {
        nome: nome.trim(),
        descricao: '',
        endereco: morada.trim() || undefined,
        residuos: tipos as string[],
        localizacao: new GeoPoint(latN, lngN),
        fotoUrl: null,
        criadoPor: user.uid,
        criadoPorDisplay: user.displayName || user.email || 'Utilizador',
        status: 'pendente',
      };

      const id = await addPontoRecolha(payload);

      Alert.alert('Criado', `Ponto "${nome}" criado.`);
      router.replace(`/ModScreens/pontos/editar/${id}`);
    } catch (e: any) {
      Alert.alert('Erro a criar ponto', String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:24 }}>
        <Text style={styles.title}>Novo Ponto</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ecoponto Centro" placeholderTextColor="#888" />

        <Text style={styles.label}>Tipos de resíduo</Text>
        <View style={styles.chipsRow}>
          {ALL_TIPOS.map(t => (
            <TouchableOpacity key={t} style={[styles.chip, tipos.includes(t) && styles.chipActive]} onPress={() => toggle(t)}>
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
          <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => router.back()} disabled={saving}>
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.save]} onPress={onCriar} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'A criar…' : 'Criar'}</Text>
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
  cancel:{ backgroundColor:'#9E9E9E' },
  save:{ backgroundColor:'#2E7D32' },
  btnText:{ color:'#fff', fontWeight:'800' },
});
