import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiSearch, HiLocationMarker, HiStar, HiBadgeCheck, HiFilter, HiX, HiChevronRight } from 'react-icons/hi';
import { recruiterAPI } from '../services/api';
import { POPULAR_SKILLS, filterDummyProviders, DUMMY_PROVIDERS, fuzzyResolveSkill } from '../data/skillsData';
import { toAbsoluteMediaUrl } from '../utils/media';
import { extractProvidersList, normalizeProviderData } from '../utils/providerData';
import useTranslation from '../hooks/useTranslation';

const ProviderCard = ({ provider, badge, onClick, t }) => {
  const tierColors = { unskilled:'bg-emerald-100 text-emerald-700', 'semi-skilled':'bg-amber-100 text-amber-700', skilled:'bg-indigo-100 text-indigo-700' };
  const tierLabels = {
    unskilled: t('search.tierUnskilled'),
    'semi-skilled': t('search.tierSemiSkilled'),
    skilled: t('search.tierSkilled'),
  };

  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl border hover:shadow-md transition-all duration-200 cursor-pointer group p-5 ${badge==='rotation'?'border-amber-300 ring-2 ring-amber-100':badge==='featured'?'border-indigo-200':'border-stone-200'}`}>
      {badge && (
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${badge==='rotation'?'bg-amber-100 text-amber-700':'bg-indigo-100 text-indigo-700'}`}>
          {badge==='rotation' ? t('search.topProvider') : t('search.featured')}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
            {(provider.photo || provider.profilePhoto) ? (
              <img src={toAbsoluteMediaUrl(provider.photo || provider.profilePhoto)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-600 font-bold text-xl">
                {(provider.user?.name || provider.name || 'P')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <h3 className="font-semibold text-stone-800 text-sm truncate">{provider.user?.name || provider.name || t('search.provider')}</h3>
              {provider.isVerified && <HiBadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1">
              <HiStar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-stone-700">{provider.rating || provider.averageRating || 0}</span>
              <span className="text-xs text-stone-400">({provider.totalReviews || 0})</span>
            </div>
            <p className="text-xs text-stone-400 flex items-center gap-0.5 mt-0.5">
              <HiLocationMarker className="w-3 h-3" />{provider.city}
              {provider.distanceKm != null && <span>&bull; {provider.distanceKm} km</span>}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <span className={`w-2 h-2 rounded-full inline-block ${provider.isAvailable!==false?'bg-emerald-400':'bg-stone-300'}`}></span>
            <span className={`text-xs font-medium ${provider.isAvailable!==false?'text-emerald-600':'text-stone-400'}`}>
              {provider.isAvailable!==false ? t('search.available') : t('search.busy')}
            </span>
          </div>
          {provider.ratePerHour && <span className="text-sm font-bold text-stone-800">&#8377;{provider.ratePerHour}<span className="text-xs font-normal text-stone-400">/hr</span></span>}
        </div>
      </div>
      {provider.headline && <p className="text-xs text-stone-500 mb-3 line-clamp-1">{provider.headline}</p>}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(provider.skills||[]).slice(0,4).map((s,i)=>(
          <span key={i} className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs rounded-full font-medium">{s}</span>
        ))}
        {(provider.skills||[]).length>4&&<span className="px-2.5 py-1 bg-stone-50 text-stone-400 text-xs rounded-full">+{provider.skills.length-4}</span>}
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={(e)=>{e.stopPropagation();onClick&&onClick();}} className="flex-1 bg-stone-900 hover:bg-stone-700 text-white py-2 rounded-xl text-xs font-semibold transition">{t('search.viewProfile')}</button>
        {provider.tier && (
          <span className={`self-center text-xs px-2.5 py-1.5 rounded-xl font-medium capitalize ${tierColors[provider.tier]||'bg-stone-100 text-stone-500'}`}>
            {tierLabels[provider.tier] || provider.tier.replace('-', ' ')}
          </span>
        )}
      </div>
    </div>
  );
};

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(searchParams.get('skill') || searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [results, setResults] = useState({ rotation:[], featured:[], providers:[], pagination:{} });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ rating: '', experience: '', verified: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeSkillPill, setActiveSkillPill] = useState();
  const debounceRef = useRef(null);
  const rotationTimerRef = useRef(null);

  const updateSearchQuery = useCallback((nextState) => {
    const nextParams = new URLSearchParams();

    if (nextState.skill) nextParams.set('skill', nextState.skill);
    if (nextState.category) nextParams.set('category', nextState.category);
    if (nextState.city) nextParams.set('city', nextState.city);
    if (nextState.tier) nextParams.set('tier', nextState.tier);

    setSearchParams(nextParams, { replace: true });
  }, [setSearchParams]);

  const fetchProviders = useCallback(async (skillVal, cityVal, filtersVal, tierVal, categoryVal = '') => {
    setLoading(true);
    const effectiveSearch = skillVal || categoryVal;
    const resolvedSkill = effectiveSearch ? fuzzyResolveSkill(effectiveSearch) : '';

    const normalizeList = (list = [], isDummy = false) =>
      list.map((provider, index) => normalizeProviderData(provider, index, { isDummy }));

    const buildFallback = () => {
      const dummy = filterDummyProviders(resolvedSkill || tierVal || categoryVal, cityVal);
      const providersList = (effectiveSearch || cityVal || tierVal)
        ? dummy
        : (dummy.length > 0 ? dummy : DUMMY_PROVIDERS.slice(0, 9));

      setResults({ rotation: [], featured: [], providers: normalizeList(providersList, true), pagination: {} });
    };

    try {
      const { data } = await recruiterAPI.publicSearch({ skill: resolvedSkill, city: cityVal, tier: tierVal, rating: filtersVal.rating, experience: filtersVal.experience, verified: filtersVal.verified });
      const providers = extractProvidersList(data);
      const rotation = Array.isArray(data?.rotation) ? data.rotation : [];
      const featured = Array.isArray(data?.featured) ? data.featured : [];
      const hasAny = providers.length > 0 || rotation.length > 0 || featured.length > 0;

      if (!hasAny) {
        buildFallback();
      } else {
        setResults({
          rotation: normalizeList(rotation),
          featured: normalizeList(featured),
          providers: normalizeList(providers),
          pagination: data?.pagination || {},
        });
      }
    } catch {
      buildFallback();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const queryCategory = searchParams.get('category') || '';
    const querySkill = searchParams.get('skill') || '';
    const queryCity = searchParams.get('city') || '';
    const queryTier = searchParams.get('tier') || '';
    const resolvedSkill = querySkill || queryCategory;

    setSelectedCategory(queryCategory);
    setSkill(resolvedSkill);
    setCity(queryCity);
    setTierFilter(queryTier);
    fetchProviders(resolvedSkill, queryCity, filters, queryTier, queryCategory);
  }, [searchParams, fetchProviders]);

  // Auto-refresh rotation providers every 60 seconds
  useEffect(() => {
    rotationTimerRef.current = setInterval(() => {
      fetchProviders(skill, city, filters, tierFilter, selectedCategory);
    }, 60000);
    return () => clearInterval(rotationTimerRef.current);
  }, [skill, city, filters, tierFilter, selectedCategory, fetchProviders]);

  const triggerDebounce = (s, c, f, t, categoryVal = '') => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProviders(s, c, f, t, categoryVal), 400);
  };

  const handleSkillChange = (val) => {
    const nextCategory = selectedCategory && val.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      ? selectedCategory
      : '';

    setSelectedCategory(nextCategory);
    setSkill(val);
    triggerDebounce(val, city, filters, tierFilter, nextCategory);
    updateSearchQuery({ skill: val, city, tier: tierFilter, category: nextCategory });
  };

  const handleCityChange = (val) => {
    setCity(val);
    triggerDebounce(skill, val, filters, tierFilter, selectedCategory);
    updateSearchQuery({ skill, city: val, tier: tierFilter, category: selectedCategory });
  };

  const handleFilterChange = (key, val) => {
    const f = { ...filters, [key]: val };
    setFilters(f);
    triggerDebounce(skill, city, f, tierFilter, selectedCategory);
  };

  const handleTierChange = (val) => {
    setTierFilter(val);
    triggerDebounce(skill, city, filters, val, selectedCategory);
    updateSearchQuery({ skill, city, tier: val, category: selectedCategory });
  };

  const handlePillClick = (s) => {
    const v = activeSkillPill===s?'':s;
    setActiveSkillPill(v);
    setSelectedCategory(v);
    setSkill(v);
    triggerDebounce(v, city, filters, tierFilter, v);
    updateSearchQuery({ skill: v, city, tier: tierFilter, category: v });
  };

  const clearAll = () => {
    setSkill('');
    setCity('');
    setFilters({ rating: '', experience: '', verified: '' });
    setTierFilter('');
    setSelectedCategory('');
    setActiveSkillPill('');
    updateSearchQuery({ skill: '', city: '', tier: '', category: '' });
    fetchProviders('', '', { rating: '', experience: '', verified: '' }, '', '');
  };

  const hasFilters = skill || city || filters.rating || filters.experience || filters.verified || tierFilter;
  const allProviders = [...(results.rotation||[]), ...(results.featured||[]), ...(results.providers||[])];

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
              <input value={skill} onChange={(e)=>handleSkillChange(e.target.value)} placeholder={t('search.searchSkillPlaceholder')}
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
            {skill&&<span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">{t('search.skill')}: {skill}<button onClick={()=>handleSkillChange('')}><HiX className="w-3 h-3"/></button></span>}
            {city&&<span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">{t('search.city')}: {city}<button onClick={()=>handleCityChange('')}><HiX className="w-3 h-3"/></button></span>}
            {tierFilter&&<span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs rounded-full font-medium capitalize flex items-center gap-1">{tierFilter.replace('-', ' ')}<button onClick={()=>handleTierChange('')}><HiX className="w-3 h-3"/></button></span>}
            {filters.rating&&<span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">{filters.rating}+ {t('search.stars')}<button onClick={()=>handleFilterChange('rating', '')}><HiX className="w-3 h-3"/></button></span>}
          </div>
        )}

        {/* Results summary */}
        <div className="text-sm text-stone-500 mb-5">
          <span className="font-semibold text-stone-700">{allProviders.length}</span> {t('search.providersFound')}
          {(skill||city) && <span> {t('search.for')} <span className="font-medium text-stone-800">{[skill,city].filter(Boolean).join(` ${t('search.in')} `)}</span></span>}
        </div>

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
                  {results.rotation.map((p,i)=><ProviderCard key={i} provider={p} badge="rotation" t={t} onClick={()=>navigate(`/provider/${p._id||p.user?._id}`)} />)}
                </div>
              </div>
            )}
            {results.featured?.length>0 && (
              <div className="mb-8">
                <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2 uppercase tracking-wide">{t('search.featuredProviders')}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {results.featured.map((p,i)=><ProviderCard key={i} provider={p} badge="featured" t={t} onClick={()=>navigate(`/provider/${p._id||p.user?._id}`)} />)}
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
                  {results.providers.map((p,i)=><ProviderCard key={i} provider={p} t={t} onClick={()=>navigate(`/provider/${p._id||p.user?._id}`)} />)}
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
