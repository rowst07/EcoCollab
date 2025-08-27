// hooks/useUserDoc.ts
import { useAuth } from '@/services/AuthContext';
import {
  subscribeUserDoc,
  type UserExtras,
  type UserMinimalDoc,
} from '@/services/FirestoreService';
import { useEffect, useState } from 'react';

export type FullUserDoc = UserMinimalDoc & UserExtras;

export function useUserDoc() {
  const { user } = useAuth();
  const [doc, setDoc] = useState<FullUserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setDoc(null);
      setLoading(false);
      return;
    }
    const unsub = subscribeUserDoc(user.uid, (d) => {
      setDoc(d as FullUserDoc | null);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  return { userDoc: doc, loading };
}
