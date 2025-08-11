import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const cores = {
  papel: '#2196F3',
  plastico: '#FFEB3B',
  vidro: '#4CAF50',
  pilhas: '#F44336',
  organico: '#795548',
  outros: '#ffffff'
};


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
                <View style={[styles.circle, { backgroundColor: cores[tipo] }]} />
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
                <Text style={{ color: '#fff' }}>{c === 'todos' ? 'Todos' : `>= ${c} estrelas`}</Text>
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
          <Text style={{ color: '#fff' }}>Fechar</Text>
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
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  btnAplicar: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  btnAplicarText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  sectionIcon: {
    fontSize: 18,
    color: '#555'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10
  },
  tipoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#eee'
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10
  },
  tipoText: {
    fontWeight: '600',
    color: '#333'
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5
  },
  filtroBtn: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  filtroAtivo: {
    backgroundColor: '#2E7D32'
  },
  historicoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  btnFechar: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30
  }
});
