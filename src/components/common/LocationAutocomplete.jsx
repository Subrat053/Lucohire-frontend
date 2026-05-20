import { useState, useEffect, useRef } from 'react';
import { HiLocationMarker, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi';
import { 
  getPlacePredictions, 
  getPlaceDetails, 
  normalizeGooglePlace 
} from '../../services/googlePlacesService';
import { useLocationContext } from '../../context/LocationContext';

// Standard fallback cities list if Google Places fails, is restricted, or returns zero results.
const STATIC_FALLBACK_CITIES = [
  { label: 'George Town, Grand Cayman, Cayman Islands', value: 'George Town, Grand Cayman, Cayman Islands', city: 'George Town', state: 'Grand Cayman', country: 'Cayman Islands', latitude: 19.2866, longitude: -81.3680 },
  { label: 'Bhubaneswar, Odisha, India', value: 'Bhubaneswar, Odisha, India', city: 'Bhubaneswar', state: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245 },
  { label: 'Miami, Florida, USA', value: 'Miami, Florida, USA', city: 'Miami', state: 'Florida', country: 'United States', latitude: 25.7617, longitude: -80.1918 },
  { label: 'New York, NY, USA', value: 'New York, NY, USA', city: 'New York', state: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { label: 'London, Greater London, United Kingdom', value: 'London, Greater London, United Kingdom', city: 'London', state: 'Greater London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { label: 'Toronto, Ontario, Canada', value: 'Toronto, Ontario, Canada', city: 'Toronto', state: 'Ontario', country: 'Canada', latitude: 43.6532, longitude: -79.3832 },
  { label: 'Sydney, New South Wales, Australia', value: 'Sydney, New South Wales, Australia', city: 'Sydney', state: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093 }
];

const LocationAutocomplete = ({
  value,
  onChange,
  mode = 'city', // 'city', 'address', 'serviceArea', 'jobLocation'
  placeholder = 'Search location...',
  label = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
}) => {
  let locationContext = null;
  try {
    const context = useLocationContext();
    locationContext = context?.locationContext;
  } catch (_) {}

  // Extract display string for current input value
  const getDisplayValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.label || val.value || '';
  };

  const [inputValue, setInputValue] = useState(getDisplayValue(value));
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sync state if value prop changes from outside
  useEffect(() => {
    setInputValue(getDisplayValue(value));
  }, [value]);

  // Click outside close logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch predictions with debounce
  const fetchPredictions = (queryText) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmed = queryText.trim();
    if (trimmed.length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const options = {
          ...(locationContext?.latitude && locationContext?.longitude ? {
            latitude: locationContext.latitude,
            longitude: locationContext.longitude,
            radiusMeters: locationContext.radiusMeters || 30000,
          } : {})
        };
        // Google Types mapping based on desired mode
        if (mode === 'city') {
          options.types = ['(cities)'];
        } else if (mode === 'serviceArea') {
          options.types = ['(regions)'];
        } else if (mode === 'jobLocation') {
          options.types = ['(regions)'];
        }

        const results = await getPlacePredictions(trimmed, options);
        
        if (results && results.length > 0) {
          setPredictions(results);
          setApiFailed(false);
          setIsOpen(true);
        } else {
          // Fallback to static lists if Google returns zero results
          triggerStaticFallback(trimmed);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Google Places prediction API failed: ', err);
        }
        setApiFailed(true);
        triggerStaticFallback(trimmed);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const triggerStaticFallback = (queryText) => {
    const lowercaseQuery = queryText.toLowerCase();
    const filteredStatic = STATIC_FALLBACK_CITIES.filter(
      item => item.label.toLowerCase().includes(lowercaseQuery) ||
              item.city.toLowerCase().includes(lowercaseQuery) ||
              item.country.toLowerCase().includes(lowercaseQuery)
    );
    
    setPredictions(filteredStatic.map(item => ({
      place_id: `static-${item.city.toLowerCase()}`,
      description: item.label,
      structured_formatting: {
        main_text: item.city,
        secondary_text: `${item.state ? item.state + ', ' : ''}${item.country}`
      },
      isStaticFallback: true,
      staticData: item
    })));
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);

    // Call onChange with manual fallback typing directly so form updates in real time
    if (onChange) {
      onChange({
        label: text,
        value: text,
        placeId: '',
        city: text,
        state: '',
        country: '',
        latitude: null,
        longitude: null,
        isManualInput: true
      });
    }

    fetchPredictions(text);
  };

  const handleSelectPrediction = async (prediction) => {
    setIsOpen(false);
    setLoading(true);

    try {
      if (prediction.isStaticFallback) {
        // Handle selection of a static fallback suggestion
        const normalized = {
          ...prediction.staticData,
          placeId: prediction.place_id,
          isFallbackSelection: true
        };
        setInputValue(normalized.label);
        if (onChange) {
          onChange(normalized);
        }
      } else {
        // Handle actual Google place selection
        const placeDetails = await getPlaceDetails(prediction.place_id);
        const normalized = normalizeGooglePlace(placeDetails, locationContext);
        
        if (normalized) {
          setInputValue(normalized.label);
          if (onChange) {
            onChange(normalized);
          }
        } else {
          throw new Error('Normalization returned null');
        }
      }
    } catch (err) {
      console.error('Failed to select prediction details: ', err);
      // Secure fallback: select prediction text as label
      const fallbackVal = {
        label: prediction.description,
        value: prediction.description,
        placeId: prediction.place_id,
        city: prediction.structured_formatting?.main_text || '',
        state: '',
        country: '',
        latitude: null,
        longitude: null,
        isFallbackSelection: true
      };
      setInputValue(fallbackVal.label);
      if (onChange) {
        onChange(fallbackVal);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          className={`w-full border rounded-xl pl-9 pr-8 py-2 text-sm transition-all duration-200 outline-none
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-red-50/20' 
              : 'border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-blue-50/10'
            }
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700'}
          `}
          autoComplete="off"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
          <HiExclamationCircle className="w-3.5 h-3.5" />
          {error}
        </span>
      )}

      {/* Autocomplete Predictions Dropdown */}
      {isOpen && (predictions.length > 0 || apiFailed) && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto py-1.5 animate-fadeIn">
          {apiFailed && (
            <div className="px-3 py-1 bg-amber-50 text-[11px] text-amber-700 font-medium flex items-center gap-1 border-b border-amber-100/50 mb-1">
              <HiExclamationCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              Suggestions loading offline mode. You can still type manually.
            </div>
          )}
          
          {(() => {
            const nearbySuggestions = predictions.filter(p => p.source === 'google_nearby');
            const otherSuggestions = predictions.filter(p => p.source !== 'google_nearby');

            const renderPredictionButton = (prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-50/60 last:border-b-0 flex items-start gap-2.5"
              >
                <HiLocationMarker className={`w-4 h-4 mt-0.5 flex-shrink-0 ${prediction.isStaticFallback ? 'text-stone-400' : 'text-blue-500'}`} />
                <div className="flex flex-col min-w-0 font-sans">
                  <span className="text-sm font-semibold text-gray-700 truncate">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </span>
                  {prediction.structured_formatting?.secondary_text && (
                    <span className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                      {prediction.structured_formatting.secondary_text}
                      {prediction.distanceFromUserKm && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                          {prediction.distanceFromUserKm} km away
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </button>
            );

            return (
              <>
                {nearbySuggestions.length > 0 && (
                  <div>
                    <div className="px-4 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50/30">
                      Nearby suggestions
                    </div>
                    {nearbySuggestions.map(p => renderPredictionButton(p))}
                  </div>
                )}

                {otherSuggestions.length > 0 && (
                  <div>
                    {nearbySuggestions.length > 0 && (
                      <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 mt-1 border-t border-gray-50">
                        Other suggestions
                      </div>
                    )}
                    {otherSuggestions.map(p => renderPredictionButton(p))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
