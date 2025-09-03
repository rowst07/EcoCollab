// components/route/RouteKPIs.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const RouteKPIs = ({
  distance,
  duration,
  mutedColor,
  textColor,
}: {
  distance?: string;
  duration?: string;
  mutedColor: string;
  textColor: string;
}) => {
  if (!distance && !duration) {
    return <Text style={{ color: mutedColor }}>Define destino e toca em “Otimizar e traçar”.</Text>;
  }
  return (
    <View style={styles.wrap}>
      {distance ? (
        <View style={styles.pill}>
          <Ionicons name="swap-horizontal-outline" size={16} color={textColor} />
          <Text style={[styles.txt, { color: textColor }]}>{distance}</Text>
        </View>
      ) : null}
      {duration ? (
        <View style={styles.pill}>
          <Ionicons name="time-outline" size={16} color={textColor} />
          <Text style={[styles.txt, { color: textColor }]}>{duration}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#222',
  },
  txt: { fontWeight: '800' },
});
