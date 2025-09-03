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
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useProtectedRoute(user, loading);

  const showNavbar = [
    '/UserScreens/homeUser',
    '/UserScreens/retomas',
    '/SharedScreens/perfil',
  ].includes(pathname || '');

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


