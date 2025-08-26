// app/hooks/useMyRole.ts
import { getUserMinimalDoc, subscribeUserDoc, type Role } from '@/services/FirestoreService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useMyRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }

      if (!user?.uid) {
        setRole(null);
        setLoading(false);
        return;
      }

      // leitura única (fallback útil caso as rules bloqueiem a subscrição)
      try {
        const doc = await getUserMinimalDoc(user.uid);
        setRole((doc?.role as Role) ?? null);
      } catch { /* ignore */ }

      // subscrição em tempo-real ao /users/{uid}
      unsubUser = subscribeUserDoc(user.uid, (u) => {
        setRole((u?.role as Role) ?? null);
        setLoading(false);
      });
    });

    return () => {
      if (unsubUser) unsubUser();
      unsubAuth();
    };
  }, []);

  return {
    role,
    isModerator: role === 'moderator',
    isAdmin: role === 'admin',
    loading,
  };
}
