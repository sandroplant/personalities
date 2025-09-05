import { AxiosInstance } from "axios";

// Lazy import to avoid hard coupling if api.ts shape differs
let api: AxiosInstance | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  api = require("./api").default || require("./api").api || null;
} catch (_) {
  api = null;
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

export async function fetchEvaluationSummary(subjectId: number): Promise<EvaluationSummary> {
  const path = `/evaluations/summary-v2/?subject_id=${encodeURIComponent(subjectId)}`;
  if (api) {
    const res = await api.get(path);
    return res.data as EvaluationSummary;
  }
  // Fallback to fetch if axios instance is not available
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch evaluation summary: ${res.status}`);
  }
  return (await res.json()) as EvaluationSummary;
}

