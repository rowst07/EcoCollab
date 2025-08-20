// hooks/useProtectedRoute.ts
import { usePathname, useRouter } from 'expo-router';
import { User } from 'firebase/auth';
import { useEffect } from 'react';

export function useProtectedRoute(user: User | null, loading: boolean) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Define aqui o que consideras "protegido"
    const isProtected =
      pathname?.startsWith('/UserScreens');

    if (isProtected && !user) {
      router.replace('/SharedScreens/login');
    }
  }, [loading, user, pathname]);
}
