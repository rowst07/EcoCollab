// components/route/StopList.tsx
import { BRAND } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type W = { id: string; nome?: string; lat: number; lng: number };

export const StopList = ({
  origin,
  stops,
  destination,
  onRemoveStop,
}: {
  origin?: { lat:number; lng:number } | undefined;
  stops: W[];
  destination: W | null;
  onRemoveStop?: (id: string) => void;
}) => {
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.row]}>
        <View style={[styles.dot, { backgroundColor: '#2563eb' }]} />
        <Text style={styles.title}>Origem</Text>
      </View>

      {stops.map((s, i) => (
        <View key={s.id} style={styles.item}>
          <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}><Text style={styles.badgeTxt}>{i+1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{s.nome || 'Paragem'}</Text>
            <Text style={styles.itemSub}>Paragem intermédia otimizada</Text>
          </View>
          {onRemoveStop && (
            <TouchableOpacity onPress={() => onRemoveStop(s.id)} style={styles.trash}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {destination ? (
        <View style={styles.item}>
          <View style={[styles.badge, { backgroundColor: '#16a34a' }]}><Text style={styles.badgeTxt}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{destination.nome || 'Destino'}</Text>
            <Text style={styles.itemSub}>Destino final do trajeto</Text>
          </View>
        </View>
      ) : (
        <Text style={{ opacity: 0.7 }}>Define um destino através do ecrã do ecoponto (botão “Ir para o local”).</Text>
      )}

      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={16} color="#fff" />
        <Text style={styles.hintTxt}>
          Dica: usa “Adicionar paragem” para incluir ecopontos; podes remover aqui na lista.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', gap:8 },
  dot: { width:12, height:12, borderRadius:6 },
  title: { fontWeight:'800' },

  item: {
    flexDirection:'row',
    alignItems:'center',
    gap:10,
    paddingVertical:8,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    alignItems:'center', justifyContent:'center',
  },
  badgeTxt: { color:'#fff', fontWeight:'900', fontSize:12 },
  itemTitle: { fontWeight:'800' },
  itemSub: { fontSize:12, opacity:0.7 },

  hint: {
    marginTop: 6,
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    backgroundColor: BRAND.primary,
    borderRadius:10,
    paddingHorizontal:10,
    paddingVertical:8,
  },
  hintTxt: { color:'#fff', fontWeight:'700', flex:1, fontSize:12 },

  trash: {
    backgroundColor: '#ef4444',
    paddingHorizontal:10, paddingVertical:8, borderRadius:8
  }
});
