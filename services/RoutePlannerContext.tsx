// context/RoutePlannerContext.tsx
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type TravelMode = 'walking' | 'driving';
export type Waypoint = { id: string; lat: number; lng: number; nome?: string };

type State = {
  origin?: { lat: number; lng: number };
  destination?: Waypoint;
  stops: Waypoint[];
  mode: TravelMode;
  polyline?: string;
  coords?: { latitude: number; longitude: number }[];
  waypointOrder?: number[];
  totalDistanceText?: string;
  totalDurationText?: string;
};

type Ctx = {
  state: State;
  setMode: (m: TravelMode) => void;
  setDestination: (w: Waypoint) => void;
  addStop: (w: Waypoint) => void;
  removeStop: (id: string) => void;
  resetRoute: () => void;
  setOriginToCurrent: () => Promise<void>;
  computeOptimizedRoute: () => Promise<void>;
  openInGoogleMaps: () => void;
};

const RoutePlannerContext = createContext<Ctx | null>(null);

export const RoutePlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<State>({ stops: [], mode: 'walking' });

  const setMode = (m: TravelMode) => setState(p => ({ ...p, mode: m }));
  const setDestination = (w: Waypoint) => setState(p => ({ ...p, destination: w }));
  const addStop = (w: Waypoint) => setState(p => ({ ...p, stops: [...p.stops, w] }));
  const removeStop = (id: string) => setState(p => ({ ...p, stops: p.stops.filter(s => s.id !== id) }));
  const resetRoute = () => setState({ stops: [], mode: 'walking' });

  const setOriginToCurrent = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Sem permissão de localização.');
    const loc = await Location.getCurrentPositionAsync({});
    setState(p => ({ ...p, origin: { lat: loc.coords.latitude, lng: loc.coords.longitude } }));
  }, []);

 function decodePolyline(encoded: string) {
  let index = 0, lat = 0, lng = 0, coordinates: { latitude:number; longitude:number }[] = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

function formatDurationGoogle(duration: string | undefined) {
  // duration vem como "1234s" (ou "123.4s")
  if (!duration) return '';
  const secs = Math.max(0, Math.round(parseFloat(duration.replace('s',''))));
  const h = Math.floor(secs / 3600), m = Math.round((secs % 3600) / 60);
  if (h >= 1) return `${h} h ${m} min`;
  return `${m} min`;
}

function formatDistanceMeters(m?: number) {
  if (!m && m !== 0) return '';
  if (m >= 1000) return `${(m/1000).toFixed(1)} km`;
  return `${m} m`;
}

async function computeOptimizedRoute() {
  // este.state: { origin, destination, stops, mode, ... }
  if (!state.origin || !state.destination) return;

  const body = {
    origin: {
      location: { latLng: { latitude: state.origin.lat, longitude: state.origin.lng } }
    },
    destination: {
      location: { latLng: { latitude: state.destination.lat, longitude: state.destination.lng } }
    },
    intermediates: state.stops.map(s => ({
      location: { latLng: { latitude: s.lat, longitude: s.lng } }
    })),
    travelMode: state.mode === 'walking' ? 'WALK' : 'DRIVE', // WALK/DRIVE na Routes API v2
    routingPreference: 'TRAFFIC_AWARE',
    optimizeWaypointOrder: true, // reorder das paragens
    polylineEncoding: 'ENCODED_POLYLINE'
  };

  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': 'AIzaSyAEoeJ6NYPDy7uO0jy3ahRSeO26VqavI4o',
      // Pede só o que precisas (obrigatório): polyline + distância + duração + ordem otimizada + pernas (se quiseres detalhes)
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs,routes.optimizedIntermediateWaypointIndex'
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'Routes API error');
  }

  const route = json?.routes?.[0];
  const encoded = route?.polyline?.encodedPolyline as string | undefined;
  const coords = encoded ? decodePolyline(encoded) : [];

  // Ordem otimizada dos "intermediates" (índices zero-based)
  const order: number[] = route?.optimizedIntermediateWaypointIndex || [];

  // Totais
  const distanceM = route?.distanceMeters as number | undefined;
  const durationS = route?.duration as string | undefined;

  // Atualiza o estado usado pelo mapa/abas
  setState((prev) => ({
    ...prev,
    coords,
    waypointOrder: order, // usa esta ordem para renderizar marcadores/StopList
    totalDistanceText: formatDistanceMeters(distanceM),
    totalDurationText: formatDurationGoogle(durationS),
  }));
}

  const openInGoogleMaps = useCallback(() => {
    const { origin, destination, stops, mode } = state;
    if (!origin || !destination) return;
    const o = `${origin.lat},${origin.lng}`;
    const d = `${destination.lat},${destination.lng}`;
    const wp = stops.map(s => `${s.lat},${s.lng}`).join('|');

    const iosUrl = `comgooglemaps://?saddr=${o}&daddr=${d}&directionsmode=${mode}${stops.length ? `&waypoints=${encodeURIComponent(wp)}` : ''}`;
    const androidUrl = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${mode}${stops.length ? `&waypoints=${encodeURIComponent(wp)}` : ''}`;

    Linking.openURL(Platform.OS === 'ios' ? iosUrl : androidUrl);
  }, [state]);

  const value = useMemo<Ctx>(() => ({
    state, setMode, setDestination, addStop, removeStop, resetRoute,
    setOriginToCurrent, computeOptimizedRoute, openInGoogleMaps
  }), [state, setMode]);

  return <RoutePlannerContext.Provider value={value}>{children}</RoutePlannerContext.Provider>;
};

export const useRoutePlanner = () => {
  const ctx = useContext(RoutePlannerContext);
  if (!ctx) throw new Error('useRoutePlanner deve ser usado dentro do RoutePlannerProvider');
  return ctx;
};
