import { BRAND, MAP_STYLE, THEME } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { MapPressEvent, Marker } from 'react-native-maps';

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: { lat: number; lng: number }, address: string) => void;
  initialCoord?: { lat: number; lng: number } | null;
  scheme: 'light' | 'dark';
  loading?: boolean;
}

export const MapModal: React.FC<MapModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialCoord,
  scheme,
  loading = false,
}) => {
  const [coord, setCoord] = React.useState<{ lat: number; lng: number } | null>(initialCoord ?? null);
  const [address, setAddress] = React.useState('');
  const [fetching, setFetching] = React.useState(false);
  const mapRef = useRef<MapView>(null);

  React.useEffect(() => {
    setCoord(initialCoord ?? null);
    setAddress('');
  }, [visible, initialCoord]);

  const getAddress = async (lat: number, lng: number) => {
    setFetching(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await resp.json();
      setAddress(data.display_name || '');
    } catch {
      setAddress('');
    } finally {
      setFetching(false);
    }
  };


  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoord({ lat: latitude, lng: longitude });
    getAddress(latitude, longitude);
  };

  const handleMarkerDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoord({ lat: latitude, lng: longitude });
    getAddress(latitude, longitude);
  };

  const handleConfirm = () => {
    if (coord) onConfirm(coord, address);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Define a localização</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: coord?.lat ?? 41.6946,
                longitude: coord?.lng ?? -8.8301,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2,
              }}
              onPress={handleMapPress}
              customMapStyle={scheme === 'dark' ? (MAP_STYLE.dark as any) : []}
            >
              {coord && (
                <Marker
                  draggable
                  coordinate={{ latitude: coord.lat, longitude: coord.lng }}
                  onDragEnd={handleMarkerDragEnd}
                  title="Local selecionado"
                />
              )}
            </MapView>
            {!coord ? (
              <View style={styles.mapHint}>
                <Feather name="map-pin" size={16} color="#fff" />
                <Text style={styles.mapHintText}>Toca no mapa para colocar o marcador</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.addressBox}>
            {fetching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addressText}>{address ? address : 'Seleciona um local no mapa...'}</Text>
            )}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#000' }]} onPress={onClose}>
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: BRAND.primary }, !coord ? { opacity: 0.6 } : null]}
              onPress={handleConfirm}
              disabled={!coord}
            >
              <Text style={[styles.actionBtnText, { color: THEME.light.bg }]}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000099' },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mapWrap: { height: 320, backgroundColor: '#000' },
  mapHint: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  mapHintText: { color: '#fff', fontSize: 13, marginTop: 4 },
  addressBox: {
    padding: 12,
    backgroundColor: '#222',
    alignItems: 'center',
  },
  addressText: { color: '#fff', fontSize: 13, textAlign: 'center' },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
});
