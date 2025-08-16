import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SimpleSelect } from '@/components/SimpleSelect';
import { useTheme, useThemeColor } from '@/hooks/useThemeColor';

export default function Definicoes() {
  const router = useRouter();

  // Tema atual
  const t = useTheme();
  const bg = useThemeColor('bg');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const card = useThemeColor('card');
  const border = useThemeColor('border');

  // Estado local (liga depois a store/AsyncStorage se quiseres)
  const [tema, setTema] = useState<'dark'|'system'|'light'>('dark'); // predefinido escuro
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
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header preto */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Definições</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Conta */}
        <Section title="Conta">
          <Item onPress={() => console.log('Mudar Pass')} icon="key-outline" label="Alterar palavra‑passe" />
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
        </Section>

        {/* Mapa */}
        <Section title="Mapa">
          <ToggleRow label="Clustering de marcadores" value={cluster} onValueChange={setCluster} />
          <ToggleRow label="Mostrar trânsito" value={trafego} onValueChange={setTrafego} />
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
            <Text style={[styles.versionText, { color: muted }]}>EcoCollab v1.0.0</Text>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

/** --------------------- Componentes UI --------------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const textMuted = useThemeColor('textMuted');
  const card = useThemeColor('card');
  const border = useThemeColor('border');

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
      <Text style={[styles.sectionTitle, { color: textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>{children}</View>
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
  const text = useThemeColor('text');
  const border = useThemeColor('hairline');
  const card = useThemeColor('card');

  return (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: border, backgroundColor: '#18181B' }]}
      onPress={onPress}
      activeOpacity={1}
    >
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : text} />
        <Text style={[styles.itemLabel, { color: danger ? '#ef4444' : '#fff' }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('hairline');
  const card = useThemeColor('card');

  return (
    <View style={[styles.row, { borderBottomColor: border, backgroundColor: '#000' }]}>
      <Text style={[styles.rowLabel, { color: textMuted }]}>{label}</Text>
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
  const text = useThemeColor('text');
  const border = useThemeColor('hairline');
  const card = useThemeColor('card');

  return (
  <View style={[styles.item, { borderBottomColor: border, backgroundColor: '#18181B' }]}> 
      <View style={styles.itemLeft}>
  <Text style={[styles.itemLabel, { color: '#fff' }]}>{label}</Text>
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

/** --------------------- Estilos --------------------- */
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
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
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
    fontWeight: '600'
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  rowLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600'
  },
  versionBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'flex-start',
    backgroundColor: '#18181B',
  },
  versionText: {
    fontSize: 14
  }
});
