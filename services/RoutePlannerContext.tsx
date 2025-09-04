// context/RoutePlannerContext.tsx
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type TravelMode = 'walking' | 'driving';
export type Waypoint = { id: string; lat: number; lng: number; nome?: string };

type State = {
  origin?: { lat: number; lng: number };
  destination?: Waypoint;
  stops: Waypoint[];
  mode: TravelMode;
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
  setOriginToCurrent: () => Promise<void>;
};

const RoutePlannerContext = createContext<Ctx | null>(null);

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;

function decodePolyline(encoded: string) {
  let index = 0, lat = 0, lng = 0, coordinates: { latitude:number; longitude:number }[] = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1); lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1); lng += dlng;
    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}
function fmtDur(d?: string){ if(!d)return; const s=Math.max(0,Math.round(parseFloat(d.replace('s','')))); const h=Math.floor(s/3600),m=Math.round((s%3600)/60); return h>=1?`${h} h ${m} min`:`${m} min`; }
function fmtDist(m?: number){ if(m==null)return; return m>=1000?`${(m/1000).toFixed(1)} km`:`${m} m`; }

export const RoutePlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<State>({ stops: [], mode: 'walking' });
  const stateRef = useRef(state); stateRef.current = state;

  const setMode = (m: TravelMode) => setState(p => ({ ...p, mode: m }));
  const setDestination = (w: Waypoint) => setState(p => ({ ...p, destination: w }));
  const addStop = (w: Waypoint) => setState(p => (p.stops.some(s => s.id===w.id) ? p : { ...p, stops: [...p.stops, w] }));
  const removeStop = (id: string) => setState(p => ({ ...p, stops: p.stops.filter(s => s.id !== id) }));
  const resetRoute = () => setState({ stops: [], mode: 'walking' });

  const setOriginToCurrent = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Sem permissão de localização.');
    const loc = await Location.getCurrentPositionAsync({});
    setState(p => ({ ...p, origin: { lat: loc.coords.latitude, lng: loc.coords.longitude } }));
  }, []);

  // --------- Routes API v2 com controle de versão (anti-race) ----------
  const reqSeqRef = useRef(0);  // id da última request iniciada
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const compute = useCallback(async () => {
    const snap = stateRef.current;
    const { origin, destination, stops, mode } = snap;
    if (!origin || !destination) return;

    const myReqId = ++reqSeqRef.current; // marca esta request como a "mais recente"
    const isDriving = mode === 'driving';
    const body: any = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      intermediates: stops.map(s => ({ location: { latLng: { latitude: s.lat, longitude: s.lng } } })),
      travelMode: isDriving ? 'DRIVE' : 'WALK',
      optimizeWaypointOrder: true,
      polylineEncoding: 'ENCODED_POLYLINE',
      ...(isDriving ? { routingPreference: 'TRAFFIC_AWARE' } : {})
    };

    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': 'AIzaSyAEoeJ6NYPDy7uO0jy3ahRSeO26VqavI4o',
          'X-Goog-FieldMask':
            'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex'
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      // DESCARTA respostas antigas (se entretanto outra request foi iniciada)
      if (myReqId !== reqSeqRef.current) return;

      if (!res.ok) throw new Error(json?.error?.message || 'Routes API error');
      const route = json?.routes?.[0];

      const encoded = route?.polyline?.encodedPolyline as string | undefined;
      const coords = encoded ? decodePolyline(encoded) : [];

      setState(p => ({
        ...p,
        coords,
        // guarda ordem **apenas** se o tamanho corresponder ao nº atual de paragens
        waypointOrder:
          Array.isArray(route?.optimizedIntermediateWaypointIndex) &&
          route.optimizedIntermediateWaypointIndex.length === p.stops.length
            ? route.optimizedIntermediateWaypointIndex.slice()
            : undefined,
        totalDistanceText: fmtDist(route?.distanceMeters),
        totalDurationText: fmtDur(route?.duration),
      }));
    } catch (_) {
      // em caso de erro, mantém estado anterior (sem limpar stops/coords)
    }
  }, []);

  // auto compute (debounce curto) quando qualquer coisa relevante muda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { compute(); }, 120);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [state.origin, state.destination, state.stops, state.mode, compute]);

  const value = useMemo<Ctx>(() => ({
    state, setMode, setDestination, addStop, removeStop, setOriginToCurrent
  }), [state]);

  return <RoutePlannerContext.Provider value={value}>{children}</RoutePlannerContext.Provider>;
};

export const useRoutePlanner = () => {
  const ctx = useContext(RoutePlannerContext);
  if (!ctx) throw new Error('useRoutePlanner deve ser usado dentro do RoutePlannerProvider');
  return ctx;
};
