import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DualPathwayCards from './DualPathwayCards';
import LiveJobsCarousel from './LiveJobsCarousel';
import useTranslation from '../../hooks/useTranslation';

export default function HeroSection({ user, jobSearch, setJobSearch, jobLocation, setJobLocation, handleJobSearch, isLoadingJobs, liveJobsList }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [apiLocations, setApiLocations] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const locationRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const fetchLocations = async (query) => {
    if (!query || query.length < 2) {
      setApiLocations([]);
      return;
    }
    setIsFetchingLocations(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      const data = await res.json();
      setApiLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setIsFetchingLocations(false);
    }
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchLocations(jobLocation);
    }, 500);
    
    return () => clearTimeout(debounceTimerRef.current);
  }, [jobLocation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPopularSearchLink = (term) => {
    if (user?.activeRole === 'provider') {
      return `/provider/job-for-me`; 
    } else if (user?.activeRole === 'recruiter') {
      return `/recruiter/dashboard`;
    } else {
      return `/candidate-landing`;
    }
  };

  return (
    <div className="w-full h-[100vh] flex flex-col justify-between pt-2 sm:pt-3 overflow-hidden bg-[#fcfdfe]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 2. Hero Section Content */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center flex-1">
        
        {/* Top Pill */}
        {/* Top Pill */}
        {/* <div className="flex items-center gap-1.5 bg-[#f4f7ff] text-blue-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold mb-2 mt-1 border border-blue-100/50 shadow-sm">
          <User className="w-3.5 h-3.5 text-blue-600" />
          {t("India's AI-Powered Hiring Platform")}
        </div> */}

        {/* Main Headline */}
        <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#0B1536] mb-3 text-center tracking-tight leading-tight">
          {t("One Platform.")} <span className="text-blue-600">{t("Endless Opportunities.")}</span>
        </h1>

        
        {/* Main Job Search Bar */}
        <form onSubmit={handleJobSearch} className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-sm p-1.5 flex flex-col sm:flex-row items-center relative z-10 hover:shadow-md transition gap-1.5 sm:gap-0 mt-1">
          <div className="flex-1 flex items-center px-4 py-1 sm:py-0 w-full sm:w-auto bg-transparent border-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder={t("Search jobs by title, skills, or company")} 
              className="w-full bg-transparent border-none focus:ring-0 text-gray-700 ml-2 py-1.5 sm:py-2 outline-none text-[11px] sm:text-sm font-medium"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
            />
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1"></div>
          <div ref={locationRef} className="flex-1 flex items-center px-4 py-1 sm:py-0 w-full sm:w-auto bg-transparent border-none relative">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder={t("All Locations")} 
              className="w-full bg-transparent border-none focus:ring-0 text-gray-700 ml-2 py-1.5 sm:py-2 outline-none text-[11px] sm:text-sm font-medium"
              value={jobLocation}
              onChange={(e) => {
                setJobLocation(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => setShowLocationDropdown(true)}
            />
            {showLocationDropdown && (jobLocation.length > 1 || apiLocations.length > 0 || isFetchingLocations) && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {isFetchingLocations ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Searching...
                  </div>
                ) : apiLocations.length > 0 ? (
                  apiLocations.map((loc) => {
                    // Extract a shorter name for display if possible, or use display_name
                    const nameParts = loc.display_name.split(',');
                    const shortName = nameParts.slice(0, 3).join(',');
                    return (
                      <div 
                        key={loc.place_id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-start gap-3 border-b border-gray-50 last:border-none"
                        onClick={() => {
                          setJobLocation(shortName.trim());
                          setShowLocationDropdown(false);
                        }}
                      >
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="leading-tight">{shortName.trim()}</span>
                      </div>
                    );
                  })
                ) : jobLocation.length > 1 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No matching locations found
                  </div>
                ) : null}
              </div>
            )}
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-6 sm:px-7 rounded-xl transition-colors shrink-0 text-xs shadow-sm"
          >
            {t("Search Jobs")}
          </button>
        </form>

        {/* Popular Searches */}
        <div className="mt-3 flex flex-wrap justify-center items-center gap-2 text-sm">
          {/* <span className="text-gray-900 font-bold text-[10px] sm:text-[11px] mr-1">{t("Popular Searches:")}</span>
          {[t('React Developer'), t('UI/UX Designer'), t('Data Analyst'), t('Marketing'), t('Python Developer')].map((term) => (
            <Link 
              key={term} 
              to={getPopularSearchLink(term)}
              state={{ formData: { skills: term, location: '' } }}
              onClick={() => setJobSearch(term)}
              className="px-3 py-1 rounded-full bg-[#f4f7fa] text-[#4b5563] hover:bg-blue-50 hover:text-blue-700 transition font-semibold text-[9px] sm:text-[10px] block"
            >
              {term}
            </Link>
          ))}
          <Link to="/candidate-landing" className="text-blue-600 font-bold text-[10px] hover:underline ml-1">
            {t("View all")}
          </Link> */}
        </div>
        
        {/* 3. Dual Pathway Cards */}
        <div className="w-full mt-3 flex-1 flex flex-col justify-center">
          <DualPathwayCards user={user} />
        </div>
      </div>
      
      {/* 4. Live Jobs Carousel at the bottom of hero section */}
      <div className="w-full mt-auto pb-0 -mt-2">
        <LiveJobsCarousel isLoadingJobs={isLoadingJobs} liveJobsList={liveJobsList} />
      </div>
    </div>
  );
}
