import { useEffect, useMemo, useRef, useState } from 'react';
import { HiCheck, HiChevronDown, HiGlobeAlt } from 'react-icons/hi';
import useTranslation from '../hooks/useTranslation';

const LanguageDropdown = ({ mobile = false, onChangeComplete }) => {
  const { t, selectedLanguage, languages, setSelectedLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const activeLanguage = useMemo(() => {
    return languages.find((item) => item.code === selectedLanguage) || languages[0];
  }, [languages, selectedLanguage]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      setOpen(false);
    };

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleSelect = async (nextLanguage) => {
    await setSelectedLanguage(nextLanguage);
    setOpen(false);
    if (onChangeComplete) onChangeComplete();
  };

  if (mobile) {
    return (
      <div className="py-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('navbar.language')}</label>
        <select
          value={selectedLanguage}
          onChange={(event) => handleSelect(event.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>{item.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1.5 hover:bg-gray-100 transition"
      >
        <HiGlobeAlt className="text-indigo-500" />
        <span className="text-sm font-medium text-gray-700 max-w-32 truncate">{activeLanguage?.label || 'English'}</span>
        <HiChevronDown className={`text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 max-h-72 overflow-auto animate-fade-in">
          {languages.map((item) => {
            const isSelected = item.code === selectedLanguage;
            return (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between text-left px-4 py-2 text-sm hover:bg-gray-50 ${isSelected ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
              >
                <span>{item.label}</span>
                {isSelected && <HiCheck className="text-indigo-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
