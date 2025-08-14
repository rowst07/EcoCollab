
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RESIDUE_COLORS, THEME } from '../../constants/Colors';

const colors = THEME.dark;


export default function PesquisaModal({
  visible,
  onClose,
  pesquisa,
  setPesquisa,
  aplicarPesquisa,
  historico,
  setHistorico,
  filtros,
  setFiltros
}) {
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Pesquisar Ecoponto</Text>

        <TextInput
          style={styles.input}
          placeholder="Digite um nome..."
          placeholderTextColor={colors.textMuted}
          value={pesquisa}
          onChangeText={setPesquisa}
        />
        <TouchableOpacity style={styles.btnAplicar} onPress={aplicarPesquisa}>
          <Text style={styles.btnAplicarText}>Aplicar</Text>
        </TouchableOpacity>

        {/* Filtros */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <Text style={styles.sectionTitle}>Filtros</Text>
          <Text style={styles.sectionIcon}>{mostrarFiltros ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {mostrarFiltros && (
          <View style={styles.grid}>
            {Object.keys(filtros).filter(k => k !== 'classificacao').map(tipo => (
              <TouchableOpacity
                key={tipo}
                onPress={() => setFiltros(prev => ({ ...prev, [tipo]: !prev[tipo] }))}
                style={[
                  styles.tipoItem,
                  { opacity: filtros[tipo] ? 1 : 0.4 }
                ]}
              >
                <View style={[styles.circle, { backgroundColor: RESIDUE_COLORS[tipo] || colors.icon }]} />
                <Text style={styles.tipoText}>{tipo.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Classificação */}
        {mostrarFiltros && (
          <View>
            <Text style={styles.subTitle}>Classificação mínima</Text>
            {['todos', '3', '4', '5'].map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setFiltros(prev => ({ ...prev, classificacao: c }))}
                style={[styles.filtroBtn, filtros.classificacao === c && styles.filtroAtivo]}
              >
                <Text style={{ color: colors.text }}>{c === 'todos' ? 'Todos' : `>= ${c} estrelas`}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
          <FlatList
            data={historico}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { setPesquisa(item); onClose(); }}>
                <Text style={styles.historicoItem}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={styles.btnFechar} onPress={onClose}>
          <Text style={{ color: colors.text }}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    backgroundColor: colors.bg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
  btnAplicar: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnAplicarText: {
    color: THEME.dark.text,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
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
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: colors.text,
  },
  filtroBtn: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  filtroAtivo: {
    backgroundColor: colors.primary,
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
    marginTop: 30,
  },
});
