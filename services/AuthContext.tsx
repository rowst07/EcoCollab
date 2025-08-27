// services/AuthContext.tsx
import { auth } from '@/firebase';
import { Role, createUserDocumentStrict } from '@/services/FirestoreService';
import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nome: string, email: string, password: string, morada: string, role: Role) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutApp: () => Promise<void>;
  /** Atualiza o email reautenticando com a password atual. Envia verificação se necessário. */
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  /** Atualiza a palavra-passe reautenticando com a password atual. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = onAuthStateChanged(auth, (u) => {
      console.log('[Auth] onAuthStateChanged ->', !!u, u?.uid);
      setUser(u);
      setLoading(false);
    });
    return sub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUp = async (nome: string, email: string, password: string, morada: string, role: Role) => {
    // 1) cria conta
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    // 2) atualiza displayName (apenas visual no Auth)
    if (cred.user && nome) {
      await updateProfile(cred.user, { displayName: nome });
    }

    // 3) cria doc mínimo em /users/{uid}
    await createUserDocumentStrict(cred.user, {
      nome,
      email: email.trim(),
      morada,
      role,
    });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOutApp = async () => {
    await signOut(auth);
  };

  const changeEmail = async (currentPassword: string, newEmail: string) => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('Utilizador não autenticado.');
    // Reautenticar
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
    // Atualizar email
    await fbUpdateEmail(u, newEmail.trim());
    // Enviar verificação se necessário
    if (!u.emailVerified) {
      await sendEmailVerification(u);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('Utilizador não autenticado.');
    // Reautenticar
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
    // Atualizar password
    await fbUpdatePassword(u, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, resetPassword, signOutApp, changeEmail, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
