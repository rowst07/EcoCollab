// components/route/TransportToggle.tsx
import { BRAND } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  value: 'walking' | 'driving';
  onChange: (m: 'walking' | 'driving') => void;
};

export const TransportToggle: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.item, value === 'walking' && styles.itemActive]}
        onPress={() => onChange('walking')}
      >
        <Ionicons name="walk-outline" size={18} color={value==='walking' ? '#fff' : '#111'} />
        <Text style={[styles.text, value === 'walking' && styles.textActive]}>A pé</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.item, value === 'driving' && styles.itemActive]}
        onPress={() => onChange('driving')}
      >
        <Ionicons name="car-outline" size={18} color={value==='driving' ? '#fff' : '#111'} />
        <Text style={[styles.text, value === 'driving' && styles.textActive]}>Carro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#111',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  text: { fontWeight: '800', color: '#111' },
  textActive: { color: '#fff' },
});
