import BottomNavbar from '@/components/BottomNavbar';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { AuthProvider, useAuth } from '@/services/AuthContext';
import { Stack, usePathname } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Layout />
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


