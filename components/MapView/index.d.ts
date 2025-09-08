// components/MapView/index.d.ts
import type * as React from "react";
import type { ViewProps } from "react-native";

/** Região compatível com react-native-maps */
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Métodos que usamos via ref */
export type MapViewRef = {
  animateToRegion: (region: Region, durationMs?: number) => void;
};

/** Props mínimas + extras que usamos no app */
export type MapViewProps = ViewProps & {
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (r: Region) => void;
  // extras usados no código (opcionais)
  provider?: any;
  customMapStyle?: any;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  showsCompass?: boolean;
  children?: React.ReactNode;
};

/** Componente default (com ref para MapViewRef) */
declare const MapView: React.ForwardRefExoticComponent<
  MapViewProps & React.RefAttributes<MapViewRef>
>;
export default MapView;

/** Subcomponentes/constantes que usamos */
export const Marker: React.ComponentType<any>;
export const Callout: React.ComponentType<any>;
export const Circle: React.ComponentType<any>;
export const Polygon: React.ComponentType<any>;
export const Polyline: React.ComponentType<any>;
export const PROVIDER_GOOGLE: any;
