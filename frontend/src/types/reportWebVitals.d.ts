declare module 'web-vitals' {
  export function getCLS(onReport: (metric: Metric) => void): void;
  export function getFID(onReport: (metric: Metric) => void): void;
  export function getFCP(onReport: (metric: Metric) => void): void;
  export function getLCP(onReport: (metric: Metric) => void): void;
  export function getTTFB(onReport: (metric: Metric) => void): void;

  export interface Metric {
    name: string;
    value: number;
    delta: number;
    id: string;
    entries: PerformanceEntry[];
  }
}

declare module 'reportWebVitals' {
  import { Metric } from 'web-vitals';
  type ReportCallback = (metric: Metric) => void;

  const reportWebVitals: (onPerfEntry?: ReportCallback) => void;

  export default reportWebVitals;
}
