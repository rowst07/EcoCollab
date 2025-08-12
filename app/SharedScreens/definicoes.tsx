import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

/** ---------- SimpleSelect (dropdown sem dependências) ---------- */
function SimpleSelect({
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
  const current = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity style={ssStyles.select} onPress={() => setOpen(true)}>
        <Text style={ssStyles.selectText}>{current?.label ?? placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color="#e5e7eb" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={ssStyles.backdrop}>
          <View style={ssStyles.sheet}>
            <Text style={ssStyles.sheetTitle}>Escolher</Text>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={ssStyles.option}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={ssStyles.optionText}>{opt.label}</Text>
                {opt.value === value && <Ionicons name="checkmark" size={18} color="#22c55e" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ssStyles.cancel} onPress={() => setOpen(false)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const ssStyles = StyleSheet.create({
  select: {
    height: 50,
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectText: { color: '#e5e7eb', fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0b0b0b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#262626'
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, paddingHorizontal: 4, color: '#e5e7eb' },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  optionText: { fontSize: 16, color: '#e5e7eb' },
  cancel: {
    marginTop: 8,
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  }
});

/** --------------------- Página de Definições (DARK) --------------------- */
export default function Definicoes() {
  const router = useRouter();

  // Predefinido: tema escuro
  const [tema, setTema] = useState<'dark'|'system'|'light'>('dark');
  const [idioma, setIdioma] = useState<'pt'|'en'>('pt');
  const [mapType, setMapType] = useState<'standard'|'satellite'|'hybrid'|'terrain'>('standard');
  const [unidades, setUnidades] = useState<'km'|'mi'>('km');

  const [notif, setNotif] = useState(true);
  const [alertaProximidade, setAlertaProximidade] = useState(false);

  const [cluster, setCluster] = useState(true);
  const [trafego, setTrafego] = useState(false);

  const [analytics, setAnalytics] = useState(true);

  const abrirDefinicoesSistema = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Aviso', 'Não foi possível abrir as definições do sistema.');
    }
  };

  const terminarSessao = () => {
    Alert.alert('Terminar sessão', 'Tens a certeza que queres terminar sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Terminar', style: 'destructive', onPress: () => router.push('/SharedScreens/login') }
    ]);
  };

  const eliminarConta = () => {
    Alert.alert('Eliminar conta', 'Esta ação é permanente. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => console.log('delete-account') }
    ]);
  };

  const limparHistorico = () => {
    Alert.alert('Limpar histórico', 'Queres limpar a pesquisa recente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => console.log('clear-history') }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header preto */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Definições</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28, backgroundColor: '#000' }}>
        {/* Conta */}
        <Section title="Conta">
          <Item onPress={() => console.log('Alterar Pass')} icon="key-outline" label="Alterar palavra‑passe" />
          <Item onPress={terminarSessao} icon="log-out-outline" label="Terminar sessão" danger />
          <Item onPress={eliminarConta} icon="trash-outline" label="Eliminar conta" danger />
        </Section>

        {/* Preferências */}
        <Section title="Preferências">
          <Row label="Tema">
            <SimpleSelect
              value={tema}
              onChange={v => setTema(v as any)}
              options={[
                { value: 'dark', label: 'Escuro' },
                { value: 'system', label: 'Sistema' },
                { value: 'light', label: 'Claro' }
              ]}
            />
          </Row>
          <Row label="Idioma">
            <SimpleSelect
              value={idioma}
              onChange={v => setIdioma(v as any)}
              options={[
                { value: 'pt', label: 'Português' },
                { value: 'en', label: 'English' }
              ]}
            />
          </Row>
        </Section>

        {/* Mapa */}
        <Section title="Mapa">
            <Row label="Tipo de mapa">
            <SimpleSelect
              value={mapType}
              onChange={v => setMapType(v as any)}
              options={[
                { value: 'standard', label: 'Padrão' },
                { value: 'satellite', label: 'Satélite' },
                { value: 'hybrid', label: 'Híbrido' },
                { value: 'terrain', label: 'Terreno' }
              ]}
            />
          </Row>
          <Row label="Unidades">
            <SimpleSelect
              value={unidades}
              onChange={v => setUnidades(v as any)}
              options={[
                { value: 'km', label: 'Quilómetros (km)' },
                { value: 'mi', label: 'Milhas (mi)' }
              ]}
            />
          </Row>
          <Item onPress={limparHistorico} icon="time-outline" label="Limpar histórico de pesquisa" />
        </Section>

        {/* Notificações */}
        <Section title="Notificações">
          <ToggleRow label="Ativar notificações" value={notif} onValueChange={setNotif} />
          <ToggleRow label="Alertas de ecopontos próximos" value={alertaProximidade} onValueChange={setAlertaProximidade} />
        </Section>

        {/* Privacidade */}
        <Section title="Privacidade">
          <ToggleRow label="Partilhar analytics anónimos" value={analytics} onValueChange={setAnalytics} />
          <Item onPress={abrirDefinicoesSistema} icon="settings-outline" label="Abrir definições do sistema" />
        </Section>

        {/* Sobre */}
        <Section title="Sobre">
          <Item onPress={() => console.log('ver-termos')} icon="document-text-outline" label="Termos e Condições" />
          <Item onPress={() => console.log('ver-privacidade')} icon="shield-checkmark-outline" label="Política de Privacidade" />
          <Item onPress={() => console.log('contacto-suporte')} icon="help-circle-outline" label="Ajuda & Suporte" />
          <View style={styles.versionBox}>
            <Text style={styles.versionText}>EcoCollab v1.0.0</Text>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

/** --------------------- Componentes UI (dark) --------------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Item({
  icon,
  label,
  onPress,
  danger
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : '#e5e7eb'} />
        <Text style={[styles.itemLabel, danger && { color: '#ef4444' }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3f3f46', true: '#065f46' }}
        thumbColor={value ? '#22c55e' : '#e5e7eb'}
      />
    </View>
  );
}

/** --------------------- Estilos (dark) --------------------- */
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#111'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  sectionCard: {
    backgroundColor: '#0b0b0b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#18181b',
    overflow: 'hidden'
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#0b0b0b',
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  itemLabel: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '600'
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#0b0b0b',
    borderBottomWidth: 1,
    borderBottomColor: '#18181b'
  },
  rowLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600'
  },
  versionBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'flex-start',
    backgroundColor: '#0b0b0b'
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af'
  }
});
