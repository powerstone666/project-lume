import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import Context from './StateManager/Context.js';
import { registerSW } from 'virtual:pwa-register';

// Ensure the PWA service worker is registered so browsers can recognize the app as installable.
const registerServiceWorker = () => {
  try {
    const unregister = registerSW({
      immediate: true,
      onRegistered: (r) => console.log('Service worker registered', r?.scope),
      onRegisterError: (err) => console.error('Service worker registration failed', err),
    });

    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready
        .then((reg) => console.log('Service worker ready', reg.scope))
        .catch((err) => console.error('Service worker ready rejected', err));
    }

    return unregister;
  } catch (err) {
    console.error('Service worker registration threw', err);
    return undefined;
  }
};

// Quick diagnostics to verify manifest is reachable (needed for beforeinstallprompt).
const verifyManifest = async () => {
  try {
    const res = await fetch('/manifest.webmanifest', { cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const manifest = await res.json();
    console.log('Manifest loaded', manifest.name, manifest.start_url);
  } catch (err) {
    console.error('Unable to load manifest.webmanifest', err);
  }
};

registerServiceWorker();
verifyManifest();


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={Context}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
