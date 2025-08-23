import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RESIDUE_COLORS, THEME } from '../../constants/Colors';

const colors = THEME.dark;

// Tipos base usados na UI (ajusta à tua lista global)
const RES_KEYS = ['vidro', 'papel', 'plastico', 'metal', 'pilhas', 'organico'] as const;

export default function PesquisaModal({
  visible,
  onClose,
  pesquisa,
  setPesquisa,
  aplicarPesquisa,
  historico,
  setHistorico,
  filtros,
  setFiltros,
}) {
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const setFiltro = (k: string, v: any) =>
    setFiltros((prev: any) => ({ ...prev, [k]: v }));

  // Recalcula e guarda um array com os tipos desativados.
  const computeTiposExcluidos = (state: any) =>
    RES_KEYS.filter((k) => state[k] === false);

  const toggleTipo = (tipo: string) => {
    setFiltros((prev: any) => {
      const next = { ...prev, [tipo]: !prev[tipo] };
      return { ...next, tiposExcluidos: computeTiposExcluidos(next) };
    });
  };

  const limparFiltros = () => {
    setFiltros((prev: any) => {
      const base = {
        ...prev,
        // todos ativos
        vidro: true,
        papel: true,
        plastico: true,
        metal: true,
        pilhas: true,
        organico: true,
        classificacao: 'todos',
        status: 'aprovado',
        comFoto: false,
        ordenar: 'recentes',
      };
      return { ...base, tiposExcluidos: [] };
    });
  };

  // valores com fallback
  const status = filtros.status ?? 'aprovado';
  const comFoto = Boolean(filtros.comFoto);
  const ordenar = filtros.ordenar ?? 'recentes';

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Pesquisar Ecoponto</Text>

        {/* SCROLL GERAL DO MODAL */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pesquisa */}
          <TextInput
            style={styles.input}
            placeholder="Digite um nome, morada ou termo…"
            placeholderTextColor={colors.textMuted}
            value={pesquisa}
            onChangeText={setPesquisa}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={aplicarPesquisa}
          />

          {/* Ações topo */}
          <View style={styles.rowGap}>
            <TouchableOpacity style={styles.btnAplicar} onPress={aplicarPesquisa}>
              <Text style={styles.btnAplicarText}>Aplicar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnLimpar} onPress={limparFiltros}>
              <Text style={styles.btnLimparText}>Limpar filtros</Text>
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Text style={styles.sectionTitle}>Filtros</Text>
            <Text style={styles.sectionIcon}>{mostrarFiltros ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {mostrarFiltros && (
            <>
              {/* Tipos de resíduo */}
              <Text style={[styles.subTitle, { marginTop: 16 }]}>Tipos de resíduo</Text>
              <View style={styles.grid}>
                {Object.keys(filtros)
                  .filter((k) => !['classificacao', 'status', 'comFoto', 'ordenar', 'tiposExcluidos'].includes(k))
                  .map((tipo) => (
                    <TouchableOpacity
                      key={tipo}
                      onPress={() => toggleTipo(tipo)}
                      style={[styles.tipoItem, { opacity: filtros[tipo] ? 1 : 0.4 }]}
                    >
                      <View
                        style={[
                          styles.circle,
                          { backgroundColor: (RESIDUE_COLORS as any)[tipo] || colors.icon },
                        ]}
                      />
                      <Text style={styles.tipoText}>{tipo.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {/* Apenas com foto */}
              <View style={[styles.switchRow, { marginTop: 6 }]}>
                <Text style={styles.subTitle}>Apenas com foto</Text>
                <Switch
                  value={comFoto}
                  onValueChange={(v) => {
                    setFiltros((prev: any) => ({ ...prev, comFoto: Boolean(v) }));
                    // Se quiseres aplicar logo a pesquisa ao mudar o switch, descomenta:
                    // aplicarPesquisa?.();
                  }}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={comFoto ? '#fff' : '#eee'}
                />
              </View>

              {/* Classificação mínima */}
              <Text style={styles.subTitle}>Classificação mínima</Text>
              <View style={styles.rowWrap}>
                {(['todos', '3', '4', '5'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setFiltro('classificacao', c)}
                    style={[styles.chip, filtros.classificacao === c && styles.chipAtivo]}
                  >
                    <Text
                      style={[styles.chipText, filtros.classificacao === c && styles.chipTextAtivo]}
                    >
                      {c === 'todos' ? 'Todos' : `≥ ${c}★`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Estado */}
              <Text style={styles.subTitle}>Estado</Text>
              <View style={styles.rowWrap}>
                {(['aprovado', 'pendente', 'todos'] as const).map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setFiltro('status', val)}
                    style={[styles.chip, status === val && styles.chipAtivo]}
                  >
                    <Text style={[styles.chipText, status === val && styles.chipTextAtivo]}>
                      {val[0].toUpperCase() + val.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ordenar por */}
              <Text style={styles.subTitle}>Ordenar por</Text>
              <View style={styles.rowWrap}>
                {(['recentes', 'antigos', 'nome'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setFiltro('ordenar', opt)}
                    style={[styles.chip, ordenar === opt && styles.chipAtivo]}
                  >
                    <Text style={[styles.chipText, ordenar === opt && styles.chipTextAtivo]}>
                      {opt === 'recentes'
                        ? 'Mais recentes'
                        : opt === 'antigos'
                        ? 'Mais antigos'
                        : 'Nome (A–Z)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Histórico */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setMostrarHistorico(!mostrarHistorico)}
          >
            <Text style={styles.sectionTitle}>Histórico</Text>
            <Text style={styles.sectionIcon}>{mostrarHistorico ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {mostrarHistorico && (
            <ScrollView
              style={{ maxHeight: 240, marginTop: 6 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {historico.map((item: string, index: number) => (
                <TouchableOpacity
                  key={`${item}-${index}`}
                  onPress={() => {
                    setPesquisa(item);
                    onClose();
                  }}
                >
                  <Text style={styles.historicoItem}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Fechar */}
          <TouchableOpacity style={styles.btnFechar} onPress={onClose}>
            <Text style={{ color: colors.text }}>Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: colors.bg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: colors.textInput,
    backgroundColor: colors.input,
  },
  rowGap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  btnAplicar: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAplicarText: {
    color: THEME.dark.text, // restaurado
    fontWeight: 'bold',
  },
  btnLimpar: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card, // restaurado
  },
  btnLimparText: {
    color: colors.text, // restaurado
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionIcon: {
    fontSize: 18,
    color: colors.icon,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tipoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: THEME.dark.input,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  tipoText: {
    fontWeight: '600',
    color: colors.textInput,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    color: colors.text,
  },
  chip: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
  },
  chipTextAtivo: {
    color: THEME.dark.bg,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  historicoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.text,
  },
  btnFechar: {
    backgroundColor: colors.danger,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
  },
});
