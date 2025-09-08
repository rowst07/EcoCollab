// services/ai/ImageClassifier.native.ts
import '@tensorflow/tfjs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { mapLabel, TipoResiduo } from '../ai/labelMap';

type MobilenetModule = typeof import('@tensorflow-models/mobilenet');
let mobilenet: any | null = null;
let inited = false;

export type Prediction = { label: string; prob: number };
export type ClassifyResult = {
  suggested?: { tipo: TipoResiduo; confidence: number };
  raw: Prediction[];
};

async function ensureReady() {
  if (!inited) {
    await tf.ready();
    if (tf.getBackend() !== 'rn-webgl') {
      await tf.setBackend('rn-webgl'); // GPU backend no RN
      await tf.ready();
    }
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
  return decodeJpeg(u8); // [h,w,3]
}

export async function classifyImage(uri: string, topK = 5): Promise<ClassifyResult> {
  await ensureReady();
  const img = await uriToTensor(uri);
  // @ts-ignore mobilenet typings via shim
  const preds = (await mobilenet.classify(img, topK)) as Array<{
    className: string;
    probability: number;
  }>;
  img.dispose?.();

  const raw: Prediction[] = preds.map(p => ({ label: p.className, prob: p.probability }));

  const scores: Record<TipoResiduo, number> = {
    vidro: 0, papel: 0, plastico: 0, metal: 0, pilhas: 0, organico: 0
  };
  for (const p of raw) {
    const m = mapLabel(p.label);
    if (m.tipo) scores[m.tipo] += m.score * p.prob;
  }

  let best: { tipo: TipoResiduo | null; score: number } = { tipo: null, score: 0 };
  (Object.keys(scores) as TipoResiduo[]).forEach(t => {
    if (scores[t] > best.score) best = { tipo: t, score: scores[t] };
  });

  const suggested = best.tipo ? { tipo: best.tipo, confidence: Math.min(1, best.score) } : undefined;
  return { suggested, raw };
}

export async function warmupClassifier() {
  try { await ensureReady(); } catch {}
}
