import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { AuthProvider, useAuth } from '@/services/AuthContext';
import { RoutePlannerProvider } from '@/services/RoutePlannerContext';
import { Stack, usePathname } from 'expo-router';
import BottomNavbar from '../components/bottomNavbar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RoutePlannerProvider>
        <Layout />
      </RoutePlannerProvider>
    </AuthProvider>
  );
}

function Layout() {
  const { user, loading } = useAuth();
  useProtectedRoute(user, loading);

  // garantes que é sempre string
  const pathname = usePathname() ?? '';

  // rotas onde a navbar inferior deve aparecer
  const NAVBAR_ROUTES = new Set<string>([
    '/UserScreens/homeUser',
    '/UserScreens/retomas',
    '/SharedScreens/perfil',
  ]);

  const showNavbar = NAVBAR_ROUTES.has(pathname);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      {showNavbar && <BottomNavbar />}
    </>
  );
}
