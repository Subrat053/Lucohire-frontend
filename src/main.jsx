import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { LanguageProvider } from './context/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <AuthProvider>
      <AdminAuthProvider>
        <LocaleProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </LocaleProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </GoogleOAuthProvider>,
);
