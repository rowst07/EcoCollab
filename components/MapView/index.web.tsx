import React from "react";

export const Marker   = (_: any) => null;
export const Callout  = (_: any) => null;
export const Circle   = (_: any) => null;
export const Polygon  = (_: any) => null;
export const Polyline = (_: any) => null;
export const PROVIDER_GOOGLE = "google";

type Props = { style?: React.CSSProperties; children?: React.ReactNode };
export default function MapViewStub(_props: Props) {
  return null; // opcional: <div>Mapa indisponível no web</div>
}
