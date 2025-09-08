// components/MapView/index.native.tsx
import MapView, {
    Callout,
    Circle,
    Marker,
    Polygon,
    Polyline,
    PROVIDER_GOOGLE,
} from "react-native-maps";

export { Callout, Circle, Marker, Polygon, Polyline, PROVIDER_GOOGLE };

// Tipos úteis reexportados
export type Region = import("react-native-maps").Region;
// No native, o ref é a própria instância de MapView do RN Maps
export type MapViewRef = MapView;

// Props iguais às do componente original (para TS ajudar no native)
export type MapViewProps = React.ComponentProps<typeof MapView>;

export default MapView;
