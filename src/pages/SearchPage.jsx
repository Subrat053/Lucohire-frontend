import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiSearch, HiLocationMarker, HiStar, HiBadgeCheck, HiFilter, HiX, HiChevronRight } from 'react-icons/hi';
import { POPULAR_SKILLS, filterDummyProviders, DUMMY_PROVIDERS } from '../data/skillsData';
import { toAbsoluteMediaUrl } from '../utils/media';
import { normalizeProviderData } from '../utils/providerData';
import { getProviders as fetchProviderResults } from '../services/providerService';
import SharedProviderCard from '../components/providers/ProviderCard';
import useTranslation from '../hooks/useTranslation';

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('query') || searchParams.get('skill') || searchParams.get('category') || '';
  const [queryText, setQueryText] = useState(initialQuery);
  const [skill, setSkill] = useState(searchParams.get('skill') || searchParams.get('category') || initialQuery);
  const [city, setCity] = useState(searchParams.get('location') || searchParams.get('city') || '');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [results, setResults] = useState({ rotation:[], featured:[], providers:[], pagination:{} });
  const [searchMeta, setSearchMeta] = useState({});
  const [interpretedIntent, setInterpretedIntent] = useState({ skill: '', city: '', confidence: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ rating: '', experience: '', verified: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeSkillPill, setActiveSkillPill] = useState();
  const debounceRef = useRef(null);
  const rotationTimerRef = useRef(null);

  const updateSearchQuery = useCallback((nextState) => {
    const nextParams = new URLSearchParams();

    if (nextState.query) nextParams.set('query', nextState.query);
    if (nextState.skill) nextParams.set('skill', nextState.skill);
    if (nextState.category) nextParams.set('category', nextState.category);
    if (nextState.city) nextParams.set('location', nextState.city);
    if (nextState.tier) nextParams.set('tier', nextState.tier);

    setSearchParams(nextParams, { replace: true });
  }, [setSearchParams]);

  const fetchProviders = useCallback(async (queryVal, cityVal, filtersVal, tierVal, categoryVal = '') => {
    setLoading(true);
    const effectiveSearch = queryVal || categoryVal;

    const normalizeList = (list = [], isDummy = false) =>
      list.map((provider, index) => normalizeProviderData(provider, index, { isDummy }));

    const buildFallback = () => {
      const dummy = filterDummyProviders(effectiveSearch || tierVal || queryVal, cityVal);
      const providersList = (effectiveSearch || cityVal || tierVal)
        ? dummy
        : (dummy.length > 0 ? dummy : DUMMY_PROVIDERS.slice(0, 9));

      setResults({ rotation: [], featured: [], providers: normalizeList(providersList, true), pagination: {} });
      setSearchMeta({
        locationMessage: cityVal ? `Showing nearby results for ${cityVal}.` : '',
        locationLevel: 'fallback',
      });
    };

    try {
      const data = await fetchProviderResults({
        query: queryVal,
        city: cityVal,
        location: cityVal,
        tier: tierVal,
        rating: filtersVal.rating,
        experience: filtersVal.experience,
        verified: filtersVal.verified,
        limit: 20,
      });
      const providers = Array.isArray(data?.providers) ? data.providers : [];
      const rotation = Array.isArray(data?.rotation) ? data.rotation : [];
      const featured = Array.isArray(data?.featured) ? data.featured : [];
      const hasAny = providers.length > 0 || rotation.length > 0 || featured.length > 0;

      if (!hasAny) {
        buildFallback();
      } else {
        const interpretedSkill = String(data?.intent?.skill || '').trim();
        const interpretedCity = String(data?.intent?.city || '').trim();

        setInterpretedIntent({
          skill: interpretedSkill,
          city: interpretedCity,
          confidence: Number(data?.intent?.confidence || 0),
        });

        setSkill(categoryVal || interpretedSkill || queryVal || '');
        setCity(cityVal || interpretedCity || '');
        setResults({
          rotation: normalizeList(rotation),
          featured: normalizeList(featured),
          providers: normalizeList(providers),
          pagination: data?.pagination || {},
        });
        setSearchMeta(data?.searchMeta || {});
      }
    } catch {
      setInterpretedIntent({ skill: '', city: '', confidence: 0 });
      buildFallback();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const query = searchParams.get('query') || '';
    const queryCategory = searchParams.get('category') || '';
    const querySkill = searchParams.get('skill') || '';
    const queryCity = searchParams.get('location') || searchParams.get('city') || '';
    const queryTier = searchParams.get('tier') || '';
    const resolvedSearch = query || querySkill || queryCategory;

    setSelectedCategory(queryCategory);
    setQueryText(resolvedSearch);
    setSkill(querySkill || queryCategory || resolvedSearch);
    setCity(queryCity);
    setTierFilter(queryTier);
    if (queryCity) localStorage.setItem('servicehub:lastSearchLocation', queryCity);
    fetchProviders(resolvedSearch, queryCity, filters, queryTier, queryCategory);
  }, [searchParams, fetchProviders]);

  // Auto-refresh rotation providers every 60 seconds
  useEffect(() => {
    rotationTimerRef.current = setInterval(() => {
      fetchProviders(queryText || skill, city, filters, tierFilter, selectedCategory);
    }, 60000);
    return () => clearInterval(rotationTimerRef.current);
  }, [queryText, skill, city, filters, tierFilter, selectedCategory, fetchProviders]);

  const triggerDebounce = (s, c, f, t, categoryVal = '') => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProviders(s, c, f, t, categoryVal), 400);
  };

  const handleSkillChange = (val) => {
    setQueryText(val);
    const nextCategory = selectedCategory && val.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      ? selectedCategory
      : '';

    setSelectedCategory(nextCategory);
    setSkill(val);
    triggerDebounce(val, city, filters, tierFilter, nextCategory);
    updateSearchQuery({ query: val, skill: val, city, tier: tierFilter, category: nextCategory });
  };

  const handleCityChange = (val) => {
    setCity(val);
    localStorage.setItem('servicehub:lastSearchLocation', val);
    triggerDebounce(queryText || skill, val, filters, tierFilter, selectedCategory);
    updateSearchQuery({ query: queryText || skill, skill, city: val, tier: tierFilter, category: selectedCategory });
  };

  const handleFilterChange = (key, val) => {
    const f = { ...filters, [key]: val };
    setFilters(f);
    triggerDebounce(queryText || skill, city, f, tierFilter, selectedCategory);
  };

  const handleTierChange = (val) => {
    setTierFilter(val);
    triggerDebounce(queryText || skill, city, filters, val, selectedCategory);
    updateSearchQuery({ query: queryText || skill, skill, city, tier: val, category: selectedCategory });
  };

  const handlePillClick = (s) => {
    const v = activeSkillPill===s?'':s;
    setActiveSkillPill(v);
    setSelectedCategory(v);
    setQueryText(v);
    setSkill(v);
    triggerDebounce(v, city, filters, tierFilter, v);
    updateSearchQuery({ query: v, skill: v, city, tier: tierFilter, category: v });
  };

  const clearAll = () => {
    setQueryText('');
    setSkill('');
    setCity('');
    setFilters({ rating: '', experience: '', verified: '' });
    setTierFilter('');
    setSelectedCategory('');
    setActiveSkillPill('');
    updateSearchQuery({ query: '', skill: '', city: '', tier: '', category: '' });
    fetchProviders('', '', { rating: '', experience: '', verified: '' }, '', '');
  };

  const hasFilters = queryText || skill || city || filters.rating || filters.experience || filters.verified || tierFilter;
  const allProviders = [...(results.rotation||[]), ...(results.featured||[]), ...(results.providers||[])];
  const searchMessage = searchMeta?.locationMessage || '';

  const tiers = [
    {k:'',l:t('search.all')},
    {k:'unskilled',l:t('search.tierUnskilled')},
    {k:'semi-skilled',l:t('search.tierSemiSkilled')},
    {k:'skilled',l:t('search.tierSkilled')},
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Search bar */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input value={queryText} onChange={(e)=>handleSkillChange(e.target.value)} placeholder={t('search.searchSkillPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm bg-[#faf9f7]" />
            </div>
            <div className="relative flex-1">
              <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input value={city} onChange={(e)=>handleCityChange(e.target.value)} placeholder={t('search.cityPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-sm bg-[#faf9f7]" />
            </div>
            <button onClick={()=>setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 transition text-sm font-medium ${showFilters?'border-amber-400 bg-amber-50 text-amber-700':'border-stone-200 hover:bg-stone-50 text-stone-600'}`}>
              <HiFilter className="w-4 h-4" /> {t('search.filters')}
            </button>
            {hasFilters && (
              <button onClick={clearAll} className="px-4 py-2.5 border border-red-200 text-red-400 rounded-xl flex items-center gap-1 hover:bg-red-50 transition text-sm font-medium">
                <HiX className="w-4 h-4" /> {t('search.clear')}
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-stone-100">
              {tiers.map((t)=>(
                <button key={t.k} onClick={()=>handleTierChange(t.k)}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition border ${tierFilter===t.k?'bg-stone-900 text-white border-stone-900':'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                  {t.l}
                </button>
              ))}
              <select value={filters.rating} onChange={(e)=>handleFilterChange('rating',e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-700">
                <option value="">{t('search.anyRating')}</option>
                <option value="4">{t('search.rating4')}</option>
                <option value="3">{t('search.rating3')}</option>
              </select>
              <select value={filters.experience} onChange={(e)=>handleFilterChange('experience',e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-700">
                <option value="">{t('search.anyExperience')}</option>
                <option value="1">{t('search.years1')}</option>
                <option value="3">{t('search.years3')}</option>
                <option value="5">{t('search.years5')}</option>
              </select>
              <select value={filters.verified} onChange={(e)=>handleFilterChange('verified',e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-700">
                <option value="">{t('search.allProviders')}</option>
                <option value="true">{t('search.verifiedOnly')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Popular skill pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{scrollbarWidth:'none'}}>
          {POPULAR_SKILLS.slice(0,16).map((s)=>(
            <button key={s} onClick={()=>handlePillClick(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${activeSkillPill===s?'bg-stone-900 text-white border-stone-900':'bg-white border-stone-200 text-stone-600 hover:border-stone-800 hover:bg-stone-50'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Active chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {queryText&&<span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">{t('search.skill')}: {queryText}<button onClick={()=>handleSkillChange('')}><HiX className="w-3 h-3"/></button></span>}
            {city&&<span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">{t('search.city')}: {city}<button onClick={()=>handleCityChange('')}><HiX className="w-3 h-3"/></button></span>}
            {tierFilter&&<span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs rounded-full font-medium capitalize flex items-center gap-1">{tierFilter.replace('-', ' ')}<button onClick={()=>handleTierChange('')}><HiX className="w-3 h-3"/></button></span>}
            {filters.rating&&<span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">{filters.rating}+ {t('search.stars')}<button onClick={()=>handleFilterChange('rating', '')}><HiX className="w-3 h-3"/></button></span>}
          </div>
        )}

        {/* Results summary */}
        <div className="text-sm text-stone-500 mb-5">
          <span className="font-semibold text-stone-700">{allProviders.length}</span> {t('search.providersFound')}
          {(interpretedIntent.skill || interpretedIntent.city) && (
            <span> {t('search.for')} <span className="font-medium text-stone-800">{[interpretedIntent.skill || skill, interpretedIntent.city || city].filter(Boolean).join(` ${t('search.in')} `)}</span></span>
          )}
        </div>

        {(interpretedIntent.skill || interpretedIntent.city) && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-medium mb-1">🤖 AI Interpretation</p>
            <p className="text-xs text-emerald-700">
              Showing {interpretedIntent.skill || 'service'} results{interpretedIntent.city ? ` in ${interpretedIntent.city}` : ''}.
              {interpretedIntent.confidence && <span> (Confidence: {Math.round(interpretedIntent.confidence * 100)}%)</span>}
            </p>
          </div>
        )}

        {searchMessage && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium mb-1">📍 Location Info</p>
            <p className="text-xs text-amber-700">{searchMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5 animate-pulse">
                <div className="flex gap-3 mb-4"><div className="w-14 h-14 bg-stone-200 rounded-xl"/><div className="flex-1 space-y-2"><div className="h-3 bg-stone-200 rounded w-3/4"/><div className="h-2 bg-stone-100 rounded w-1/2"/></div></div>
                <div className="h-2 bg-stone-100 rounded mb-3"/><div className="flex gap-1.5"><div className="h-6 bg-stone-100 rounded-full w-20"/><div className="h-6 bg-stone-100 rounded-full w-16"/></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {results.rotation?.length>0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  {t('search.topProviders')} <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{t('search.rotating')}</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {results.rotation.map((p,i)=><SharedProviderCard key={i} provider={p} badge="rotation" t={t} onClick={()=>navigate(`/provider/${p._id||p.user?._id}`)} />)}
                </div>
              </div>
            )}
            {results.featured?.length>0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wide">{t('search.featuredProviders')}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {results.featured.map((p,i)=><SharedProviderCard key={i} provider={p} badge="featured" t={t} onClick={()=>navigate(`/provider/${p._id||p.user?._id}`)} />)}
                </div>
              </div>
            )}
            {results.providers?.length>0 ? (
              <>
                <h2 className="text-sm font-bold text-stone-700 mb-3 uppercase tracking-wide">
                  {t('search.allProvidersTitle')}
                  {results.pagination?.total>0&&<span className="ml-2 text-xs font-normal text-stone-400">({results.pagination.total} {t('search.total')})</span>}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.providers.map((p,i)=><SharedProviderCard key={i} provider={p} t={t} onClick={()=>navigate(`/provider/${p._id||p.user?._id}`)} />)}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">&#128269;</div>
                <h3 className="text-lg font-bold text-stone-700 mb-2">{t('search.noProvidersFound')}</h3>
                <p className="text-stone-400 text-sm">{t('search.tryDifferent')}</p>
                <button onClick={clearAll} className="mt-5 inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-700 transition">{t('search.clearAllFilters')} <HiX className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
