// services/FirestoreService.ts
import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  GeoPoint,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

export type Role = 'user' | 'moderator' | 'admin';

// ===================== USERS =====================

export type UserMinimalDoc = {
  id: string;                 // uid
  nome: string;               // display name
  email: string;              // email
  morada: string;             // endereço textual
  role: Role;                 // 'user' | 'moderator' | 'admin'
  dataCriacao: any;           // serverTimestamp()
  dataAtualizacao: any;       // serverTimestamp()
};

export function userRef(uid: string) {
  return doc(collection(db, 'users'), uid);
}

/** Cria/sobrescreve (merge) doc mínimo do utilizador. */
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

/** Atualiza perfil mínimo permitido. */
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

/** Atualiza campos “extras” do perfil (sem mexer em role/id/dataCriacao). */
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

// ===================== PONTOS DE RECOLHA =====================

export type PontoRecolhaStatus = 'pendente' | 'aprovado' | 'reprovado';

export type PontoRecolhaCreate = {
  nome: string;
  descricao?: string;
  endereco?: string;
  residuos: string[];
  localizacao: GeoPoint;
  fotoUrl?: string | null;
  criadoPor: string;
  criadoPorDisplay?: string | null;
  status: PontoRecolhaStatus; // "pendente" na criação
};

export type PontoRecolhaDoc = PontoRecolhaCreate & {
  id: string;
  dataCriacao?: any;
  dataAtualizacao?: any;
};

const pontoRecolhaCol = collection(db, 'pontoRecolha');

/** Create */
export async function addPontoRecolha(data: PontoRecolhaCreate): Promise<string> {
  const docRef = await addDoc(pontoRecolhaCol, {
    ...data,
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  });
  return docRef.id;
}

/** Shape usado pelo ecrã do mapa (HomeUser) */
export type PontoMarker = {
  id: string;
  nome: string;
  tipos: string[];         // mapeado de 'residuos'
  latitude: number;
  longitude: number;
  classificacao?: number;  // opcional
  morada?: string;         // mapeado de 'endereco'
  descricao?: string;
  fotoUrl?: string | null;
  status: PontoRecolhaStatus;
};

/** Converte documento Firestore -> shape para o mapa */
export function mapPontoToMarker(d: PontoRecolhaDoc): PontoMarker | null {
  if (!d?.localizacao) return null;
  return {
    id: d.id,
    nome: d.nome,
    tipos: Array.isArray(d.residuos) ? d.residuos : [],
    latitude: d.localizacao.latitude,
    longitude: d.localizacao.longitude,
    classificacao: undefined,
    morada: d.endereco,
    descricao: d.descricao,
    fotoUrl: d.fotoUrl ?? null,
    status: d.status,
  };
}

/** Subscrição em tempo-real aos pontos (com filtro por status) */
export function subscribePontosRecolha(args: {
  statusEq?: PontoRecolhaStatus;
  statusIn?: PontoRecolhaStatus[];   // máx 10 valores
  onData: (markers: PontoMarker[]) => void;
}): Unsubscribe {
  const { statusEq, statusIn, onData } = args;

  let qy = query(pontoRecolhaCol);
  if (statusEq) qy = query(qy, where('status', '==', statusEq));
  if (statusIn && statusIn.length > 0) qy = query(qy, where('status', 'in', statusIn));
  qy = query(qy, orderBy('dataCriacao', 'desc'));

  return onSnapshot(qy, (snap) => {
    const list: PontoMarker[] = [];
    snap.forEach((docSnap) => {
      const raw = { id: docSnap.id, ...(docSnap.data() as any) } as PontoRecolhaDoc;
      const marker = mapPontoToMarker(raw);
      if (marker) list.push(marker);
    });
    onData(list);
  });
}

/** Lê uma única vez um ponto por ID e mapeia para o shape do mapa */
export async function getPontoRecolhaById(id: string): Promise<PontoMarker | null> {
  const dref = doc(pontoRecolhaCol, id);
  const snap = await getDoc(dref);
  if (!snap.exists()) return null;
  const raw = { id: snap.id, ...(snap.data() as any) } as PontoRecolhaDoc;
  return mapPontoToMarker(raw);
}

/** Subscreve em tempo-real a um ponto por ID (detalhes) */
export function subscribePontoRecolhaById(
  id: string,
  cb: (ponto: PontoMarker | null) => void
): Unsubscribe {
  const dref = doc(pontoRecolhaCol, id);
  return onSnapshot(dref, (snap) => {
    if (!snap.exists()) return cb(null);
    const raw = { id: snap.id, ...(snap.data() as any) } as PontoRecolhaDoc;
    cb(mapPontoToMarker(raw));
  });
}

// ===================== REPORTES =====================

export type ReporteStatus = 'aberto' | 'em_analise' | 'resolvido' | 'rejeitado';

export type ReporteCreate = {
  pontoId: string;                 // doc.id do pontoRecolha
  tipo: string;                    // 'cheio' | 'partido' | ...
  descricao: string;
  fotoUrl?: string | null;
  criadoPor: string;               // uid
  criadoPorDisplay?: string | null;
  status: ReporteStatus;           // 'aberto' na criação
};

export type ReporteDoc = ReporteCreate & {
  id: string;
  dataCriacao?: any;
  dataAtualizacao?: any;
};

const reportesCol = collection(db, 'reportes');

/** Cria um reporte */
export async function addReporte(data: ReporteCreate): Promise<string> {
  const ref = await addDoc(reportesCol, {
    ...data,
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  });
  return ref.id;
}

// ===================== STATS POR UTILIZADOR =====================

export type UserStats = {
  pontosCriados: number; // nº de documentos em /pontoRecolha com criadoPor == uid
  reportes: number;      // nº de documentos em /reportes com criadoPor == uid
};

/** Leitura única das contagens */
export async function getUserStats(uid: string): Promise<UserStats> {
  const pSnap = await getDocs(query(pontoRecolhaCol, where('criadoPor', '==', uid)));
  const rSnap = await getDocs(query(reportesCol, where('criadoPor', '==', uid)));
  return { pontosCriados: pSnap.size, reportes: rSnap.size };
}

/** Subscrição em tempo-real às contagens de pontos + reportes (callback recebe a combinação) */
export function subscribeUserStats(uid: string, cb: (stats: UserStats) => void): Unsubscribe {
  let current: UserStats = { pontosCriados: 0, reportes: 0 };

  const emit = () => cb({ ...current });

  const unsubPontos = onSnapshot(
    query(pontoRecolhaCol, where('criadoPor', '==', uid)),
    (snap) => {
      current.pontosCriados = snap.size;
      emit();
    }
  );

  const unsubReportes = onSnapshot(
    query(reportesCol, where('criadoPor', '==', uid)),
    (snap) => {
      current.reportes = snap.size;
      emit();
    }
  );

  return () => {
    unsubPontos();
    unsubReportes();
  };
}
