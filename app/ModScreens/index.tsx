import { StyleSheet, Text, View } from 'react-native';

export default function ModHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Moderador</Text>
      <Text style={styles.subtitle}>
        Aqui vais poder gerir reportes, utilizadores e pontos de recolha.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center'
  }
});
