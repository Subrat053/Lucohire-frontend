import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { LocaleProvider } from './context/LocaleContext';
import { LanguageProvider } from './context/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
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
  </GoogleOAuthProvider>,
);
