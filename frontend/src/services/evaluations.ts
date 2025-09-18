import type { AxiosInstance } from 'axios';

// Lazy-load axios instance via ESM (no require())
let apiPromise: Promise<AxiosInstance | null> | null = null;
async function getApi(): Promise<AxiosInstance | null> {
  if (!apiPromise) {
    apiPromise = import('./api')
      .then((m) => (m as any).default ?? (m as any).api ?? null)
      .catch(() => null);
  }
  return apiPromise;
}

export type EvaluationSummaryItem = {
  id: number;
  name: string;
  average: number;
  count: number;
};

export type EvaluationSummary = {
  subject_id: number;
  criteria: EvaluationSummaryItem[];
};

export async function fetchEvaluationSummary(
  subjectId: number
): Promise<EvaluationSummary> {
  const path = `/evaluations/summary-v2/?subject_id=${encodeURIComponent(subjectId)}`;

  const api = await getApi();
  if (api) {
    const res = await api.get(path);
    return res.data as EvaluationSummary;
  }

  // Fallback to fetch if axios instance is not available
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Failed to fetch evaluation summary: ${res.status}`);
  }
  return (await res.json()) as EvaluationSummary;
}
