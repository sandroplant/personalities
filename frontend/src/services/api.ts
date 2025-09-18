import axios from 'axios';

// Resolve base URL without assuming process.env
function getBaseUrl(): string {
  try {
    if (typeof window !== 'undefined' && (window as any).__API_URL__) {
      const v = (window as any).__API_URL__;
      if (typeof v === 'string') return v;
    }
  } catch {
    // ignore
  }
  return ''; // same-origin; dev proxy can forward
}

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// CSRF defaults for Django
api.defaults.xsrfCookieName = 'csrftoken';
api.defaults.xsrfHeaderName = 'X-CSRFToken';

// Prime CSRF cookie best-effort (avoid no-empty & no-unused-vars)
void api.get('/auth/csrf/').catch(() => undefined);

export default api;
export { api };
