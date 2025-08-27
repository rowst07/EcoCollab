// services/FirestoreService.ts
import { User } from 'firebase/auth';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
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
  status?: 'active' | 'inactive';
  deactivatedAt?: any | null; // serverTimestamp() quando inativado
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
    status: 'active',
    deactivatedAt: null,
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
  data: Partial<Pick<UserMinimalDoc, 'nome' | 'email' | 'morada' | 'status' | 'deactivatedAt'>>
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
  dataNasc?: string; // YYYY-MM-DD
};

/** Atualiza campos “extras” do perfil (sem mexer em role/id/dataCriacao). */
export async function updateUserExtrasDoc(uid: string, extras: UserExtras) {
  await updateDoc(userRef(uid), {
    ...extras,
    dataAtualizacao: serverTimestamp(),
  });
}

/** Subscrição em tempo-real ao doc do utilizador autenticado (helpers existentes). */
export function subscribeUserDoc(
  uid: string,
  callback: (data: (UserMinimalDoc & UserExtras) | null) => void
): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserMinimalDoc & UserExtras) : null);
  });
}

/** Subscrição em tempo real à LISTA de utilizadores (ordenada por nome) — só leitura. */
export function subscribeUsers(
  onData: (users: (UserMinimalDoc & UserExtras)[]) => void
): Unsubscribe {
  const colRef = collection(db, 'users');
  const qy = query(colRef, orderBy('nome', 'asc'));
  return onSnapshot(qy, (snap) => {
    const list = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) }) as UserMinimalDoc & UserExtras
    );
    onData(list);
  });
}

/** Subscrição em tempo real ao PERFIL de um utilizador por ID — só leitura. */
export function subscribeUserById(
  uid: string,
  onData: (user: (UserMinimalDoc & UserExtras) | null) => void
): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => {
    onData(snap.exists() ? (({ id: snap.id, ...(snap.data() as any) }) as UserMinimalDoc & UserExtras) : null);
  });
}

/** (Opcional) Leitura única de TODOS os utilizadores, ordenados por nome — útil para pré-carregar. */
export async function getAllUsersOnce(): Promise<(UserMinimalDoc & UserExtras)[]> {
  const colRef = collection(db, 'users');
  const qy = query(colRef, orderBy('nome', 'asc'));
  const s = await getDocs(qy);
  return s.docs.map(
    (d) => ({ id: d.id, ...(d.data() as any) }) as UserMinimalDoc & UserExtras
  );
}

/** Marca a conta como inativa (não apaga) */
export async function deactivateAccount(uid: string) {
  await updateDoc(userRef(uid), {
    status: 'inactive',
    deactivatedAt: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  });
}

/** Guard simples: dispara callback quando status === 'inactive' */
export function subscribeUserInactiveGuard(uid: string, onInactive: () => void): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => {
    if (!snap.exists()) return;
    const d = snap.data() as UserMinimalDoc;
    if (d.status === 'inactive') onInactive?.();
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
  favoritos?: string[];       // UIDs que marcaram favorito
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
    favoritos: Array.isArray(data.favoritos) ? data.favoritos : [],
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  });
  return docRef.id;
}

/** 🔹 helper de ref para documento de ponto */
export function pontoRecolhaDocRef(id: string) {
  return doc(pontoRecolhaCol, id);
}

/** 🔹 UPDATE parcial de ponto  */
export async function updatePontoRecolha(
  id: string,
  data: Partial<PontoRecolhaCreate> & { status?: PontoRecolhaStatus } & {
    // opcionalmente aceitar localizacao como objeto com lat/lng
    localizacao?: GeoPoint | { latitude: number; longitude: number };
  }
) {
  let patch: any = { ...data, dataAtualizacao: serverTimestamp() };

  // aceitar localizacao como { latitude, longitude } e converter para GeoPoint
  if (data.localizacao && !(data.localizacao instanceof GeoPoint)) {
    const loc = data.localizacao as any;
    if (
      typeof loc?.latitude === 'number' &&
      typeof loc?.longitude === 'number'
    ) {
      patch.localizacao = new GeoPoint(loc.latitude, loc.longitude);
    }
  }

  await updateDoc(pontoRecolhaDocRef(id), patch);
}

