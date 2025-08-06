import { useRouter } from 'expo-router';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Welcome() {
  const router = useRouter();
  const { height } = Dimensions.get('window');

  return (
    <View style={styles.wrapper}>
      {/* Header escuro com logo grande e título centrado verticalmente */}
      <View style={[styles.header, { height: height * 0.33 }]}>
        <View style={styles.logoGroup}>
          <Image
            source={require('../../assets/logo.png')} // substitui pelo teu logo real
            style={styles.logo}
          />
          <Text style={styles.logoText}>EcoCollab</Text>
        </View>
      </View>

      {/* Conteúdo branco com canto arredondado */}
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo ao EcoCollab</Text>
        <Text style={styles.subtitle}>
          A sua solução ideal para o ajudar e incentivar a tornar este mundo um lugar melhor.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/SharedScreens/login')}>
          <Text style={styles.buttonText}>Iniciar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logoGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginTop: 10,
    resizeMode: 'contain'
  },
  logoText: {
    fontSize: 35,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#EEEDD7',
    borderTopLeftRadius: 50,
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    flex: 1,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    flex: 2,
    color: '#444',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#EA3323',
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 9,
    elevation: 2,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  }
});
