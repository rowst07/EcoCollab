import { Redirect } from 'expo-router';

export default function Index() {
  // Página raiz manda para o welcome (pública)
  return <Redirect href="/SharedScreens/welcome" />;
}
