// components/MapView/index.d.ts
import type * as React from "react";

/** Valor (componente) default */
declare const MapView: React.ComponentType<any>;
export default MapView;

/** Marcadores e overlays */
export const Marker: React.ComponentType<any>;
export const Callout: React.ComponentType<any>;
export const Circle: React.ComponentType<any>;
export const Polygon: React.ComponentType<any>;
export const Polyline: React.ComponentType<any>;
export const PROVIDER_GOOGLE: any;

/** --- Tipos usados no teu código (stubs) --- */
export type MapPressEvent = any;
export type Region = any;

/** Se precisares de tipar refs: */
export type MapViewRef = any;
