import { useState, useCallback } from 'react';
import { VisionResult } from '../types';
import { analyzeImage } from '../services/visionClient';

interface UseVisionAnalysisOptions {
  features: string[];
  smartCropsAspectRatios?: number[];
}

export function useVisionAnalysis(options: UseVisionAnalysisOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (imageBase64: string): Promise<VisionResult> => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      try {
        const r = await analyzeImage(
          imageBase64,
          options.features,
          options.smartCropsAspectRatios,
        );
        setResult(r);
        return r;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [options.features, options.smartCropsAspectRatios],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { analyze, isLoading, result, error, reset };
}
