import { StyleSheet, Text, View } from 'react-native';
import BottomNavbar from '../../components/bottomNavbar';

export default function homeUser() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo ao EcoCollab</Text>
        <Text style={styles.subtitle}>Esta é a tua página inicial.</Text>
      </View>

      <BottomNavbar /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#f5f2dc',
  },
  content: {
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
  },
});
