import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.header]}>
          <View style={styles.logoGroup}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.logoText}>EcoCollab</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.topSection}>
            <Text style={styles.title}>Iniciar Sessão</Text>
          </View>

          <View style={styles.midSection}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#999"
                style={styles.inputText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.label}>Palavra-passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Palavra-passe"
                placeholderTextColor="#999"
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={showPassword ? '#EA3323' : '#999'}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Esqueceu-se da palavra-passe?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/SharedScreens/register')}>
              <Text style={styles.link}>
                Ainda não tem conta?{' '}
                <Text style={{ fontWeight: 'bold' }}>Crie aqui!</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  midSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    marginTop: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
    paddingLeft: 20,
    alignSelf: 'flex-start',
  },
  inputContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  passwordContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#EA3323',
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 9,
    elevation: 2,
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  link: {
    fontSize: 16,
    color: '#000',
    textDecorationLine: 'underline',
  },
});
