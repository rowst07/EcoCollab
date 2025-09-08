// services/ai/ImageClassifier.web.ts
import type { TipoResiduo } from '../ai/labelMap';

export type Prediction = { label: string; prob: number };
export type ClassifyResult = {
  suggested?: { tipo: TipoResiduo; confidence: number };
  raw: Prediction[];
};

/**
 * Stub no Web: não importa TFJS nem tfjs-react-native.
 * Devolve resultado neutro e avisa na consola.
 */
export async function classifyImage(_uri: string, _topK = 5): Promise<ClassifyResult> {
  if (typeof console !== 'undefined') {
    console.warn('[IA] classifyImage chamado no web — IA está desativada no web build.');
  }
  return { suggested: undefined, raw: [] };
}

export async function warmupClassifier() {
  // no-op no web
}
