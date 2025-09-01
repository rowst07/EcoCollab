// services/AuthContext.tsx
import { auth, db } from '@/firebase';
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
import { doc, onSnapshot } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export type AuthContextType = {
  user: User | null;
  loading: boolean;

  /** NOVO: role atual do utilizador (lido de /users/{uid}). */
  role: Role | null;

  /** Mantidos (mobile não parte) */
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    nome: string,
    email: string,
    password: string,
    morada: string,
    role: Role
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutApp: () => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  /** NOVO: alias conveniente para web/admin */
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Observa sessão
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(true); // vamos carregar o role a seguir

      // Limpa subscrição anterior ao doc do utilizador
      if (!u) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Observa /users/{uid} para obter o role em tempo real
      const unsubDoc = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        const r = (snap.data()?.role as Role) ?? null;
        setRole(r);
        setLoading(false);
      }, () => {
        // Se falhar a leitura, não bloqueia a app
        setRole(null);
        setLoading(false);
      });

      // devolver cleanup para quando o utilizador mudar
      return unsubDoc;
    });

    return () => unsubAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUp = async (
    nome: string,
    email: string,
    password: string,
    morada: string,
    role: Role
  ) => {
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

  // alias para conveniência no web
  const logout = signOutApp;

  const changeEmail = async (currentPassword: string, newEmail: string) => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('Utilizador não autenticado.');
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
    await fbUpdateEmail(u, newEmail.trim());
    if (!u.emailVerified) {
      await sendEmailVerification(u);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('Utilizador não autenticado.');
    const cred = EmailAuthProvider.credential(u.email, currentPassword);
    await reauthenticateWithCredential(u, cred);
    await fbUpdatePassword(u, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,           // NOVO
        signIn,
        signUp,
        resetPassword,
        signOutApp,
        changeEmail,
        changePassword,
        logout,         // NOVO (alias)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
