// src/types/web-vitals.d.ts

declare module 'web-vitals' {
  export interface Metric {
    name: string;
    value: number;
    delta: number;
    id: string;
    entries: PerformanceEntry[];
    navigationType?: string;
  }

  export function getCLS(onReport: (metric: Metric) => void): void;
  export function getFID(onReport: (metric: Metric) => void): void;
  export function getFCP(onReport: (metric: Metric) => void): void;
  export function getLCP(onReport: (metric: Metric) => void): void;
  export function getTTFB(onReport: (metric: Metric) => void): void;
}
