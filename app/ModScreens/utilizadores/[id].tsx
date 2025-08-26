import { subscribeUserById, subscribeUserStats, type UserExtras, type UserMinimalDoc } from '@/services/FirestoreService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Full = UserMinimalDoc & UserExtras;

export default function UtilizadorDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<Full | null>(null);
  const [loading, setLoading] = useState(true);
  const [retomas, setRetomas] = useState<number>(0);       // reportes
  const [pontos, setPontos] = useState<number>(0);         // pontosCriados

  useEffect(() => {
    if (!id) return;

    const unsubUser = subscribeUserById(id, (u) => {
      setUser(u as Full | null);
      setLoading(false);
    });

    const unsubStats = subscribeUserStats(id, (s) => {
      setPontos(s.pontosCriados);
      setRetomas(s.reportes);
    });

    return () => {
      unsubUser?.();
      unsubStats?.();
    };
  }, [id]);

  const avatarUri = useMemo(
    () => user?.fotoURL || `https://i.pravatar.cc/200?u=${id}`,
    [user?.fotoURL, id]
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Utilizador</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop:8 }}>A carregar perfil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#2E7D32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Utilizador</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
          <Text>Utilizador não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleLabel =
    user.role === 'admin' ? 'Admin' :
    user.role === 'moderator' ? 'Moderador' : 'Membro';

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilizador #{user.id}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:24 }}>
        <View style={styles.card}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={{ marginLeft: 12, flex:1 }}>
            <Text style={{ fontSize:18, fontWeight:'800', color:'#111' }}>{user.nome || '(Sem nome)'}</Text>
            <Text style={{ color:'#555', marginTop:2 }}>{user.email || '-'}</Text>
            <View style={{ marginTop:8 }}>
              <Text style={[styles.pill, roleLabel==='Moderador' ? styles.pillMod : styles.pillMem]}>
                {roleLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{retomas}</Text>
            <Text>Retomas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pontos}</Text>
            <Text>Pontos</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Field label="Morada" value={user.morada} />
          <Field label="Telemóvel" value={user.telemovel} />
          <Field label="Data de nascimento" value={user.dataNasc} />
          <Field label="Criado em" value={fmtTS(user.dataCriacao)} />
          <Field label="Atualizado em" value={fmtTS(user.dataAtualizacao)} />
        </View>

        {/* Só leitura: sem botões de editar / eliminar */}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={{ marginBottom:10 }}>
      <Text style={{ fontSize:12, color:'#777', marginBottom:3 }}>{label}</Text>
      <View style={{ backgroundColor:'#F7F7F7', borderRadius:12, padding:12, borderWidth:1, borderColor:'#ECECEC' }}>
        <Text style={{ color:'#111' }}>{value || '-'}</Text>
      </View>
    </View>
  );
}

function fmtTS(v: any): string | undefined {
  try {
    if (!v) return undefined;
    if (typeof v?.toDate === 'function') {
      const d: Date = v.toDate();
      return d.toLocaleString();
    }
    if (v instanceof Date) return v.toLocaleString();
    return String(v);
  } catch {
    return undefined;
  }
}

const styles = StyleSheet.create({
  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:12, paddingTop:10, paddingBottom:6 },
  back:{ width:36, height:36, borderRadius:10, backgroundColor:'#F1F1F1', alignItems:'center', justifyContent:'center' },
  headerTitle:{ fontSize:18, fontWeight:'800', color:'#111' },

  card:{ flexDirection:'row', alignItems:'center', backgroundColor:'#F7F7F7', borderRadius:16, padding:12, borderWidth:1, borderColor:'#ECECEC' },
  avatar:{ width:80, height:80, borderRadius:40 },

  stats:{ flexDirection:'row', gap:10, marginTop:12 },
  stat:{ flex:1, backgroundColor:'#EEE', borderRadius:12, alignItems:'center', paddingVertical:14, borderWidth:1, borderColor:'#E5E5E5' },
  statNum:{ fontSize:18, fontWeight:'800', color:'#111' },

  infoCard:{ marginTop:16, backgroundColor:'#F7F7F7', borderRadius:12, padding:12, borderWidth:1, borderColor:'#ECECEC' },

  pill:{ alignSelf:'flex-start', paddingVertical:4, paddingHorizontal:10, borderRadius:12, fontWeight:'800', color:'#fff', fontSize:12 },
  pillMem:{ backgroundColor:'#2E7D32' },
  pillMod:{ backgroundColor:'#6A1B9A' },
});
