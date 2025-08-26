import {
  deletePontoRecolha,
  subscribePontoRecolhaById,
  updatePontoRecolha
} from '@/services/FirestoreService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GeoPoint } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ALL_TIPOS = ['vidro','papel','plastico','metal','pilhas','organico','outros'] as const;
type Tipo = typeof ALL_TIPOS[number];

export default function EditarPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    const unsub = subscribePontoRecolhaById(id, (p) => {
      if (!p) {
        setLoading(false);
        return;
      }
      setNome(p.nome || '');
      setMorada(p.morada || '');
      setTipos((p.tipos || []) as Tipo[]);
      setLat(String(p.latitude ?? ''));
      setLng(String(p.longitude ?? ''));
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const toggleTipo = (t: Tipo) => {
    setTipos(prev => prev.includes(t) ? prev.filter(x => x!==t) : [...prev, t]);
  };

  const onGuardar = async () => {
    try {
      if (!id) return;
      if (!nome.trim()) return Alert.alert('Nome obrigatório');

      const latN = Number(lat), lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
        return Alert.alert('Coordenadas inválidas', 'Introduz latitude/longitude válidas.');
      }

      await updatePontoRecolha(id, {
        nome: nome.trim(),
        endereco: morada.trim() || undefined,
        residuos: tipos as string[],
        localizacao: new GeoPoint(latN, lngN),
      });

      Alert.alert('Guardado', `Ponto #${id} atualizado.`);
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao guardar', String(e?.message || e));
    }
  };

  const onEliminar = () => {
    if (!id) return;
    Alert.alert(
      'Eliminar ponto?',
      'Esta ação é permanente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePontoRecolha(id);
              Alert.alert('Eliminado', `Ponto #${id} eliminado.`);
              router.replace('/ModScreens/pontos');
            } catch (e: any) {
              Alert.alert('Erro ao eliminar', String(e?.message || e));
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:'#fff', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop:8 }}>A carregar…</Text>
      </SafeAreaView>
    );
  }

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
