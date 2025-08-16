import { BRAND } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...'
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const bg = useThemeColor('bg');
  const card = useThemeColor('card');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  // Sheet flutuante: preto com textos brancos; botão compacto: preto
  const sheetBg = '#18181B';
  const sheetText = '#fff';
  const overlay = useThemeColor('overlay');

  const current = options.find(o => o.value === value);

  return (
    <>
      {/* Botão compacto */}
      <TouchableOpacity
        style={[s.select, { backgroundColor: card, borderColor: border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[s.selectText, { color: '#000' }]} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#000" />
      </TouchableOpacity>

      {/* OVERLAY EM MODAL (fica por cima de tudo) */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={[s.backdrop, { backgroundColor: overlay }]}>
          {/* Sheet flutuante */}
          <View style={[s.sheet, { backgroundColor: sheetBg, borderColor: border }]}> 
            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { color: sheetText }]} numberOfLines={1}>Escolher</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={sheetText} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.option}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.optionText, { color: sheetText }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.value === value && <Ionicons name="checkmark" size={18} color={BRAND.primary} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[s.sep, { borderColor: border }]} />}
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            />

            <TouchableOpacity
              style={[s.cancel, { backgroundColor: BRAND.danger }]}
              onPress={() => setOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Tocar fora fecha */}
          <TouchableOpacity style={s.touchOutside} onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  select: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectText: { fontWeight: '600', flex: 1, marginRight: 8 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // espaço p/ home indicator
    zIndex: 9999, // redundante com Modal, mas ajuda no Android
    elevation: 24
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  optionText: { fontSize: 16 },
  sep: { borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  touchOutside: {
    ...StyleSheet.absoluteFillObject
  }
});
