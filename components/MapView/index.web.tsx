// components/MapView/index.web.tsx
import * as React from "react";
import type { MapViewProps, MapViewRef } from "./index.d";

export const Marker   = (_: any) => null;
export const Callout  = (_: any) => null;
export const Circle   = (_: any) => null;
export const Polygon  = (_: any) => null;
export const Polyline = (_: any) => null;
export const PROVIDER_GOOGLE = "google";

const MapView = React.forwardRef<MapViewRef, MapViewProps>((_props, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => { /* no-op no web */ },
  }), []);
  // Não renderizamos nada no web (evita importar módulos nativos)
  return null;
});

export default MapView;
