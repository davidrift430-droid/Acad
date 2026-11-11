import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/800.css';
import './ui/styles.css';
import { loadState } from './db/store';
import { App } from './App';

void loadState().then(() => {
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});

// Offline support when served over HTTP(S) as a PWA (the Android app bundles everything already).
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => undefined); });
}
