// hooks/useImageClassifier.ts
import { classifyImage, ClassifyResult, warmupClassifier } from '@/services/ai/ImageClassifier';
import { useCallback, useEffect, useState } from 'react';

export function useImageClassifier() {
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { warmupClassifier(); }, []);

  const classify = useCallback(async (uri: string) => {
    setLoading(true); setError(null);
    try {
      const res = await classifyImage(uri);
      setLast(res);
      return res;
    } catch (e: any) {
      setError(e?.message ?? 'Falha na classificação');
      return null;
    } finally { setLoading(false); }
  }, []);

  return { loading, classify, last, error };
}
