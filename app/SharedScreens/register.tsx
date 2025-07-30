import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (name && email && password) {
      Alert.alert('Conta criada', 'Registo efetuado com sucesso!');
      router.push('/SharedScreens/login');
    } else {
      Alert.alert('Erro', 'Preenche todos os campos');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput placeholder="Nome" style={styles.input} onChangeText={setName} value={name} />
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} value={email} />
      <TextInput placeholder="Palavra-passe" style={styles.input} secureTextEntry onChangeText={setPassword} value={password} />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/SharedScreens/login')}>
        <Text style={styles.link}>Já tens conta? Inicia sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15 },
  button: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { marginTop: 20, textAlign: 'center', color: '#2e7d32' }
});