/** 🔹 DELETE ponto */
export async function deletePontoRecolha(id: string) {
  await deleteDoc(pontoRecolhaDocRef(id));
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
  favoritos?: string[];    // <<— exposto também no marker
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
    favoritos: d.favoritos ?? [],
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

/** Subscreve em tempo-real a um ponto por ID (detalhes) -> shape marker */
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

/** 🔹 Lê uma única vez o DOC COMPLETO do ponto (não mapeado) */
export async function getPontoRecolhaFullById(id: string): Promise<PontoRecolhaDoc | null> {
  const dref = doc(pontoRecolhaCol, id);
  const snap = await getDoc(dref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as PontoRecolhaDoc;
}

/** 🔹 Subscrição ao DOC COMPLETO do ponto (não mapeado) */
export function subscribePontoRecolhaFullById(
  id: string,
  cb: (doc: PontoRecolhaDoc | null) => void
): Unsubscribe {
  const dref = doc(pontoRecolhaCol, id);
  return onSnapshot(dref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...(snap.data() as any) } as PontoRecolhaDoc);
  });
}

/** 🔹 Favoritos: adiciona/remove o uid do array `favoritos` de um ponto */
export async function updatePontoFavorito(id: string, uid: string, fav: boolean) {
  const dref = doc(pontoRecolhaCol, id);
  await updateDoc(dref, {
    favoritos: fav ? arrayUnion(uid) : arrayRemove(uid),
    dataAtualizacao: serverTimestamp(),
  });
}

/** 🔹 Lista em tempo real de pontos favoritos de um utilizador */
export function subscribePontosFavoritos(
  uid: string,
  onData: (list: PontoRecolhaDoc[]) => void
): Unsubscribe {
  const qy = query(pontoRecolhaCol, where('favoritos', 'array-contains', uid), orderBy('dataCriacao', 'desc'));
  return onSnapshot(qy, (snap) => {
    const list: PontoRecolhaDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as PontoRecolhaDoc));
    onData(list);
  });
}



// ===================== REPORTES =====================

export type ReporteStatus = 'pendente' | 'aprovado' | 'reprovado';

export type ReporteCreate = {
  pontoId: string;                 // doc.id do pontoRecolha
  tipo: string;                    // 'cheio' | 'partido' | ...
  descricao: string;
  fotoUrl?: string | null;
  criadoPor: string;               // uid
  criadoPorDisplay?: string | null;
  status: ReporteStatus;           // 'pendente' na criação
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

/** LISTA em tempo real de reportes (suporta statusEq e statusIn) */
export function subscribeReportes(args: {
  statusEq?: ReporteStatus;                 // igualdade (leve; ideal p/ KPIs)
  statusIn?: ReporteStatus[];               // lista de estados
  onData: (items: (ReporteDoc & { id: string })[]) => void;
  onError?: (e: any) => void;
}): Unsubscribe {
  const { statusEq, statusIn, onData, onError } = args;

  let qy = query(reportesCol);
  if (statusEq) {
    qy = query(qy, where('status', '==', statusEq));
  } else if (statusIn && statusIn.length) {
    qy = query(qy, where('status', 'in', statusIn));
  }
  qy = query(qy, orderBy('dataCriacao', 'desc'));

  return onSnapshot(
    qy,
    (snap) => {
      const list = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) })
      ) as (ReporteDoc & { id: string })[];
      onData(list);
    },
    (err) => {
      console.error('[subscribeReportes] onSnapshot error:', err);
      onError?.(err);
    }
  );
}

/** DETALHE do reporte em tempo real */
export function subscribeReporteById(
  id: string,
  cb: (d: (ReporteDoc & { id: string }) | null) => void
): Unsubscribe {
  const ref = doc(reportesCol, id);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...(snap.data() as any) } as ReporteDoc & { id: string });
  });
}

/** Atualizar ESTADO do reporte */
export async function updateReporteStatus(id: string, status: ReporteStatus) {
  const ref = doc(reportesCol, id);
  await updateDoc(ref, { status, dataAtualizacao: serverTimestamp() });
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



// ===================== RETOMAS =====================

export type RetomaEstado = 'Ativa' | 'Reservada' | 'Concluída';

export type RetomaCreate = {
  nome: string;
  tipo: 'Doação' | 'Troca' | string;
  pontos: number;
  icon?: string;
  descricao?: string;
  fotoUrl?: string | null;
  quantidade?: string;
  condicao?: 'Novo' | 'Como novo' | 'Usado' | 'Para reciclar' | string;
  entrega?: 'Levantamento' | 'Entrega a combinar' | 'Envio' | string;
  local?: string;
  lat?: number | null;
  lng?: number | null;
  preferencias?: string;
  tags?: string[];
  validade?: string | null;
  estado: RetomaEstado;
  criadoPor: string;               // uid
  criadoPorDisplay?: string | null;
  contacto?: string | null;

  /** UIDs dos utilizadores que marcaram esta retoma como favorita */
  favoritos?: string[];
};

export type RetomaDoc = RetomaCreate & {
  id: string;
  dataCriacao?: any;
  dataAtualizacao?: any;
};

const retomasCol = collection(db, 'retomas');

/** Remove chaves com undefined (Firestore não aceita undefined) */
function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const copy: any = {};
  Object.keys(obj).forEach((k) => {
    const v = (obj as any)[k];
    if (v !== undefined) copy[k] = v;
  });
  return copy;
}

