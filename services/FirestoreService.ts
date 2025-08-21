import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

import { onSnapshot, type Unsubscribe } from 'firebase/firestore';

export type Role = 'user' | 'moderator' | 'admin';

// Documento mínimo criado no registo
export type UserMinimalDoc = {
  id: string;                 // uid
  nome: string;               // display name inserido no formulário
  email: string;              // email do formulário
  morada: string;             // endereço textual (ex.: "Rua X, Guimarães")
  role: Role;                 // valor vindo do formulário (recomendado: 'user')
  dataCriacao: any;           // serverTimestamp()
  dataAtualizacao: any;       // serverTimestamp()
};

export function userRef(uid: string) {
  return doc(collection(db, 'users'), uid);
}

/**
 * Cria (ou sobrescreve com merge) o documento mínimo do utilizador em /users/{uid}.
 * - Escreve APENAS os campos fornecidos (mais timestamps do servidor).
 * - Idempotente: se correr duas vezes, mantém dados e atualiza dataAtualizacao.
 */
export async function createUserDocumentStrict(
  u: User,
  data: { nome: string; email: string; morada: string; role: Role }
): Promise<void> {
  if (!u?.uid) throw new Error('Utilizador inválido ao criar documento.');
  const payload: UserMinimalDoc = {
    id: u.uid,
    nome: data.nome,
    email: data.email,
    morada: data.morada,
    role: data.role,
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  };
  await setDoc(userRef(u.uid), payload, { merge: true });
}

/** Verifica existência de documento. */
export async function userDocumentExists(uid: string): Promise<boolean> {
  const snap = await getDoc(userRef(uid));
  return snap.exists();
}

/** Atualiza apenas campos permitidos no perfil mínimo + dataAtualizacao. */
export async function updateUserMinimalDoc(
  uid: string,
  data: Partial<Pick<UserMinimalDoc, 'nome' | 'email' | 'morada'>>
) {
  await updateDoc(userRef(uid), { ...data, dataAtualizacao: serverTimestamp() });
}

/** Leitura única do doc mínimo. */
export async function getUserMinimalDoc(uid: string) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserMinimalDoc) : null;
}

export type UserExtras = {
  telemovel?: string;
  fotoURL?: string;
  dataNasc?: string;
};

/** Atualiza campos “extras” do perfil + dataAtualizacao (NÃO mexe em role/id/dataCriacao). */
export async function updateUserExtrasDoc(uid: string, extras: UserExtras) {
  await updateDoc(userRef(uid), {
    ...extras,
    dataAtualizacao: serverTimestamp(),
  });
}

/** Subscrição em tempo-real ao doc do utilizador. */
export function subscribeUserDoc(
  uid: string,
  callback: (data: (UserMinimalDoc & UserExtras) | null) => void
): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserMinimalDoc & UserExtras) : null);
  });
}
