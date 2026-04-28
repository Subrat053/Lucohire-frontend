import { useLanguage } from '../context/LanguageContext';

const useTranslation = () => {
  const { t, language, languages, changeLanguage, loading, isRTL } = useLanguage();

  return {
    t,
    language,
    languages,
    changeLanguage,
    loading,
    isRTL,
  };
};

export default useTranslation;
