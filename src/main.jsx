import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { LocaleProvider } from './context/LocaleContext';
import { LanguageProvider } from './context/LanguageContext';

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <AuthProvider>
      <LocationProvider>
        <LocaleProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </LocaleProvider>
      </LocationProvider>
    </AuthProvider>
  </HelmetProvider>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
