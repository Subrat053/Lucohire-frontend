import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiEye, HiUsers, HiPhone, HiTrendingUp, HiStar, HiClock, HiCheckCircle, HiBell, HiBriefcase, HiDocumentText, HiSparkles, HiLocationMarker, HiLockClosed, HiArrowRight, HiRefresh } from 'react-icons/hi';
import { providerAPI } from '../../services/api';
import { getIncomeOpportunities } from '../../services/providerAIService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
// import SubscriptionPlansPopup from '../../components/common/SubscriptionPlansPopup';
import BoostSuggestionCard from '../../components/provider/BoostSuggestionCard';
import toast from 'react-hot-toast';
import useTranslation from '../../hooks/useTranslation';

const DASHBOARD_CACHE_TTL = 60 * 1000;
const dashboardCache = {
  data: null,
  ts: 0,
  inflight: null,
};
const matchesCache = {
  data: null,
  ts: 0,
  inflight: null,
};

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topJobs, setTopJobs] = useState([]);

  // AI-08: Income Opportunities
  const [incomeLoading, setIncomeLoading] = useState(true);
  const [incomeData, setIncomeData] = useState(null);
  const [incomeIsLocked, setIncomeIsLocked] = useState(false);

  const loadDashboard = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const dashboardFresh =
      !forceRefresh &&
      dashboardCache.data &&
      now - dashboardCache.ts < DASHBOARD_CACHE_TTL;
    const matchesFresh =
      !forceRefresh &&
      matchesCache.data &&
      now - matchesCache.ts < DASHBOARD_CACHE_TTL;

    if (forceRefresh) {
      dashboardCache.data = null;
      dashboardCache.ts = 0;
      dashboardCache.inflight = null;
      matchesCache.data = null;
      matchesCache.ts = 0;
      matchesCache.inflight = null;
    }

    // Instantly populate state from cache to eliminate loading screens
    if (dashboardCache.data) {
      setDashboard(dashboardCache.data);
    }
    if (matchesCache.data) {
      setTopJobs(matchesCache.data);
    }

    // If cache is fresh, skip api call and exit loading state
    if (dashboardFresh && matchesFresh) {
      setLoading(false);
      return;
    }

    // Only display full-screen skeleton if we have no cached data at all
    if (!dashboardCache.data) {
      setLoading(true);
    }

    const dashboardPromise = dashboardFresh
      ? Promise.resolve({ data: dashboardCache.data })
      : (dashboardCache.inflight ||= providerAPI.getDashboard());

    const matchesPromise = matchesFresh
      ? Promise.resolve({ data: { success: true, data: matchesCache.data } })
      : (matchesCache.inflight ||= providerAPI.getMatches().catch(() => ({ data: { data: [] } })));

    try {
      const [dashboardRes, matchesRes] = await Promise.all([
        dashboardPromise,
        matchesPromise,
      ]);

      const dashboardData = dashboardRes.data;
      const matchesData = matchesRes.data?.data || [];

      dashboardCache.data = dashboardData;
      dashboardCache.ts = Date.now();
      matchesCache.data = matchesData;
      matchesCache.ts = Date.now();

      setDashboard(dashboardData);
      if (matchesRes.data?.success) {
        setTopJobs(matchesData);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error(t('provider.failedLoadDashboard', 'Failed to load dashboard'));
      }
    } finally {
      if (!dashboardFresh) dashboardCache.inflight = null;
      if (!matchesFresh) matchesCache.inflight = null;
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // AI-08: Fetch income opportunities on mount
  useEffect(() => {
    let cancelled = false;
    const fetchIncomePaths = async () => {
      try {
        setIncomeLoading(true);
        const res = await getIncomeOpportunities();
        if (!cancelled && res.data?.success) {
          setIncomeData(res.data.data);
          setIncomeIsLocked(res.data.isLocked || false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[AI-08] Failed to fetch income opportunities:', err.message);
        }
      } finally {
        if (!cancelled) setIncomeLoading(false);
      }
    };
    fetchIncomePaths();
    return () => { cancelled = true; };
  }, []);

  const [scraping, setScraping] = useState(false);

  const handleScrapeMatches = async () => {
    try {
      setScraping(true);
      const res = await providerAPI.scrapeMatches();
      if (res.data?.success) {
        const scrapedMatches = res.data.data || [];
        matchesCache.data = scrapedMatches;
        matchesCache.ts = Date.now();
        setTopJobs(scrapedMatches);
        toast.success(t('provider.scrapedMatches', 'Successfully fetched new matches!'));
      }
    } catch (error) {
      toast.error(t('provider.failedScrape', 'Failed to scrape new matches.'));
    } finally {
      setScraping(false);
    }
  };
  const stats = dashboard?.stats || {};
  const leads = dashboard?.leads || [];
  const profile = dashboard?.profile || {};
  const aiInsights = dashboard?.ai_insights || {};
  const isProfileEmpty = !profile.city && !profile.skills?.length;
  const planDisplayName = stats.isDefaultPlan
    ? 'Default Monthly Plan'
    : (stats.planName || (stats.currentPlan === 'provider-free-default' ? 'Free' : stats.currentPlan) || 'Free');

  // useEffect(() => {
  //   if (loading || hasAutoPrompted || !dashboard) return;

  //   const forcePopupOnProviderPanel = true;
  //   const isFree = !stats.currentPlan || stats.currentPlan === 'free';
  //   const isExpired =
  //     stats.planStatus === 'expired' ||
  //     (stats.planEndDate && new Date(stats.planEndDate).getTime() <= Date.now());
  //   const applyLeft = Number(stats.remainingApplyLimit);
  //   const isExhausted = Number.isFinite(applyLeft) && applyLeft <= 0;

  //   if (forcePopupOnProviderPanel || isFree || isExpired || isExhausted) {
  //     let reason = 'Choose a subscription plan to get the best visibility and lead conversion.';
  //     if (isExpired) {
  //       reason = 'Your subscription has ended. Upgrade now to continue premium functionality.';
  //     } else if (isExhausted) {
  //       reason = 'Your current plan quota is exhausted. Upgrade to continue using premium limits.';
  //     } else if (isFree) {
  //       reason = 'You are on Free plan. Upgrade your subscription to unlock more functionality.';
  //     }
  //     setPopupReason(reason);
  //     setShowSubscriptionPopup(true);
  //     setHasAutoPrompted(true);
  //   }
  // }, [loading, hasAutoPrompted, dashboard, stats.currentPlan, stats.planStatus, stats.planEndDate, stats.remainingApplyLimit]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-32 flex justify-between items-start">
            <div className="space-y-3 w-full">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-48">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-64">
             <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
             <div className="space-y-4">
               {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl w-full"></div>)}
             </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-64">
             <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
             <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('provider.welcome', 'Welcome')}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 mt-1">{t('provider.dashboardOverview', "Here's your provider dashboard overview")}</p>
          {stats.subscriptionBadge && (
            <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200 font-semibold">{stats.subscriptionBadge}</span>
          )}
        </div>
      </div>

      {/* New user onboarding banner */}
      {isProfileEmpty && (
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold mb-1">👋 {t('provider.onboardingTitle', 'Welcome! Complete your profile to get leads')}</h2>
              <p className="text-blue-100 text-sm">{t('provider.onboardingDesc', 'Add your skills, location, and a photo so recruiters can find you.')}</p>
            </div>
            <Link to="/provider/profile"
              className="shrink-0 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition shadow">
              {t('provider.setUpProfile', 'Set Up Profile →')}
            </Link>
          </div>
        </div>
      )}

      {/* Profile Completion */}
      {!isProfileEmpty && stats.profileCompletion < 100 && (
        <div className="bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-800">{t('provider.completeProfile', 'Complete your profile')}</span>
            <span className="text-sm font-bold text-amber-700">{stats.profileCompletion}%</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2.5">
            <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${stats.profileCompletion}%` }}></div>
          </div>
          <p className="text-sm text-amber-700 mt-2">{t('provider.completeProfileDesc', 'Complete your profile to get more leads and appear in search results.')}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { label: t('provider.currentPlan', 'Current Plan'),      value: planDisplayName, icon: HiTrendingUp, color: 'bg-orange-50 text-orange-600' },
          { label: t('provider.profileViews', 'Profile Views'),     value: stats.profileViews     || 0, icon: HiEye,          color: 'bg-blue-50 text-blue-600'    },
          { label: t('provider.leadsReceived', 'Leads Received'),    value: stats.leadsReceived    || 0, icon: HiUsers,         color: 'bg-green-50 text-green-600'  },
          { label: t('provider.contactsUnlocked', 'Contacts Unlocked'), value: stats.contactsUnlocked || 0, icon: HiPhone,         color: 'bg-purple-50 text-purple-600' },
          { label: t('provider.availableJobs', 'Available Jobs'),    value: stats.availableJobs    || 0, icon: HiBriefcase,     color: 'bg-indigo-50 text-indigo-600' },
          { label: t('provider.appliedJobs', 'Applied Jobs'),      value: stats.appliedJobs      || 0, icon: HiDocumentText,  color: 'bg-teal-50 text-teal-600'    },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI-08: Income Opportunities Dashboard */}
      <IncomeOpportunitiesSection
        loading={incomeLoading}
        data={incomeData}
        isLocked={incomeIsLocked}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Leads */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t('provider.recentLeads', 'Recent Leads')}</h2>
              <Link to="/provider/leads" className="text-sm text-indigo-600 hover:underline">{t('common.viewAll', 'View All →')}</Link>
            </div>
            {leads.length > 0 ? (
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-sm">{lead.recruiter?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 capitalize">{lead.type?.replace('_', ' ')} • {new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      lead.status === 'new' ? 'bg-green-100 text-green-700' :
                      lead.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'contacted' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{lead.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <HiBell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">{t('provider.noLeads', 'No leads yet. Complete your profile to get started!')}</p>
              </div>
            )}
          </div>

        </div>

        {/* Quick Info */}
        <div className="space-y-6">
          {Array.isArray(aiInsights.tips) && aiInsights.tips.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">AI Insights</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {aiInsights.tips.map((tip) => (
                  <li key={tip} className="rounded-lg bg-blue-50 border border-blue-100 p-2">{tip}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                {t('provider.confidence', 'Confidence')}: {Math.round(Number(aiInsights.confidence || 0) * 100)}%
              </p>
            </div>
          )}

          <BoostSuggestionCard
            suggestion={{
              message: aiInsights.summary || '',
              skill: profile.skills?.[0] || '',
              city: profile.city || '',
            }}
          />

          {/* Plan Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-3">{t('provider.planDetails', 'Plan Details')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('provider.currentPlan', 'Current Plan')}</span>
                <span className="font-medium">{planDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('provider.planStatus', 'Plan Status')}</span>
                <span className="font-medium capitalize">{stats.planStatus || 'inactive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('provider.planExpires', 'Plan Expires')}</span>
                <span className="font-medium">{stats.planEndDate ? new Date(stats.planEndDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('provider.applyLimitLeft', 'Apply Limit Left')}</span>
                <span className="font-medium">{stats.remainingApplyLimit !== undefined ? (stats.remainingApplyLimit === 'unlimited' ? '∞' : stats.remainingApplyLimit) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('provider.skillsUsed', 'Skills Used')}</span>
                <span className="font-medium">{profile.skills?.length || 0} / {['free', 'provider-free-default'].includes(stats.currentPlan) ? 4 : '∞'}</span>
              </div>
            </div>
            <Link to={`/provider/plans?redirect=${encodeURIComponent('/provider/dashboard')}`} className="block mt-4 text-center bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition">
              {t('provider.upgradePlanBtn', 'Upgrade Plan →')}
            </Link>
          </div>

          {/* WhatsApp Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-3">{t('provider.whatsappAlerts', 'WhatsApp Alerts')}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('provider.leadNotifications', 'Lead notifications')}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.whatsappAlerts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {profile.whatsappAlerts ? t('common.on', 'ON') : t('common.off', 'OFF')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* <SubscriptionPlansPopup
        role="provider"
        currentPlan={stats.currentPlan || 'free'}
        open={showSubscriptionPopup}
        onClose={() => setShowSubscriptionPopup(false)}
        redirectTo="/provider/dashboard"
        reason={popupReason}
      /> */}
    </div>
  );
};

// ── AI-08: Income Opportunities Section ──────────────────────────────────────

const PATH_ICONS = {
  full_time:     { emoji: '🏢', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  part_time:     { emoji: '⏰', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  freelance:     { emoji: '💻', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  contract:      { emoji: '📝', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  consulting:    { emoji: '🎯', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  local_service: { emoji: '📍', color: 'bg-green-50 text-green-700 border-green-100' },
  remote:        { emoji: '🌐', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
};

const PRIORITY_STYLES = {
  High:   'bg-green-100 text-green-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low:    'bg-gray-100 text-gray-600',
};

function IncomeOpportunitiesSection({ loading, data, isLocked }) {
  const navigate = useNavigate();
  const paths = data?.recommended_paths || [];

  // Map path_type → exact JobPost schema enum values
  // scheduleType: 'one_time' | 'part_time' | 'full_time' | 'flexible' | 'shift'
  // workMode: 'onsite' | 'remote' | 'hybrid' | 'travel'
  const PATH_TYPE_HINTS = {
    full_time:     { scheduleType: 'full_time' },
    part_time:     { scheduleType: 'part_time' },
    freelance:     { scheduleType: 'flexible' },
    contract:      { scheduleType: 'shift' },
    consulting:    { scheduleType: 'flexible' },
    local_service: { workMode: 'onsite' },
    remote:        { workMode: 'remote' },
  };

  const handleFindJobs = (path) => {
    navigate('/provider/job-for-me', {
      state: {
        fromIncomePath: true,
        pathType: path.path_type,
        pathTitle: path.title,
        ...PATH_TYPE_HINTS[path.path_type],
      },
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-5 bg-indigo-100 rounded-full w-16 animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[240px] bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3 flex-shrink-0">
              <div className="h-8 w-8 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-6 bg-gray-200 rounded-full w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No data yet (e.g., profile incomplete)
  if (!data || paths.length === 0) {
    return (
      <div className="mb-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <HiSparkles className="text-indigo-500 w-5 h-5" />
          <h2 className="font-bold text-gray-900">Your Income Opportunities</h2>
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">AI</span>
        </div>
        <p className="text-sm text-gray-500">
          Complete your profile with skills and location to get personalized income path recommendations.
        </p>
        <Link to="/provider/profile" className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          Complete Profile <HiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <HiSparkles className="text-indigo-500 w-5 h-5" />
          <h2 className="font-bold text-gray-900">Your Income Opportunities</h2>
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">AI</span>
          <span className="text-xs text-gray-400 font-medium">Updated weekly</span>
        </div>
        <Link to="/provider/job-for-me" className="text-sm text-indigo-600 hover:underline font-medium">
          Browse All Jobs →
        </Link>
      </div>

      {/* AI Summary */}
      {data.summary && (
        <p className="text-sm text-gray-500 mb-4 max-w-2xl">{data.summary}</p>
      )}

      {/* Cards Row */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
        {paths.map((path, idx) => {
          const meta = PATH_ICONS[path.path_type] || PATH_ICONS.full_time;
          return (
            <div
              key={idx}
              className="min-w-[240px] max-w-[260px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow group"
            >
              {/* Icon + type badge */}
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${meta.color} rounded-xl flex items-center justify-center text-lg border`}>
                  {meta.emoji}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[path.priority] || PRIORITY_STYLES.Medium}`}>
                  {path.priority}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{path.title}</h3>

              {/* Reason */}
              <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{path.reason}</p>

              {/* Weekly earning chip */}
              {path.weekly_earning_estimate && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2.5 py-1 text-xs font-bold mb-3">
                  💰 {path.weekly_earning_estimate}
                </div>
              )}

              {/* Action step */}
              {path.action_step && (
                <p className="text-xs text-indigo-600 font-medium leading-snug mb-3">
                  → {path.action_step}
                </p>
              )}

              {/* CTA — navigate with path context so Jobs page can pre-filter */}
              <button
                onClick={() => handleFindJobs(path)}
                className="flex items-center justify-center gap-1 w-full text-xs font-semibold py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white"
              >
                Find Jobs <HiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Premium lock card — shown only if free tier and there are more paths */}
        {isLocked && (
          <div className="min-w-[220px] flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
              <HiLockClosed className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">+4 More Paths</p>
              <p className="text-xs text-gray-500 mt-1">Upgrade to unlock all income opportunities.</p>
            </div>
            <Link
              to="/provider/plans"
              className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderDashboard;
