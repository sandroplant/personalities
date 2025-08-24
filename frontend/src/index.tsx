// frontend/src/index.tsx

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';

// Lazy load the App component
const App = lazy(() => import('./App'));

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container as HTMLElement);

root.render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);

// Log results to the console or send to an analytics endpoint
reportWebVitals(console.log);
