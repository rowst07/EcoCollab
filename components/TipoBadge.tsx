import React from 'react';
import { Text, View } from 'react-native';

const PALETTE: Record<string, string> = {
  vidro: '#1E88E5',
  papel: '#6D4C41',
  plastico: '#FBC02D',
  metal: '#9E9E9E',
  pilhas: '#8E24AA',
  organico: '#43A047',
};

export function TipoBadge({ tipo, label }: { tipo?: string | null; label?: string }) {
  const color = tipo ? (PALETTE[tipo] ?? '#607D8B') : '#607D8B';
  return (
    <View style={{ backgroundColor: color, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
        {label ?? (tipo ? tipo.toUpperCase() : '—')}
      </Text>
    </View>
  );
}

export function ConfidenceBar({ value }: { value?: number | null }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  return (
    <View style={{ height: 8, borderRadius: 6, backgroundColor: '#E0E0E0', overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(v * 100)}%`, height: '100%' }} />
    </View>
  );
}
