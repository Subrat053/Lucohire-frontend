import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, localeAPI } from '../services/api';
import { useAuth } from './AuthContext';

const LocaleContext = createContext(null);

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  AED: 'د.إ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
};

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'zh', label: 'Chinese (简体中文)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'pt', label: 'Portuguese (Português)' },
  { code: 'ru', label: 'Russian (Русский)' },
  { code: 'id', label: 'Indonesian (Bahasa Indonesia)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
];

export const LocaleProvider = ({ children }) => {
  const { user } = useAuth();
  const [country, setCountry] = useState(localStorage.getItem('locale_country') || 'US');
  const [currency, setCurrency] = useState(localStorage.getItem('locale_currency') || 'USD');
  const [locale, setLocale] = useState(localStorage.getItem('locale_lang') || 'en');
  const [currencies, setCurrencies] = useState(null);

  const hasManualCurrencyOverride = () => localStorage.getItem('locale_manual_currency') === '1';
  const hasManualLanguageOverride = () => localStorage.getItem('locale_manual_lang') === '1';

  const applyLocale = (nextCountry, nextCurrency, nextLocale, options = {}) => {
    const { persistCountry = true, persistCurrency = true, persistLocale = true } = options;

    if (nextCountry) {
      setCountry(nextCountry);
      if (persistCountry) localStorage.setItem('locale_country', nextCountry);
    }
    if (nextCurrency) {
      setCurrency(nextCurrency);
      if (persistCurrency) localStorage.setItem('locale_currency', nextCurrency);
    }
    if (nextLocale) {
      setLocale(nextLocale);
      if (persistLocale) localStorage.setItem('locale_lang', nextLocale);
    }
  };

  const getBrowserDefaults = () => {
    const browserLocale = (navigator.language || 'en-IN').toUpperCase();
    if (browserLocale.endsWith('-AE')) return { country: 'AE', currency: 'AED', locale: 'en' };
    if (browserLocale.endsWith('-IN')) return { country: 'IN', currency: 'INR', locale: 'en' };
    return { country: 'US', currency: 'USD', locale: 'en' };
  };

  useEffect(() => {
    const storedCountry = localStorage.getItem('locale_country');
    const storedCurrency = localStorage.getItem('locale_currency');
    const storedLocale = localStorage.getItem('locale_lang');
    const manualCurrency = hasManualCurrencyOverride();
    const manualLanguage = hasManualLanguageOverride();
    const browserDefaults = getBrowserDefaults();

    if (storedCountry || storedCurrency || storedLocale) {
      applyLocale(
        storedCountry || browserDefaults.country,
        manualCurrency ? (storedCurrency || browserDefaults.currency) : browserDefaults.currency,
        manualLanguage ? (storedLocale || browserDefaults.locale) : browserDefaults.locale
      );
    }

    localeAPI.detect().then(({ data }) => {
      const detectedCountry = data?.country || browserDefaults.country;
      const detectedCurrency = data?.currency || browserDefaults.currency;
      const detectedLocale = data?.locale || browserDefaults.locale;

      if (!storedCountry || storedCountry !== detectedCountry) {
        applyLocale(detectedCountry, null, null);
      }
      if (!manualCurrency) {
        applyLocale(null, detectedCurrency, null);
      }
      if (!manualLanguage) {
        applyLocale(null, null, detectedLocale);
      }
    }).catch(() => {
      if (!storedCountry || (!storedCurrency && !manualCurrency) || (!storedLocale && !manualLanguage)) {
        applyLocale(
          storedCountry || browserDefaults.country,
          manualCurrency ? (storedCurrency || browserDefaults.currency) : browserDefaults.currency,
          manualLanguage ? (storedLocale || browserDefaults.locale) : browserDefaults.locale
        );
      }
    });

    localeAPI.getCurrencies().then(({ data }) => {
      setCurrencies(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!hasManualCurrencyOverride() || !hasManualLanguageOverride()) {
      applyLocale(
        user.country || country,
        hasManualCurrencyOverride() ? null : user.currency,
        hasManualLanguageOverride() ? null : (user.preferredLanguage || user.locale || locale)
      );
    }

    if (hasManualCurrencyOverride() || hasManualLanguageOverride()) {
      return;
    }

    if (!user.country || !user.currency || !user.locale) {
      authAPI.updateLocale({
        country: user.country || country,
        currency: user.currency || currency,
        locale: user.preferredLanguage || user.locale || locale,
      }).catch(() => {});
    }
  }, [user]);

  const switchCurrency = (cur) => {
    localStorage.setItem('locale_manual_currency', '1');
    applyLocale(null, cur, null);
    if (user?._id) {
      authAPI.updateLocale({ currency: cur }).catch(() => {});
    }
  };

  const switchLocale = (lang, options = {}) => {
    const { manual = true } = options;
    if (manual) localStorage.setItem('locale_manual_lang', '1');
    applyLocale(null, null, lang);
    if (user?._id) {
      authAPI.updateLocale({ locale: lang }).catch(() => {});
    }
  };

  const formatPrice = (priceINR, priceAED, priceUSD) => {
    const baseINR = Number(priceINR || 0);
    let amount = baseINR;
    const parsedAED = Number(priceAED);
    const parsedUSD = Number(priceUSD);

    if (currency === 'AED') {
      if (Number.isFinite(parsedAED) && parsedAED > 0) {
        amount = parsedAED;
      } else if (currencies?.exchangeRates?.INR_AED) {
        amount = baseINR * Number(currencies.exchangeRates.INR_AED);
      }
    } else if (currency === 'USD') {
      if (Number.isFinite(parsedUSD) && parsedUSD > 0) {
        amount = parsedUSD;
      } else if (currencies?.exchangeRates?.INR_USD) {
        amount = baseINR * Number(currencies.exchangeRates.INR_USD);
      }
    }

    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency] || `${currency} `;

  return (
    <LocaleContext.Provider value={{
      country, currency, locale, currencies, currencySymbol,
      switchCurrency, switchLocale, formatPrice,
      languageOptions: LANGUAGE_OPTIONS,
    }}>
      {children}
    </LocaleContext.Provider>
  );
};

export default LocaleContext;
