import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authAPI, translationAPI, userAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useLocale } from './LocaleContext';
import en from '../translations/en.json';

const DEFAULT_LANGUAGE = 'en';
const RTL_LANGUAGES = new Set(['ar']);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'ar', label: 'Arabic (العربية)' },
];

const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((item) => item.code));
const ENGLISH_DICTIONARY = en;

const LanguageContext = createContext(null);

const normalizeLanguage = (value) => {
  if (!value) return DEFAULT_LANGUAGE;
  const normalized = String(value).trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGE_CODES.has(normalized) ? normalized : DEFAULT_LANGUAGE;
};

const applyTemplate = (text, params) => {
  if (!params || typeof text !== 'string') return text;
  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, String(value));
  }, text);
};

const shouldSkipTranslation = (text) => {
  const value = String(text || '').trim();
  if (!value) return true;
  if (value.length <= 1) return true;
  if (!/[\p{L}]/u.test(value)) return true;
  if (/^https?:\/\//i.test(value) || /^www\./i.test(value)) return true;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value)) return true;
  if (/^[\d\s()+\-.,/:%₹$€£¥]+$/.test(value)) return true;
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return true;
  if (/^[A-Za-z0-9_-]{8,}$/.test(value) && !/[\s]/.test(value)) return true;
  return false;
};

const getFallbackText = (key, fallbackText) => {
  if (typeof fallbackText === 'string' && fallbackText.trim()) {
    return fallbackText;
  }
  return ENGLISH_DICTIONARY[key] || key;
};

const isAdminPath = () => {
  return window.location.pathname.startsWith('/admin');
};

export const LanguageProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { locale, switchLocale } = useLocale();

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const persisted = localStorage.getItem('selectedLanguage') || localStorage.getItem('appLanguage') || localStorage.getItem('locale_lang') || locale || DEFAULT_LANGUAGE;
    return normalizeLanguage(persisted);
  });
  const [translationCache, setTranslationCache] = useState({});
  const [loading, setLoading] = useState(false);
  const pendingTranslationsRef = useRef(new Map());
  const failedTranslationsRef = useRef(new Map());

  const persistLanguage = useCallback((nextLanguage) => {
    localStorage.setItem('selectedLanguage', nextLanguage);
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
    pendingTranslationsRef.current.delete(normalized);
    failedTranslationsRef.current.delete(normalized);
    setSelectedLanguage(normalized);
    persistLanguage(normalized);
    switchLocale(normalized);
    syncBackendPreference(normalized);
  }, [persistLanguage, switchLocale, syncBackendPreference]);

  const scheduleTranslation = useCallback((text) => {
    if (selectedLanguage === DEFAULT_LANGUAGE) return;
    if (isAdminPath()) return;
    if (shouldSkipTranslation(text)) return;
    if ((translationCache[selectedLanguage] || {})[text]) return;
    if ((failedTranslationsRef.current.get(selectedLanguage) || new Set()).has(text)) return;

    let languageQueue = pendingTranslationsRef.current.get(selectedLanguage);
    if (!languageQueue) {
      languageQueue = new Set();
      pendingTranslationsRef.current.set(selectedLanguage, languageQueue);
    }

    languageQueue.add(text);
  }, [selectedLanguage, translationCache]);

  const updateTranslationCache = useCallback((language, sourceTexts, translatedTexts) => {
    setTranslationCache((previous) => {
      const currentLanguageCache = previous[language] || {};
      const nextLanguageCache = { ...currentLanguageCache };

      sourceTexts.forEach((text, index) => {
        const translatedText = translatedTexts[index];
        if (text && translatedText && translatedText !== text) {
          nextLanguageCache[text] = translatedText;
        }
      });

      return {
        ...previous,
        [language]: nextLanguageCache,
      };
    });
  }, []);

  const translateBatch = useCallback(async (textArray = [], targetLanguage = selectedLanguage) => {
    const normalizedLanguage = normalizeLanguage(targetLanguage);
    const sourceTexts = Array.isArray(textArray) ? textArray.map((item) => String(item ?? '')) : [];

    if (normalizedLanguage === DEFAULT_LANGUAGE) {
      return sourceTexts;
    }

    const cachedLanguage = translationCache[normalizedLanguage] || {};
    const output = [...sourceTexts];
    const missingTexts = [];
    const missingIndexesByText = new Map();

    sourceTexts.forEach((text, index) => {
      if (!text || shouldSkipTranslation(text)) {
        output[index] = text;
        return;
      }

      const cachedValue = cachedLanguage[text];
      if (cachedValue) {
        output[index] = cachedValue;
        return;
      }

      if (!missingIndexesByText.has(text)) {
        missingIndexesByText.set(text, []);
        missingTexts.push(text);
      }
      missingIndexesByText.get(text).push(index);
    });

    if (missingTexts.length === 0) {
      return output;
    }

    try {
      // Chunk missing texts in batches of 100 to avoid backend validation limits
      const BATCH_SIZE = 100;
      const allTranslatedTexts = [];

      for (let i = 0; i < missingTexts.length; i += BATCH_SIZE) {
        const chunk = missingTexts.slice(i, i + BATCH_SIZE);
        const { data } = await translationAPI.translateBatch({
          texts: chunk,
          targetLanguage: normalizedLanguage,
        });
        const chunkResults = data?.data?.translatedTexts || data?.translatedTexts || [];
        
        // Ensure we handle cases where backend might return fewer results than requested
        // but normally it should match the chunk length.
        allTranslatedTexts.push(...chunkResults);
      }

      updateTranslationCache(normalizedLanguage, missingTexts, allTranslatedTexts);

      missingTexts.forEach((text, index) => {
        const translatedText = allTranslatedTexts[index] || text;
        const targetIndexes = missingIndexesByText.get(text) || [];
        targetIndexes.forEach((itemIndex) => {
          output[itemIndex] = translatedText;
        });
      });

      return output;
    } catch (error) {
      const failedQueue = failedTranslationsRef.current.get(normalizedLanguage) || new Set();
      missingTexts.forEach((text) => failedQueue.add(text));
      failedTranslationsRef.current.set(normalizedLanguage, failedQueue);
      return output;
    }
  }, [selectedLanguage, translationCache, updateTranslationCache]);

  const translateText = useCallback(async (text, targetLanguage = selectedLanguage) => {
    if (isAdminPath()) return text;
    const [translatedText] = await translateBatch([text], targetLanguage);
    return translatedText;
  }, [selectedLanguage, translateBatch]);

  useEffect(() => {
    if (!locale) return;
    const normalized = normalizeLanguage(locale);
    if (normalized === selectedLanguage) return;
    setSelectedLanguage(normalized);
    persistLanguage(normalized);
  }, [locale, persistLanguage, selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage === DEFAULT_LANGUAGE) {
      document.documentElement.lang = DEFAULT_LANGUAGE;
      document.documentElement.dir = 'ltr';
      return undefined;
    }

    const queue = pendingTranslationsRef.current.get(selectedLanguage);
    if (!queue || queue.size === 0) {
      document.documentElement.lang = selectedLanguage;
      document.documentElement.dir = RTL_LANGUAGES.has(selectedLanguage) ? 'rtl' : 'ltr';
      return undefined;
    }

    let cancelled = false;
    const texts = [...queue];
    queue.clear();

    const run = async () => {
      setLoading(true);
      try {
        await translateBatch(texts, selectedLanguage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    document.documentElement.lang = selectedLanguage;
    document.documentElement.dir = RTL_LANGUAGES.has(selectedLanguage) ? 'rtl' : 'ltr';

    run();

    return () => {
      cancelled = true;
    };
  });

  const t = useCallback((key, fallbackOrParams, maybeParams) => {
    let fallbackText = '';
    let params = null;

    if (typeof fallbackOrParams === 'string' || typeof fallbackOrParams === 'number') {
      fallbackText = String(fallbackOrParams);
      params = maybeParams || null;
    } else if (fallbackOrParams && typeof fallbackOrParams === 'object' && !Array.isArray(fallbackOrParams)) {
      params = fallbackOrParams;
    }

    const baseText = getFallbackText(key, fallbackText);

    if (selectedLanguage === DEFAULT_LANGUAGE || isAdminPath()) {
      return applyTemplate(baseText, params);
    }

    const cachedLanguage = translationCache[selectedLanguage] || {};
    const cachedValue = cachedLanguage[baseText];

    if (cachedValue) {
      return applyTemplate(cachedValue, params);
    }

    scheduleTranslation(baseText);
    return applyTemplate(baseText, params);
  }, [scheduleTranslation, selectedLanguage, translationCache]);

  const value = useMemo(() => ({
    selectedLanguage,
    setSelectedLanguage: changeLanguage,
    language: selectedLanguage,
    languages: SUPPORTED_LANGUAGES,
    loading,
    changeLanguage,
    translateText,
    translateBatch,
    t,
    isRTL: RTL_LANGUAGES.has(selectedLanguage),
  }), [selectedLanguage, loading, changeLanguage, t, translateBatch, translateText]);

  return createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export default LanguageContext;
