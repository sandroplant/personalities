import axios from "axios";

// Resolve base URL in the browser without assuming a global `process`.
// Priority:
// 1) window.__API_URL__ if set by index.html/webpack DefinePlugin
// 2) same-origin relative paths (dev server proxy or deployed behind same host)
function getBaseUrl(): string {
  try {
    if (typeof window !== "undefined" && (window as any).__API_URL__) {
      const v = (window as any).__API_URL__;
      if (typeof v === "string") return v;
    }
  } catch (_) {
    // ignore
  }
  // Use same-origin (webpack devServer proxy handles / to backend in dev)
  return "";
}

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// CSRF defaults for Django
api.defaults.xsrfCookieName = 'csrftoken';
api.defaults.xsrfHeaderName = 'X-CSRFToken';

// Prime CSRF cookie (safe no-op if already set); ignore failures to avoid blocking render
try {
  api.get('/auth/csrf/').catch(() => {});
} catch (_) {}

export default api;
export { api };
