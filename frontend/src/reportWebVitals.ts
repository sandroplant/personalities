// src/reportWebVitals.ts

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

// Function to send metrics to Django backend
function sendToAnalytics(metric: Metric) {
  fetch('/api/v1/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
  }).catch((error) => console.error('Error sending metric:', error));
}

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }

  // Also send metrics to backend
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};

export default reportWebVitals;
