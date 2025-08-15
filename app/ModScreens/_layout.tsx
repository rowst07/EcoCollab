import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function ModLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        
      }}
    >
      {/* Hub do painel */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Painel de Moderador',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Secções principais */}
      <Stack.Screen name="mensagens/index" options={{ title: 'Mensagens' }} />
      <Stack.Screen name="utilizadores/index" options={{ title: 'Gestão de Utilizadores' }} />
      <Stack.Screen name="pontos/index" options={{ title: 'Gestão de Pontos' }} />

      {/* Detalhes / formulários */}
      <Stack.Screen name="mensagens/[id]" options={{ title: 'Detalhe da Mensagem' }} />
      <Stack.Screen name="utilizadores/[id]" options={{ title: 'Perfil do Utilizador' }} />
      <Stack.Screen name="pontos/novo" options={{ title: 'Novo Ponto' }} />
      <Stack.Screen name="pontos/editar/[id]" options={{ title: 'Editar Ponto' }} />
    </Stack>
  );
}
