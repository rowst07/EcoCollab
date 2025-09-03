// app/UserScreens/planeadorRota.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { BRAND } from '@/constants/Colors';
import { MAP_STYLE_DARK } from '@/constants/Map';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRoutePlanner } from '@/services/RoutePlannerContext';

import { StopPickerModal } from '@/components/modals/StopPickerModal';
import { RouteKPIs } from '@/components/routes/RouteKPIs';
import { StopList } from '@/components/routes/StopList';
import { TransportToggle } from '@/components/routes/TransportToggle';

export default function PlaneadorRota() {
  const router = useRouter();
  const { state, setMode, setOriginToCurrent, computeOptimizedRoute, resetRoute, addStop, removeStop } = useRoutePlanner();

  const bg = useThemeColor('bg');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const card = useThemeColor('card');

  const mapRef = useRef<MapView>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setOriginToCurrent().catch(() => Alert.alert('Localização', 'Ativa a localização para iniciar a rota.'));
  }, []);

  useEffect(() => { fitRoute(); }, [state.coords, state.origin, state.destination, state.stops]);

  const fitRoute = () => {
    const pts = [
      ...(state.origin ? [{ latitude: state.origin.lat, longitude: state.origin.lng }] : []),
      ...(state.destination ? [{ latitude: state.destination.lat, longitude: state.destination.lng }] : []),
      ...state.stops.map(s => ({ latitude: s.lat, longitude: s.lng })),
      ...(state.coords || []),
    ];
    if (mapRef.current && pts.length) {
      mapRef.current.fitToCoordinates(pts, { edgePadding: { top: 80, bottom: 260, left: 60, right: 60 }, animated: true });
    }
  };

  const orderedStops = useMemo(() => {
    if (!state.waypointOrder?.length) return state.stops;
    return state.waypointOrder.map(i => state.stops[i]).filter(Boolean);
  }, [state.stops, state.waypointOrder]);

  const hasRouteReady = !!state.coords?.length;

  const handlePickStop = (p: { id: string; nome?: string; lat: number; lng: number }) => {
    if (state.destination?.id === p.id || state.stops.some(s => s.id === p.id)) {
      Alert.alert('Já adicionado', 'Esse ecoponto já faz parte da rota.');
      return;
    }
    addStop({ id: p.id, nome: p.nome, lat: p.lat, lng: p.lng });
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planeador de Rota</Text>
        <TouchableOpacity onPress={resetRoute}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Controlo superior */}
      <View style={[styles.controls, { borderColor: border, backgroundColor: card }]}>
        <TransportToggle value={state.mode} onChange={(m) => setMode(m)} />

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: BRAND.primary }]}
            onPress={() => computeOptimizedRoute().catch(e => Alert.alert('Erro', String(e)))}
            disabled={!state.destination}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.ctaText}>Otimizar e traçar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: BRAND.primary }]}
            onPress={fitRoute}
          >
            <Ionicons name="move-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Ajustar mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: BRAND.primary }]}
            onPress={() => setPickerOpen(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Adicionar paragem</Text>
          </TouchableOpacity>
        </View>

        <RouteKPIs
          distance={state.totalDistanceText}
          duration={state.totalDurationText}
          mutedColor={muted}
          textColor={text}
        />
      </View>

      {/* MAPA (escuro com o teu estilo) */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE_DARK}
        initialRegion={{
          latitude: state.origin?.lat ?? 38.72,
          longitude: state.origin?.lng ?? -9.13,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {state.origin && (
          <Marker coordinate={{ latitude: state.origin.lat, longitude: state.origin.lng }} title="Origem">
            <MarkerBubble label="Origem" bg="#2563eb" />
          </Marker>
        )}

        {orderedStops.map((s, idx) => (
          <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} title={s.nome || `Paragem ${idx + 1}`}>
            <MarkerBubble label={`${idx + 1}`} bg="#f59e0b" />
          </Marker>
        ))}

        {state.destination && (
          <Marker coordinate={{ latitude: state.destination.lat, longitude: state.destination.lng }} title={state.destination.nome || 'Destino'}>
            <MarkerBubble label="Dest" bg="#16a34a" />
          </Marker>
        )}

        {hasRouteReady && <Polyline coordinates={state.coords!} width={6} />}
      </MapView>

      {/* Aba inferior: lista com botão de apagar + concluir */}
      <View style={[styles.bottomPanel, { backgroundColor: card, borderColor: border }]}>
        <StopList
          origin={state.origin}
          stops={orderedStops}
          destination={state.destination || null}
          onRemoveStop={(id) => removeStop(id)}
        />

        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: BRAND.primary, opacity: state.destination ? 1 : 0.5 }]}
          onPress={() => router.push('/SharedScreens/avaliarRota')}
          disabled={!state.destination}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.finishText}>Concluir rota</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: escolher paragem dos pontos Firestore */}
      <StopPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickStop}
      />
    </View>
  );
}

const MarkerBubble = ({ label, bg = '#000' }: { label: string; bg?: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#0008' }}>
    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#111',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  controls: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaText: { color: '#fff', fontWeight: '800' },
  map: { flex: 1 },
  bottomPanel: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  finishBtn: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  finishText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
