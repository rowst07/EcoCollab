import MapView, {
  Callout,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapViewRef, // 👈 importa o tipo do wrapper
} from '@/components/MapView';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  LayoutChangeEvent,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BRAND, THEME } from '@/constants/Colors';
import { MAP_STYLE_DARK } from '@/constants/Map';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRoutePlanner } from '@/services/RoutePlannerContext';

import { StopPickerModal } from '@/components/modals/StopPickerModal';
import { RouteKPIs } from '@/components/routes/RouteKPIs';
import { StopList } from '@/components/routes/StopList';
import { TransportToggle } from '@/components/routes/TransportToggle';
import { subscribePontosRecolha, type PontoMarker } from '@/services/FirestoreService';

const { height: SCREEN_H } = Dimensions.get('window');

// ---------- helpers: fit robusto, anti-outlier e traço dinâmico ----------

/** Constrói pontos para o fit: origem+paragens+destino+polyline (decimada). */
function buildFitPoints(args: {
  origin?: { lat:number; lng:number };
  destination?: { lat:number; lng:number };
  stops: { lat:number; lng:number }[];
  coords?: { latitude:number; longitude:number }[];
}) {
  const base: { latitude:number; longitude:number }[] = [];
  if (args.origin) base.push({ latitude: args.origin.lat, longitude: args.origin.lng });
  if (args.destination) base.push({ latitude: args.destination.lat, longitude: args.destination.lng });
  args.stops.forEach(s => base.push({ latitude: s.lat, longitude: s.lng }));

  // inclui polyline decimada (máx 200 pts)
  if (args.coords?.length) {
    const filtered = args.coords.filter(c => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
    const maxPts = 200;
    const step = Math.max(1, Math.ceil(filtered.length / maxPts));
    for (let i = 0; i < filtered.length; i += step) base.push(filtered[i]);
    if (filtered.length) base.push(filtered[filtered.length - 1]);
  }

  // remover duplicados básicos
  const seen = new Set<string>();
  return base.filter(p => {
    const k = `${p.latitude.toFixed(6)}|${p.longitude.toFixed(6)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const EARTH_R = 6371; // km
function kmDistance(a:{latitude:number;longitude:number}, b:{latitude:number;longitude:number}) {
  const toRad = (d:number)=> (d*Math.PI)/180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const la1 = toRad(a.latitude), la2 = toRad(b.latitude);
  const s = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2*EARTH_R*Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Remove outliers (0,0; inválidos; e pontos a >120km do centro do cluster). */
function sanitizePoints(pts: {latitude:number;longitude:number}[]) {
  const valid = pts.filter(p =>
    Number.isFinite(p.latitude) && Number.isFinite(p.longitude) &&
    Math.abs(p.latitude) <= 85 && Math.abs(p.longitude) <= 180 &&
    !(p.latitude === 0 && p.longitude === 0)
  );
  if (valid.length <= 2) return valid;

  const cx = valid.reduce((s,p)=>s+p.latitude,0)/valid.length;
  const cy = valid.reduce((s,p)=>s+p.longitude,0)/valid.length;
  const center = { latitude: cx, longitude: cy };

  const THRESH_KM = 120; // urbano/regional — evita "mapamundo"
  return valid.filter(p => kmDistance(center, p) <= THRESH_KM);
}

/** Região com limites de zoom rígidos e compensação pela aba inferior. */
const MIN_DELTA = 0.035; // “piso” maior para veres o destino sempre
const MAX_DELTA = 0.18;  // evita afastar excessivamente
function regionForPoints(
  pts: { latitude:number; longitude:number }[],
  extraBottomPx = 0,
  screenH = SCREEN_H
) {
  let minLat = pts[0].latitude, maxLat = pts[0].latitude;
  let minLng = pts[0].longitude, maxLng = pts[0].longitude;
  for (const p of pts) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }
  const margin = 1.08; // um pouco mais de margem
  const vPadFactor = 1 + Math.min(0.35, extraBottomPx / screenH); // até +35% em baixo
  const latDelta = Math.min(Math.max((maxLat - minLat) * margin * vPadFactor, MIN_DELTA), MAX_DELTA);
  const lngDelta = Math.min(Math.max((maxLng - minLng) * margin, MIN_DELTA), MAX_DELTA);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/** Larguras “Google-like” mais finas e dinâmicas pelo zoom. */
function widthForDelta(latDelta: number | undefined) {
  if (!latDelta || !Number.isFinite(latDelta)) return { inner: 6, mid: 8, outer: 10 };
  const scale = Math.max(0.7, Math.min(1.4, 0.5 / latDelta)); // clamp inverso ao zoom
  const inner = Math.round(4 * scale); // verde
  const mid   = Math.round(inner + 2); // aro claro
  const outer = Math.round(mid + 2);   // contorno
  return {
    inner: Math.min(Math.max(inner, 3), 9),
    mid:   Math.min(Math.max(mid,   5), 12),
    outer: Math.min(Math.max(outer, 7), 15),
  };
}

/** Pin grande e elegante (gota) */
const BigPin: React.FC<{ color?: string }> = ({ color = '#EAB308' }) => (
  <View style={{ alignItems: 'center' }}>
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: color,
        borderWidth: 3,
        borderColor: '#fff',
        transform: [{ rotate: '45deg' }],
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 7,
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        top: 9,
        left: 9,
        opacity: 0.85,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

const MarkerBubble = ({ label, bg = '#000' }: { label: string; bg?: string }) => (
  <View
    style={{
      backgroundColor: bg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#0008',
    }}
  >
    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{label}</Text>
  </View>
);

// ------------------- componente -------------------

export default function PlaneadorRota() {
  const router = useRouter();
  const { state, setMode, setOriginToCurrent, addStop, removeStop } = useRoutePlanner();

  const bg = useThemeColor('bg');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const card = useThemeColor('card');

  const mapRef = useRef<MapViewRef>(null); // 👈 ref tipado pelo wrapper
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bottomH, setBottomH] = useState(0);
  const [currentLatDelta, setCurrentLatDelta] = useState<number | undefined>(undefined);

  // ✅ memoriza último destino válido para não “piscar/desaparecer” durante updates
  const destRef = useRef<{ id: string; lat: number; lng: number; nome?: string } | null>(null);
  useEffect(() => {
    if (state.destination) destRef.current = state.destination;
  }, [state.destination]);

  // todos os ecopontos aprovados
  const [pontos, setPontos] = useState<PontoMarker[]>([]);
  useEffect(() => {
    const unsub = subscribePontosRecolha({
      statusEq: 'aprovado',
      onData: (list) => {
        setPontos(
          list.filter(
            (p) =>
              typeof p.latitude === 'number' &&
              isFinite(p.latitude) &&
              typeof p.longitude === 'number' &&
              isFinite(p.longitude)
          )
        );
      },
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setOriginToCurrent().catch(() =>
      Alert.alert('Localização', 'Ativa a localização para iniciar a rota.')
    );
  }, []);

  /** Ajusta a vista – usa polyline + pontos do percurso com limites rígidos e outlier-filter. */
  const fitRoute = () => {
    const raw = buildFitPoints({
      origin: state.origin,
      destination: state.destination || destRef.current || undefined,
      stops: state.stops,
      coords: state.coords,
    });
    const pts = sanitizePoints(raw);
    if (!mapRef.current || pts.length === 0) return;

    if (pts.length === 1) {
      mapRef.current.animateToRegion(
        { ...pts[0], latitudeDelta: 0.06, longitudeDelta: 0.06 },
        450
      );
      return;
    }

    // região controlada (north-up; sem tilt/rotate)
    const region = regionForPoints(pts, bottomH);
    mapRef.current.animateToRegion(region, 500);
  };

  // recentra quando muda e mantém zoom “direito”
  useEffect(() => {
    fitRoute();
  }, [state.origin, state.destination, state.stops, state.coords, bottomH]);

  // capturar latDelta actual para escalar a largura do traço
  const onRegionChangeComplete = (region: any) => {
    if (region?.latitudeDelta && isFinite(region.latitudeDelta)) {
      setCurrentLatDelta(region.latitudeDelta);
    }
  };

  // lista de paragens: usa ordem otimizada **apenas se válida**
  const orderedStops = useMemo(() => {
    const order = state.waypointOrder;
    const N = state.stops.length;
    const valid =
      Array.isArray(order) &&
      order.length === N &&
      order.every((i) => Number.isInteger(i) && i >= 0 && i < N);
    return valid ? order.map((i) => state.stops[i]) : state.stops;
  }, [state.stops, state.waypointOrder]);

  const hasRouteReady = !!state.coords?.length;

  const handlePickStop = (p: { id: string; nome?: string; lat: number; lng: number }) => {
    // evita duplicados por id
    if (state.destination?.id === p.id || state.stops.some((s) => s.id === p.id)) {
      Alert.alert('Já adicionado', 'Esse ecoponto já faz parte da rota.');
      return;
    }
    addStop({ id: p.id, nome: p.nome, lat: p.lat, lng: p.lng }); // contexto recalcúla auto
  };

  const onBottomLayout = (e: LayoutChangeEvent) =>
    setBottomH(Math.ceil(e.nativeEvent.layout.height));

  // --- esconder pins neutros que já estão no trajeto (por id OU por proximidade a origem/paragens/dest) ---
  const isStopId = (id: string) => state.stops.some((s) => s.id === id);
  const isDestId = (id?: string) => !!(state.destination?.id === id || destRef.current?.id === id);
  const isNearAnyTripPoint = (lat:number, lng:number) => {
    const here = { latitude: lat, longitude: lng };
    // 100 m em km = 0.1
    const NEAR_KM = 0.1;
    if (state.origin && kmDistance(here, { latitude: state.origin.lat, longitude: state.origin.lng }) <= NEAR_KM) return true;
    if (state.destination && kmDistance(here, { latitude: state.destination.lat, longitude: state.destination.lng }) <= NEAR_KM) return true;
    if (!state.destination && destRef.current && kmDistance(here, { latitude: destRef.current.lat, longitude: destRef.current.lng }) <= NEAR_KM) return true;
    for (const s of state.stops) {
      if (kmDistance(here, { latitude: s.lat, longitude: s.lng }) <= NEAR_KM) return true;
    }
    return false;
  };

  /** Enviar rota para Google/Apple Maps */
  const sendToExternalMaps = async () => {
    const destToUse = state.destination || destRef.current;
    if (!state.origin || !destToUse) {
      Alert.alert('Rota incompleta', 'Define origem e destino.');
      return;
    }
    const waypoints = orderedStops;
    const mode = state.mode === 'walking' ? 'walking' : 'driving';

    const org = `${state.origin.lat},${state.origin.lng}`;
    const dst = `${destToUse.lat},${destToUse.lng}`;
    const wps = waypoints.map((w) => `${w.lat},${w.lng}`);

    const gBase = 'https://www.google.com/maps/dir/?api=1';
    const gParams = [
      `origin=${encodeURIComponent(org)}`,
      `destination=${encodeURIComponent(dst)}`,
      wps.length ? `waypoints=${encodeURIComponent(wps.join('|'))}` : '',
      `travelmode=${mode}`,
      'dir_action=navigate',
    ]
      .filter(Boolean)
      .join('&');
    const googleUrl = `${gBase}&${gParams}`;

    const appleBase = 'http://maps.apple.com/';
    const appleDaddr = [dst, ...wps.map((s) => `to:${s}`)].join('%20');
    const dirflg = mode === 'walking' ? 'w' : 'd';
    const appleUrl = `${appleBase}?saddr=${encodeURIComponent(org)}&daddr=${appleDaddr}&dirflg=${dirflg}`;

    if (Platform.OS === 'ios') {
      const canApple = await Linking.canOpenURL('maps://');
      if (canApple) return Linking.openURL(appleUrl.replace('http://', 'maps://'));
      const canGApp = await Linking.canOpenURL('comgooglemaps://');
      if (canGApp)
        return Linking.openURL(
          googleUrl.replace('https://www.google.com/maps', 'comgooglemaps://')
        );
      return Linking.openURL(googleUrl);
    } else {
      return Linking.openURL(googleUrl);
    }
  };

  // larguras do traço (dinâmicas via zoom)
  const W = widthForDelta(currentLatDelta);

  // destino a exibir (state ou último válido)
  const destToShow = state.destination || destRef.current;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planeador de Rota</Text>
      </View>

      {/* Controlo superior */}
      <View style={[styles.controls, { borderColor: border, backgroundColor: THEME.dark.bg }]}>
        <TransportToggle value={state.mode} onChange={(m) => setMode(m)} />
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: BRAND.primary }]}
            onPress={() => setPickerOpen(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Adicionar paragem</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: BRAND.primary }]}
            onPress={fitRoute}
          >
            <Ionicons name="contract-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Ajustar mapa</Text>
          </TouchableOpacity>
        </View>

        <RouteKPIs
          distance={state.totalDistanceText}
          duration={state.totalDurationText}
          mutedColor={muted}
          textColor={text}
        />
      </View>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE_DARK}
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        onRegionChangeComplete={onRegionChangeComplete}
        initialRegion={{
          latitude: state.origin?.lat ?? 38.72,
          longitude: state.origin?.lng ?? -9.13,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Origem (tracksViewChanges ligado p/ render dinâmico estável) */}
        {state.origin && (
          <Marker
            coordinate={{ latitude: state.origin.lat, longitude: state.origin.lng }}
            title="Origem"
            tracksViewChanges
            anchor={{ x: 0.5, y: 1 }}
          >
            <MarkerBubble label="Origem" bg="#2563eb" />
          </Marker>
        )}

        {/* Ecopontos (grandes), exceto os que já estão no trajeto (por id OU proximidade) */}
        {pontos.map((p) => {
          const skipById = isStopId(p.id) || isDestId(p.id);
          const skipByNear = isNearAnyTripPoint(p.latitude, p.longitude);
          if (skipById || skipByNear) return null;
          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <BigPin />
              <Callout
                onPress={() =>
                  handlePickStop({ id: p.id, nome: p.nome, lat: p.latitude, lng: p.longitude })
                }
              >
                <View style={{ minWidth: 200 }}>
                  <Text style={{ fontWeight: '800' }}>{p.nome}</Text>
                  {p.morada ? (
                    <Text numberOfLines={1} style={{ opacity: 0.8 }}>
                      {p.morada}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      marginTop: 8,
                      backgroundColor: BRAND.primary,
                      paddingVertical: 8,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Adicionar paragem</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {/* Paragens (número atualiza porque tracksViewChanges está ativo) */}
        {orderedStops.map((s, idx) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={s.nome || `Paragem ${idx + 1}`}
            tracksViewChanges
          >
            <MarkerBubble label={`${idx + 1}`} bg="#f59e0b" />
          </Marker>
        ))}

        {/* Destino — mostra SEMPRE (usa fallback do destRef se necessário) */}
        {destToShow && (
          <Marker
            coordinate={{ latitude: destToShow.lat, longitude: destToShow.lng }}
            title={destToShow.nome || 'Destino'}
            tracksViewChanges
          >
            <MarkerBubble label="Dest" bg="#16a34a" />
          </Marker>
        )}

        {/* Rota — 3 camadas com largura dinâmica (mais fina) */}
        {hasRouteReady && (
          <>
            <Polyline
              coordinates={state.coords!}
              strokeWidth={W.outer}
              strokeColor="rgba(0,0,0,0.95)"
              geodesic
              zIndex={1}
            />
            <Polyline
              coordinates={state.coords!}
              strokeWidth={W.mid}
              strokeColor="rgba(255,255,255,0.85)"
              geodesic
              zIndex={2}
            />
            <Polyline
              coordinates={state.coords!}
              strokeWidth={W.inner}
              strokeColor={BRAND.primary}
              geodesic
              zIndex={3}
            />
          </>
        )}
      </MapView>

      {/* Aba inferior */}
      <View
        onLayout={onBottomLayout}
        style={[styles.bottomPanel, { backgroundColor: card, borderColor: border }]}
      >
        <StopList
          origin={state.origin}
          stops={orderedStops}
          destination={destToShow || null}
          onRemoveStop={(id) => removeStop(id)}
        />

        {/* Enviar para o mapa */}
        <TouchableOpacity
          style={[
            styles.finishBtn,
            { backgroundColor: BRAND.primary, opacity: destToShow ? 1 : 0.5 },
          ]}
          onPress={sendToExternalMaps}
          disabled={!destToShow}
        >
          <Ionicons name="map-outline" size={20} color="#fff" />
          <Text style={styles.finishText}>Enviar para o mapa</Text>
        </TouchableOpacity>
      </View>

      <StopPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(p) => handlePickStop(p)}
      />
    </View>
  );
}

// ---------- estilos ----------

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
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', alignItems: 'center', flex: 1, textAlign: 'center', marginRight: 26 },
  controls: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
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
  bottomPanel: { borderTopWidth: 1, padding: 12, gap: 8 },
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
