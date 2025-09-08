import '@tensorflow/tfjs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { mapLabel, TipoResiduo } from '../ai/labelMap';

type MobilenetModule = typeof import('@tensorflow-models/mobilenet');
let mobilenet: any | null = null;
let inited = false;

export type Prediction = { label: string; prob: number };
export type ClassifyResult = {
  suggested?: { tipo: TipoResiduo; confidence: number };
  raw: Prediction[];
};

/**
 * Desativa handlers de storage do TFJS (AsyncStorage / IndexedDB / LocalStorage)
 * para evitar conflitos. Só precisa ser corrido uma vez.
 */
function disableTfStorageHandlers() {
  try {
    const ioAny = (tf.io as unknown) as {
      getLoadHandlers?: (url: unknown, onProgress?: unknown) => any[];
      getSaveHandlers?: (url: unknown) => any[];
      listModels?: () => Promise<Record<string, unknown>>;
      removeModel?: (url: string) => Promise<unknown>;
    };

    // Filtra qualquer handler com esquemas de storage local
    const stripLocal = (handlers: any[]) =>
      (handlers || []).filter((h: any) => {
        const scheme = String(h?.scheme ?? h?.[0]?.scheme ?? '').toLowerCase();
        return !/^(asyncstorage|indexeddb|localstorage)$/.test(scheme);
      });

    if (ioAny?.getLoadHandlers) {
      const orig = ioAny.getLoadHandlers.bind(tf.io);
      ioAny.getLoadHandlers = (url: unknown, onProgress?: unknown) => {
        const hs = orig(url, onProgress);
        return stripLocal(hs);
      };
    }

    if (ioAny?.getSaveHandlers) {
      const orig = ioAny.getSaveHandlers.bind(tf.io);
      ioAny.getSaveHandlers = (url: unknown) => {
        const hs = orig(url);
        return stripLocal(hs);
      };
    }

    // Impede o TFJS de “ver” modelos persistidos localmente
    if (ioAny?.listModels) {
      ioAny.listModels = async () => ({});
    }
    if (ioAny?.removeModel) {
      ioAny.removeModel = async () => ({});
    }
  } catch {
    // Se algo falhar aqui, ignoramos silenciosamente — não é crítico para a classificação
  }
}

async function ensureReady() {
  if (Platform.OS === 'web') {
    // No web, usamos um hook/ficheiro .web que devolve “não suportado”.
    throw new Error('IA indisponível no web build.');
  }
  if (!inited) {
    await tf.ready();

    // Desliga handlers de storage ANTES de carregar modelos
    disableTfStorageHandlers();

    // Força backend RN WebGL (GPU)
    if (tf.getBackend() !== 'rn-webgl') {
      await tf.setBackend('rn-webgl');
      await tf.ready();
    }

    // Carrega MobileNet
    const mb: MobilenetModule = await import('@tensorflow-models/mobilenet');
    mobilenet = await mb.load({ version: 2, alpha: 0.75 });

    inited = true;
  }
}

async function uriToTensor(uri: string) {
  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 224 } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  const base64 = manip.base64!;
  const bytes = tf.util.encodeString(base64, 'base64').buffer as ArrayBuffer;
  const u8 = new Uint8Array(bytes);
  return decodeJpeg(u8); // Tensor shape [h, w, 3]
}

export async function classifyImage(uri: string, topK = 5): Promise<ClassifyResult> {
  await ensureReady();

  const img = await uriToTensor(uri);

  // @ts-ignore — typings do mobilenet podem não expor corretamente
  const preds = (await mobilenet.classify(img, topK)) as Array<{
    className: string;
    probability: number;
  }>;

  img.dispose?.();

  const raw: Prediction[] = preds.map((p) => ({
    label: p.className,
    prob: p.probability,
  }));

  // Agrega scores por “tipo de resíduo” usando o teu mapa customizado
  const scores: Record<TipoResiduo, number> = {
    vidro: 0,
    papel: 0,
    plastico: 0,
    metal: 0,
    pilhas: 0,
    organico: 0,
  };

  for (const p of raw) {
    const m = mapLabel(p.label);
    if (m.tipo) scores[m.tipo] += m.score * p.prob;
  }

  let best: { tipo: TipoResiduo | null; score: number } = { tipo: null, score: 0 };
  (Object.keys(scores) as TipoResiduo[]).forEach((t) => {
    if (scores[t] > best.score) best = { tipo: t, score: scores[t] };
  });

  const suggested = best.tipo
    ? { tipo: best.tipo, confidence: Math.min(1, best.score) }
    : undefined;

  return { suggested, raw };
}

export async function warmupClassifier() {
  try {
    await ensureReady();
  } catch {
    // silencioso
  }
}
