import BottomNavbar from '@/components/BottomNavbar';
import { Stack, usePathname } from 'expo-router';

export default function Layout() {
  const pathname = usePathname();

  const showNavbar = [
    '/UserScreens/homeUser',
    '/UserScreens/retomas',
    '/SharedScreens/perfil',
  ].includes(pathname);

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
