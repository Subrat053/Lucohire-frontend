import { useEffect, useMemo, useState } from 'react';
import { HiLocationMarker } from 'react-icons/hi';
import toast from 'react-hot-toast';

import { locationAPI } from '../services/api';
import useDebounce from '../hooks/useDebounce';

const LocationSearch = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Type location...',
  className = '',
  minChars = 3,
}) => {
  const [query, setQuery] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const run = async () => {
      const text = String(debouncedQuery || '').trim();
      const selectedText = String(selectedValue || '').trim();

      // Keep dropdown closed after exact selection until user edits input.
      if (selectedText && text === selectedText) {
        setOpen(false);
        return;
      }

      if (text.length < minChars) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await locationAPI.searchPlaces(text);
        const list = Array.isArray(data?.data) ? data.data : [];
        setSuggestions(list);
        setOpen(true);
      } catch (_) {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }

    };

    run();
  }, [debouncedQuery, minChars]);

  const inputClass = useMemo(
    () => `w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`,
    [className]
  );

  const handleInput = (next) => {
    setQuery(next);
    const trimmed = String(next || '').trim();

    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      setSelectedValue('');
      if (onChange) onChange('');
      if (onSelect) onSelect(null);
      return;
    }

    if (selectedValue && next.trim() !== selectedValue.trim()) {
      setSelectedValue('');
    }
    if (onChange) onChange(next);
  };

  const handleSelect = async (item) => {
    setLoading(true);
    try {
      const { data } = await locationAPI.getPlaceDetails(item.placeId);
      const details = data?.data || item;
      const next = details.name || details.formattedAddress || '';
      
      setQuery(next);
      setSelectedValue(next);
      setSuggestions([]);
      
      if (onChange) onChange(next);
      if (onSelect) onSelect(details);
      setOpen(false);
    } catch (error) {
      toast.error('Failed to fetch place details');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative">
      <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        className={inputClass}
      />

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>}
          {!loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No suggestions found</div>
          )}
          {!loading && suggestions.map((item) => (
            <button
              type="button"
              key={item.placeId || `${item.lat}-${item.lon}`}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-50 last:border-0"
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-gray-500 truncate">{item.formattedAddress}</div>
            </button>
          ))}

        </div>
      )}
    </div>
  );
};

export default LocationSearch;
