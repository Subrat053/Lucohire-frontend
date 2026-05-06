import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authAPI, userAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useLocale } from './LocaleContext';
import en from '../translations/en.json';

const DEFAULT_LANGUAGE = 'en';
const RTL_LANGUAGES = new Set(['ar', 'ur']);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'zh', label: 'Chinese (简体中文)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'ru', label: 'Russian (Русский)' },
  { code: 'pt', label: 'Portuguese (Português)' },
  { code: 'id', label: 'Indonesian (Bahasa Indonesia)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
];

const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((item) => item.code));
const translationLoaders = import.meta.glob('../translations/*.json');

const LanguageContext = createContext(null);

const normalizeLanguage = (value) => {
  if (!value) return DEFAULT_LANGUAGE;
  return SUPPORTED_LANGUAGE_CODES.has(value) ? value : DEFAULT_LANGUAGE;
};

const applyTemplate = (text, params) => {
  if (!params || typeof text !== 'string') return text;
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, String(value));
  }, text);
};

const loadDictionary = async (language) => {
  const loader = translationLoaders[`../translations/${language}.json`] || translationLoaders[`../translations/${DEFAULT_LANGUAGE}.json`];
  const module = await loader();
  return module.default || {};
};

export const LanguageProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { locale, switchLocale } = useLocale();

  const [language, setLanguage] = useState(() => {
    const persisted = localStorage.getItem('appLanguage') || localStorage.getItem('locale_lang') || locale || DEFAULT_LANGUAGE;
    return normalizeLanguage(persisted);
  });
  const [dictionary, setDictionary] = useState(en);
  const [loading, setLoading] = useState(false);
  const pendingLanguage = useRef(language);

  const persistLanguage = useCallback((nextLanguage) => {
    localStorage.setItem('appLanguage', nextLanguage);
    localStorage.setItem('locale_lang', nextLanguage);
  }, []);

  const syncBackendPreference = useCallback(async (nextLanguage) => {
    if (!isAuthenticated) return;
    try {
      await userAPI.updateLanguage({ language: nextLanguage });
    } catch (_) {
      try {
        await authAPI.updateLocale({ locale: nextLanguage });
      } catch (__){
        // Keep UI responsive even if API update fails.
      }
    }
    try {
      const rawUser = localStorage.getItem('authUser') || localStorage.getItem('user');
      if (!rawUser) return;
      const parsedUser = JSON.parse(rawUser);
      localStorage.setItem('authUser', JSON.stringify({
        ...parsedUser,
        locale: nextLanguage,
        preferredLanguage: nextLanguage,
      }));
    } catch (_) {
      // Ignore local cache update issues.
    }
  }, [isAuthenticated]);

  const changeLanguage = useCallback(async (nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    pendingLanguage.current = normalized;
    setLanguage(normalized);
    persistLanguage(normalized);
    switchLocale(normalized);
    syncBackendPreference(normalized);
  }, [persistLanguage, switchLocale, syncBackendPreference]);

  useEffect(() => {
    if (!locale) return;
    const normalized = normalizeLanguage(locale);
    if (normalized === language) return;
    setLanguage(normalized);
    persistLanguage(normalized);
  }, [locale]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const loaded = await loadDictionary(language);
        if (!mounted || pendingLanguage.current !== language) return;
        setDictionary({ ...en, ...loaded });
      } catch (_) {
        if (!mounted) return;
        setDictionary(en);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';

    return () => {
      mounted = false;
    };
  }, [language]);

  const t = useCallback((key, params) => {
    const value = dictionary[key] ?? en[key] ?? key;
    return applyTemplate(value, params);
  }, [dictionary]);

  const value = useMemo(() => ({
    language,
    languages: SUPPORTED_LANGUAGES,
    loading,
    changeLanguage,
    t,
    isRTL: RTL_LANGUAGES.has(language),
  }), [language, loading, changeLanguage, t]);

  return createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export default LanguageContext;