/** Create */
export async function addRetoma(data: RetomaCreate): Promise<string> {
  const cleaned = pruneUndefined({
    ...data,
    fotoUrl: data.fotoUrl ?? null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    validade: data.validade ?? null,
    contacto: data.contacto ?? null,
    favoritos: Array.isArray(data.favoritos) ? data.favoritos : [], // inicializa favoritos
    dataCriacao: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
  });
  const ref = await addDoc(retomasCol, cleaned);
  return ref.id;
}

/** Update (owner ou mod/admin pelas rules) */
export async function updateRetomaDoc(id: string, patch: Partial<RetomaCreate>) {
  const cleaned = pruneUndefined({
    ...patch,
    dataAtualizacao: serverTimestamp(),
  });
  const dref = doc(retomasCol, id);
  await updateDoc(dref, cleaned);
}

export function subscribeRetomasDisponiveis(args: {
  onData: (list: RetomaDoc[]) => void;
}): Unsubscribe {
  let qy = query(retomasCol, where('estado', '==', 'Ativa'), orderBy('dataCriacao', 'desc'));
  return onSnapshot(qy, (snap) => {
    const list: RetomaDoc[] = [];
    snap.forEach((docSnap) => {
      const d = { id: docSnap.id, ...(docSnap.data() as any) } as RetomaDoc;
      list.push(d);
    });
    args.onData(list);
  });
}

/** Subscrição: minhas retomas por UID, ordenadas por dataCriacao desc */
export function subscribeMinhasRetomas(args: {
  uid: string;
  onData: (list: RetomaDoc[]) => void;
}): Unsubscribe {
  let qy = query(retomasCol, where('criadoPor', '==', args.uid), orderBy('dataCriacao', 'desc'));
  return onSnapshot(qy, (snap) => {
    const list: RetomaDoc[] = [];
    snap.forEach((docSnap) => {
      const d = { id: docSnap.id, ...(docSnap.data() as any) } as RetomaDoc;
      list.push(d);
    });
    args.onData(list);
  });
}

/** Subscreve em tempo-real uma retoma por ID */
export function subscribeRetomaById(
  id: string,
  cb: (d: RetomaDoc | null) => void
): Unsubscribe {
  const dref = doc(retomasCol, id);
  return onSnapshot(dref, (snap) => {
    if (!snap.exists()) return cb(null);
    const raw = { id: snap.id, ...(snap.data() as any) } as RetomaDoc;
    cb(raw);
  });
}

// edita/atualiza apenas campos parciais permitidos pelas rules
export async function updateRetomaPartial(id: string, data: Partial<RetomaDoc>) {
  const dref = doc(retomasCol, id);
  const patch = {
    ...data,
    dataAtualizacao: serverTimestamp(),
  };
  await updateDoc(dref, patch as any);
}

/** 🔹 Favoritos: adiciona/remove o uid do array `favoritos` de uma retoma */
export async function updateRetomaFavorite(id: string, uid: string, fav: boolean) {
  const dref = doc(retomasCol, id);
  await updateDoc(dref, {
    favoritos: fav ? arrayUnion(uid) : arrayRemove(uid),
    dataAtualizacao: serverTimestamp(),
  });
}

/** 🔹 Lista em tempo real de retomas favoritas de um utilizador */
export function subscribeUserFavorites(uid: string, onData: (list: RetomaDoc[]) => void): Unsubscribe {
  const qy = query(retomasCol, where('favoritos', 'array-contains', uid), orderBy('dataCriacao', 'desc'));
  return onSnapshot(qy, (snap) => {
    const list: RetomaDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as RetomaDoc));
    onData(list);
  });
}

// utilitário simples para saber o role atual do utilizador
export async function getUserRole(uid: string): Promise<Role> {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return 'user';
  const data = snap.data() as any;
  return (data.role ?? 'user') as Role;
}
