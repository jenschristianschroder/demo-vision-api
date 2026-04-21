import { VisionResult } from '../types';

const API_BASE = '/api/vision';

export async function analyzeImage(
  imageBase64: string,
  features: string[],
  smartCropsAspectRatios?: number[],
): Promise<VisionResult> {
  const body: Record<string, unknown> = { image: imageBase64, features };
  if (smartCropsAspectRatios?.length) {
    body.smartCropsAspectRatios = smartCropsAspectRatios;
  }

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error || `API error ${res.status}`);
  }

  return res.json() as Promise<VisionResult>;
}

export async function analyzeAdultContent(
  imageBase64: string,
): Promise<VisionResult> {
  const res = await fetch(`${API_BASE}/adult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error || `API error ${res.status}`);
  }

  return res.json() as Promise<VisionResult>;
}
