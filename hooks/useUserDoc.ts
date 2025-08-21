// useUserDoc.ts
import { onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { userRef } from '../services/FirestoreService';

export function useUserDoc() {
  const { user } = useAuth();
  const [userDoc, setUserDoc] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return;
    }
    const unsub = onSnapshot(userRef(user.uid), (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [user]);

  return userDoc;
}
