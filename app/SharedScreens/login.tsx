import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.wrapper}>
      {/* Header escuro com logo e título */}
      <View style={[styles.header]}>
        <View style={styles.logoGroup}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.logoText}>EcoCollab</Text>
        </View>
      </View>

      {/* Conteúdo branco com inputs e botão */}
      <View style={styles.content}>
        <Text style={styles.title}>Iniciar Sessão</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Palavra-passe"
          placeholderTextColor="#999"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/SharedScreens/register')}>
          <Text style={styles.link}>Criar conta</Text>
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
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 35,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 2,
    backgroundColor: '#fff',
    borderTopLeftRadius: 50,
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    flex: 1,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#EA3323',
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 9,
    elevation: 2,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
});
