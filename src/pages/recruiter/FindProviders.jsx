import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiSearch, HiLocationMarker, HiStar, HiBadgeCheck, HiFilter, HiX,
  HiLockOpen, HiLockClosed, HiPhone, HiChevronRight, HiChevronLeft,
  HiUsers, HiSparkles, HiRefresh,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { recruiterAPI, searchAPI, subscriptionAPI } from '../../services/api';
import { toAbsoluteMediaUrl } from '../../utils/media';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LocationSearch from '../../components/LocationSearch';
import NaturalLanguageIntentBar from '../../components/recruiter/NaturalLanguageIntentBar';
import InstantHirePanel from '../../components/recruiter/InstantHirePanel';
import CompareProvidersModal from '../../components/recruiter/CompareProvidersModal';

const TIER_COLORS = {
  unskilled: 'bg-emerald-100 text-emerald-700',
  'semi-skilled': 'bg-amber-100 text-amber-700',
  skilled: 'bg-indigo-100 text-indigo-700',
};

const POPULAR_SKILLS = [
  'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Driver',
  'Cook', 'Maid', 'AC Technician', 'Welder', 'Mason',
  'Gardener', 'Security Guard', 'Delivery Boy', 'Tailor', 'Mechanic',
];

/* ── Provider Card ───────────────────────────────────────────────────── */
const ProviderCard = ({ provider, onView, onUnlock, unlocking }) => {
  const name = provider.user?.name || provider.name || 'Provider';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
          {(provider.photo || provider.profilePhoto) ? (
            <img src={toAbsoluteMediaUrl(provider.photo || provider.profilePhoto)} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold text-xl">
              {name[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-bold text-gray-900 text-sm truncate">{name}</h3>
            {provider.isVerified && <HiBadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            {provider.subscriptionBadge && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200 font-medium truncate">
                {provider.subscriptionBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mb-0.5">
            <HiStar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-gray-700">{provider.rating || provider.averageRating || '0.0'}</span>
            <span className="text-xs text-gray-400">({provider.totalReviews || 0})</span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-0.5">
            <HiLocationMarker className="w-3 h-3" /> {provider.city || 'Location N/A'}
          </p>
        </div>

        {/* Tier badge */}
        {provider.tier && (
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TIER_COLORS[provider.tier] || 'bg-gray-100 text-gray-600'}`}>
            {provider.tier.replace('-', ' ')}
          </span>
        )}
      </div>

      {/* Skills */}
      {provider.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {provider.skills.slice(0, 3).map((s, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full border border-gray-100">{s}</span>
          ))}
          {provider.skills.length > 3 && (
            <span className="text-xs text-gray-400">+{provider.skills.length - 3} more</span>
          )}
        </div>
      )}

      {/* Contact (if unlocked) */}
      {provider.isUnlocked && (
        <div className="flex gap-2 mb-3 bg-green-50 rounded-xl p-2.5 border border-green-100">
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800">
              <HiPhone className="w-3.5 h-3.5" /> {provider.phone}
            </a>
          )}
          {provider.whatsapp && (
            <a href={`https://wa.me/${provider.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800 px-2 border-l border-green-200">
              <FaWhatsapp className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(provider)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          View Profile <HiChevronRight className="w-3.5 h-3.5" />
        </button>
        {!provider.isUnlocked && (
          <button
            onClick={() => onUnlock(provider)}
            disabled={unlocking === provider._id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {unlocking === provider._id ? (
              <span className="animate-pulse">Unlocking…</span>
            ) : (
              <><HiLockOpen className="w-3.5 h-3.5" /> Unlock Contact</>
            )}
          </button>
        )}
        {provider.isUnlocked && (
          <div className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-green-600 bg-green-50 rounded-xl border border-green-100">
            <HiLockOpen className="w-3.5 h-3.5" /> Unlocked
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────── */
const FindProviders = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const [city, setCity] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [interpreted, setInterpreted] = useState(null);
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [unlocking, setUnlocking] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCoords, setSelectedCoords] = useState({ lat: null, lon: null });
  const [compareOpen, setCompareOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    subscriptionAPI.getMySubscription()
      .then(r => setSubscription(r.data))
      .catch(() => {});
  }, []);

  const doSearch = useCallback(async (page = 1) => {
    if (!query.trim() && !skill.trim() && !city.trim()) {
      toast('Enter a requirement, skill, or city to search', { icon: 'ℹ️' });
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const params = {
        query: query.trim() || undefined,
        skill: skill.trim() || undefined,
        city: city.trim() || undefined,
        ...(selectedCoords.lat !== null && selectedCoords.lon !== null ? {
          lat: selectedCoords.lat,
          lng: selectedCoords.lon,
        } : {}),
        sortBy: 'match',
        availability: true,
        page,
        limit: 12,
      };

      const { data } = await searchAPI.providers(params);
      const list = data.providers || [];
      setProviders(list);
      setInterpreted(data.intent || null);
      setPagination(data.pagination || { page, pages: 1, total: list.length });
      setCurrentPage(page);
    } catch (primaryErr) {
      // Backward-compatible fallback to legacy recruiter search.
      try {
        const { data } = await recruiterAPI.search({
          skill: skill.trim(),
          city: city.trim(),
          ...(selectedCoords.lat !== null && selectedCoords.lon !== null ? {
            lat: selectedCoords.lat,
            lon: selectedCoords.lon,
          } : {}),
          tier: tierFilter,
          rating: ratingFilter,
          page,
          limit: 12,
        });
        const list = data.providers || data.results || (Array.isArray(data) ? data : []);
        setProviders(list);
        setInterpreted(null);
        setPagination(data.pagination || { page, pages: 1, total: list.length });
        setCurrentPage(page);
      } catch (err) {
        toast.error(err.response?.data?.message || primaryErr.response?.data?.message || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  }, [query, skill, city, tierFilter, ratingFilter, selectedCoords]);

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(1);
  };

  const handleSkillPill = (s) => {
    setSkill(s);
    setTimeout(() => searchRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 50);
  };

  const handleLocationSelect = (item) => {
    if (!item) return;
    setCity(item.name || '');
    setSelectedCoords({
      lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
      lon: Number.isFinite(Number(item.lon)) ? Number(item.lon) : null,
    });
  };

  const handleView = (provider) => {
    const id = provider._id || provider.user?._id;
    navigate(`/recruiter/provider/${id}`);
  };

  const handleUnlock = async (provider) => {
    const providerId = provider._id || provider.user?._id;
    setUnlocking(providerId);
    try {
      const { data } = await recruiterAPI.unlockContact(providerId);
      toast.success(data.message || 'Contact unlocked!');
      setProviders(prev =>
        prev.map(p => {
          const pid = p.user?._id || p._id;
          if (pid === providerId) {
            return { ...p, isUnlocked: true, phone: data.phone, whatsapp: data.whatsapp };
          }
          return p;
        })
      );
      if (subscription) {
        setSubscription(prev => ({
          ...prev,
          remainingUnlocks: Math.max(0, (prev.remainingUnlocks || 0) - 1),
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock');
    } finally {
      setUnlocking(null);
    }
  };

  const planName = subscription?.plan?.name;
  const unlockCredits = subscription?.remainingUnlocks;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-extrabold text-white mb-1">Find Providers</h1>
          <p className="text-blue-100 text-sm">Search skilled professionals for your requirements</p>
          <div className="flex flex-wrap gap-3 mt-3">
            {planName && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-medium">
                <HiSparkles className="w-3.5 h-3.5" />
                {planName} Plan
              </div>
            )}
            {unlockCredits !== undefined && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-medium">
                <HiLockOpen className="w-3.5 h-3.5" />
                {unlockCredits} unlocks remaining
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Search Form */}
        <form ref={searchRef} onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="mb-3">
            <NaturalLanguageIntentBar
              query={query}
              onChange={setQuery}
              onApplyIntent={(parsed) => {
                if (!parsed) return;
                if (parsed.extractedSkill) setSkill(parsed.extractedSkill);
                if (parsed.extractedCity) setCity(parsed.extractedCity);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full">
              <label className="block text-xs text-gray-500 font-medium mb-1">Natural language request</label>
              <input
                type="text"
                placeholder="e.g. Need a verified plumber near Andheri under 1500"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 font-medium mb-1">Skill / Profession</label>
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Plumber, Electrician…"
                  value={skill}
                  onChange={e => setSkill(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 font-medium mb-1">City / Location</label>
              <LocationSearch
                value={city}
                onChange={(value) => {
                  setCity(value);
                  if (!String(value || '').trim()) {
                    setSelectedCoords({ lat: null, lon: null });
                  }
                }}
                onSelect={handleLocationSelect}
                placeholder="e.g. Mumbai, Delhi…"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Tier</label>
                <select
                  value={tierFilter}
                  onChange={e => setTierFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 h-9.5"
                >
                  <option value="">All Tiers</option>
                  <option value="unskilled">Unskilled</option>
                  <option value="semi-skilled">Semi-Skilled</option>
                  <option value="skilled">Skilled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Min Rating</label>
                <select
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 h-9.5"
                >
                  <option value="">Any</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>
              <button
                type="submit"
                className="h-9.5 px-5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition flex items-center gap-1.5"
              >
                <HiSearch className="w-4 h-4" /> Search
              </button>
            </div>
          </div>
        </form>

        <div className="mb-4">
          <InstantHirePanel
            onResults={(topProviders) => {
              setProviders(topProviders || []);
              setHasSearched(true);
              setPagination({ page: 1, pages: 1, total: (topProviders || []).length });
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Popular Skill Pills */}
        {!hasSearched && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 font-medium mb-2">Popular skills</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSkillPill(s)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-700 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : hasSearched && providers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <HiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">No providers found</p>
            <p className="text-sm text-gray-400 mt-1">Try different skill or location keywords</p>
            {interpreted && (
              <div className="mt-4 text-left max-w-md mx-auto">
                <p className="text-xs text-gray-500 font-semibold mb-2">AI interpreted your search as:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {interpreted.skill && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">{interpreted.skill}</span>}
                  {interpreted.city && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">{interpreted.city}</span>}
                </div>
              </div>
            )}
          </div>
        ) : providers.length > 0 ? (
          <>
            {interpreted && (
              <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-emerald-900 font-bold mb-2">🤖 AI Interpretation</p>
                    <p className="text-xs text-emerald-700 mb-3">Your search was interpreted as:</p>
                    <div className="flex flex-wrap gap-2">
                      {interpreted.skill && <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-700 font-medium">Service: {interpreted.skill}</span>}
                      {interpreted.city && <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-700 font-medium">Location: {interpreted.city}</span>}
                      {interpreted.locality && <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-700 font-medium">Area: {interpreted.locality}</span>}
                      {typeof interpreted.confidence === 'number' && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          Confidence: {Math.round(interpreted.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {providers.some((p) => p.aiRecommended) && (
              <div className="mb-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                <p className="text-sm text-emerald-700 font-semibold mb-2">Top 3 AI Recommended</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {providers.filter((p) => p.aiRecommended).slice(0, 3).map((provider) => (
                    <div key={`rec_${provider._id}`} className="bg-white border border-emerald-100 rounded-lg p-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{provider.user?.name || 'Provider'}</p>
                      <p className="text-xs text-gray-500">Score: {provider.matchScore || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-700 font-semibold">
                  {pagination.total ?? providers.length} provider{providers.length !== 1 ? 's' : ''} found
                </p>
                {(interpreted?.skill || interpreted?.city) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing results for <span className="font-medium text-gray-700">{[interpreted?.skill, interpreted?.city].filter(Boolean).join(' in ')}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {providers.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setCompareOpen(true)}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Compare Top Providers
                  </button>
                )}
                <button
                  onClick={() => doSearch(1)}
                  className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <HiRefresh className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map(p => (
                <ProviderCard
                  key={p._id}
                  provider={p}
                  onView={handleView}
                  onUnlock={handleUnlock}
                  unlocking={unlocking}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => doSearch(currentPage - 1)}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <HiChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  Page {currentPage} of {pagination.pages}
                </span>
                <button
                  disabled={currentPage >= pagination.pages}
                  onClick={() => doSearch(currentPage + 1)}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <HiChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </>
        ) : null}

        {/* Empty initial state */}
        {!hasSearched && !loading && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <HiSearch className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-600">Search for providers</p>
            <p className="text-sm mt-1">Enter a skill or location above to get started</p>
          </div>
        )}
      </div>

      <CompareProvidersModal
        open={compareOpen}
        providers={providers.slice(0, 5)}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  );
};

export default FindProviders;
