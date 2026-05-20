import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiBriefcase, HiEye, HiLockOpen, HiUsers,
  HiSearch, HiPlus, HiChevronRight, HiTrendingUp,
  HiClock, HiCheckCircle, HiExclamationCircle, HiDocumentText, HiTrash,
} from 'react-icons/hi';
import { FaBriefcase, FaUserTie, FaRocket } from 'react-icons/fa';
import { recruiterAPI, searchAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
// import SubscriptionPlansPopup from '../../components/common/SubscriptionPlansPopup';
import toast from 'react-hot-toast';
import useTranslation from '../../hooks/useTranslation';

/* ── Illustrations ──────────────────────────────────────────────────── */
const HiringIllustration = () => (
  <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28 drop-shadow-xl">
    <rect x="20" y="50" width="130" height="90" rx="10" fill="white" fillOpacity="0.25"/>
    <rect x="30" y="60" width="110" height="14" rx="4" fill="white" fillOpacity="0.5"/>
    <rect x="30" y="80" width="80" height="8" rx="3" fill="white" fillOpacity="0.35"/>
    <rect x="30" y="94" width="60" height="8" rx="3" fill="white" fillOpacity="0.25"/>
    <rect x="30" y="108" width="40" height="6" rx="3" fill="white" fillOpacity="0.2"/>
    <circle cx="170" cy="70" r="34" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
    <circle cx="170" cy="58" r="14" fill="#fde68a"/>
    <path d="M147 90 Q170 78 193 90 Q186 104 170 108 Q154 104 147 90Z" fill="#3b82f6" fillOpacity="0.7"/>
    <path d="M158 70 L166 78 L182 62" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StatCard = ({ label, value, Icon, bg, color, trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {trend >= 0 ? '+' : ''}{trend}
        </span>
      )}
    </div>
    <p className="mt-3 text-2xl font-extrabold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

const RecruiterDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  // const [popupReason, setPopupReason] = useState('');
  // const [hasAutoPrompted, setHasAutoPrompted] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => { fetchDashboard(); }, []);

  // useEffect(() => {
  //   const params = new URLSearchParams(location.search);
  //   const shouldOpenPopup = params.get('showSubscriptionPopup') === '1';
  //   if (shouldOpenPopup) {
  //     setShowSubscriptionPopup(true);
  //     params.delete('showSubscriptionPopup');
  //     const cleanedSearch = params.toString();
  //     navigate(`${location.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}`, { replace: true });
  //   }
  // }, [location.pathname, location.search, navigate]);

  const fetchDashboard = async () => {
    try {
      const { data } = await recruiterAPI.getDashboard();
      setDashboard(data);
      const rec = await searchAPI.repeatRecommendations({ limit: 5 });
      setRecommendations(rec.data?.recommendations || []);
    } catch {
      toast.error(t('recruiter.failedLoadDashboard', 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm(t('recruiter.confirmDeleteJob', "Are you sure you want to delete this job posting?"))) return;

    try {
      await recruiterAPI.deleteJob(id);
      toast.success(t('recruiter.jobDeleted', "Job posting deleted"));
      setDashboard(prev => ({
        ...prev,
        jobs: prev.jobs.filter(j => j._id !== id),
        stats: {
          ...prev.stats,
          totalJobsPosted: Math.max(0, (prev.stats.totalJobsPosted || 1) - 1)
        }
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete job");
    }
  };

  const stats = dashboard?.stats || {};
  const jobs = dashboard?.jobs || [];
  const recentUnlocks = dashboard?.recentUnlocks || [];
  const profile = dashboard?.profile || {};
  const isProfileEmpty = !profile.city && !profile.companyName;

  // useEffect(() => {
  //   if (loading || hasAutoPrompted || !dashboard) return;

  //   const isFree = !stats.currentPlan || stats.currentPlan === 'free';
  //   const isExpired =
  //     stats.planStatus === 'expired' ||
  //     (stats.planEndDate && new Date(stats.planEndDate).getTime() <= Date.now());
  //   const postLeft = Number(stats.remainingPostLimit);
  //   const unlockLeft = Number(stats.unlocksRemaining);
  //   const postExhausted = Number.isFinite(postLeft) && postLeft <= 0;
  //   const unlockExhausted = Number.isFinite(unlockLeft) && unlockLeft <= 0;
  //   const isExhausted = postExhausted || unlockExhausted;

  //   if (isFree || isExpired || isExhausted) {
  //     let reason = 'You are on Free plan. Upgrade your subscription to unlock more functionality.';
  //     if (isExpired) {
  //       reason = 'Your subscription has ended. Upgrade now to continue premium functionality.';
  //     } else if (isExhausted) {
  //       reason = 'Your current plan quota is exhausted. Upgrade to continue using premium limits.';
  //     }
  //     setPopupReason(reason);
  //     setShowSubscriptionPopup(true);
  //     setHasAutoPrompted(true);
  //   }
  // }, [loading, hasAutoPrompted, dashboard, stats.currentPlan, stats.planStatus, stats.planEndDate, stats.remainingPostLimit, stats.unlocksRemaining]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" text={t('common.loading', "Loading...")} /></div>;

  const statCards = [
    { label: t('recruiter.currentPlan', 'Current Plan'),          value: stats.currentPlan || 'Free', Icon: HiTrendingUp,    bg: 'bg-amber-50',  color: 'text-amber-600'  },
    { label: t('recruiter.jobsPosted', 'Jobs Posted'),            value: stats.totalJobsPosted         || 0, Icon: HiBriefcase,     bg: 'bg-blue-50',   color: 'text-blue-600'   },
    { label: t('recruiter.appsReceived', 'Applications Received'),  value: stats.totalApplicationsReceived|| 0, Icon: HiDocumentText,  bg: 'bg-teal-50',   color: 'text-teal-600'  },
    { label: t('recruiter.unlockCredits', 'Unlock Credits Remaining'), value: stats.unlocksRemaining ?? 0, Icon: HiLockOpen, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: t('recruiter.postLimitLeft', 'Postings Left (Month)'), value: stats.remainingPostLimit !== undefined ? (stats.remainingPostLimit === 'unlimited' ? '∞' : stats.remainingPostLimit) : '0', Icon: HiUsers, bg: 'bg-green-50', color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen " style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#f8f9ff 60%,#fafafa 100%)' }}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── onboarding banner for fresh accounts ─────────────────── */}
        {isProfileEmpty && (
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold mb-1">👋 {t('recruiter.onboardingTitle', "Welcome! Let's set up your recruiter profile")}</h2>
                <p className="text-indigo-100 text-sm">{t('recruiter.onboardingDesc', "Add your company info and hiring needs to unlock full functionality.")}</p>
              </div>
              <Link to="/recruiter/profile"
                className="shrink-0 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition shadow">
                {t('recruiter.completeProfileBtn', "Complete Profile →")}
              </Link>
            </div>
          </div>
        )}

        {/* Out of Credits / Upgrade Banner */}
        {Number(stats.unlocksRemaining) <= 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5 mb-6 text-white shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-1.5">
                  <HiExclamationCircle className="w-5 h-5 animate-pulse shrink-0" />
                  Profile Unlock Credits Exhausted
                </h2>
                <p className="text-orange-50 text-xs mt-1">
                  You have 0 candidate profile unlocks left. Upgrade your plan or purchase a top-up pack to continue viewing applicants' full contact details!
                </p>
              </div>
              <Link to="/recruiter/plans"
                className="shrink-0 bg-white text-orange-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-orange-50 transition shadow-sm">
                Get More Credits
              </Link>
            </div>
          </div>
        )}

        {/* ── Hero banner ───────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#4f46e5 60%,#7c3aed 100%)' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-blue-200 text-sm font-medium mb-1">{t('common.welcomeBack', 'Welcome back')} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {user?.name?.split(' ')[0] || t('common.recruiter', 'Recruiter')}{t('recruiter.dashboardTitle', "'s Dashboard")}
            </h1>
            <p className="text-blue-100 text-sm mt-2">
              {t('recruiter.planLabel', 'Plan')}: <span className="font-bold text-white capitalize">{stats.currentPlan || 'Free'}</span>
              &nbsp;·&nbsp;
              {stats.unlocksRemaining || 0} {t('recruiter.unlocksLeft', 'unlocks left')}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                to="/recruiter/find-providers"
                className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition shadow-sm"
              >
                <HiSearch className="w-4 h-4" /> {t('recruiter.findProviders', 'Find Providers')}
              </Link>
              <Link
                to="/recruiter/post-job"
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition border border-white/30"
              >
                <HiPlus className="w-4 h-4" /> {t('recruiter.postJob', 'Post a Job')}
              </Link>
            </div>
          </div>
          <div className="relative z-10 shrink-0">
            <HiringIllustration />
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Posted Jobs ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-gray-900">{t('recruiter.postedJobs', 'Posted Jobs')}</h2>
              <Link to="/recruiter/post-job" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                {t('recruiter.postNew', 'Post New')} <HiChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                  <FaBriefcase className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">{t('recruiter.noJobsPosted', 'No jobs posted yet')}</p>
                <Link to="/recruiter/post-job" className="mt-3 text-sm text-blue-600 font-semibold hover:underline">
                  {t('recruiter.postFirstJob', 'Post your first job →')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job, i) => (
                  <div key={i} className="group relative flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <HiBriefcase className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.skill} · {job.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {job.status === 'active' ? <HiCheckCircle className="w-3 h-3" /> : <HiClock className="w-3 h-3" />}
                        {job.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteJob(job._id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title={t('common.delete', 'Delete')}
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Plan card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <HiTrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-extrabold text-gray-900">{t('recruiter.planDetails', 'Plan Details')}</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: t('recruiter.currentPlanLabel', 'Current Plan'),       value: stats.currentPlan || 'Free' },
                  { label: t('recruiter.unlockCredits', 'Unlock Credits'),     value: stats.unlocksRemaining || 0 },
                  { label: t('recruiter.jobsPostedLabel', 'Jobs Posted'),        value: stats.totalJobsPosted || 0 },
                  { label: t('recruiter.postsLeft', 'Posts Left (month)'), value: stats.remainingPostLimit !== undefined ? (stats.remainingPostLimit === 'unlimited' ? '∞' : stats.remainingPostLimit) : '—' },
                  { label: t('recruiter.appsRecv', 'Applications Recv.'), value: stats.totalApplicationsReceived || 0 },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-gray-900 capitalize">{row.value}</span>
                  </div>
                ))}
              </div>
              <Link
                to={`/recruiter/plans?redirect=${encodeURIComponent('/recruiter/dashboard')}`}
                className="mt-4 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 font-bold py-2.5 rounded-xl text-sm hover:bg-blue-100 transition"
              >
                {t('recruiter.upgradePlanBtn', 'Upgrade Plan')} <HiChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Recent unlocks */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-extrabold text-gray-900 mb-4">{t('recruiter.recentUnlocks', 'Recent Unlocks')}</h3>
              {recentUnlocks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{t('recruiter.noUnlocks', 'No unlocks yet')}</p>
              ) : (
                <div className="space-y-2.5">
                  {recentUnlocks.slice(0, 4).map((u, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                        {(u.provider?.name || 'P')[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{u.provider?.name || t('common.provider', 'Provider')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-extrabold text-gray-900 mb-3">{t('recruiter.recommended', 'Recommended Providers')}</h3>
                <div className="space-y-2">
                  {recommendations.map((item) => (
                    <div key={item.providerId} className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                      <p className="text-xs text-indigo-700">Provider ID: {item.providerId}</p>
                      <p className="text-xs text-indigo-600">Repeat Score: {item.repeatScore}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enterprise CTA */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <FaRocket className="w-6 h-6 mb-2 text-yellow-300" />
                <h3 className="font-extrabold mb-1">{t('recruiter.bulkHiring', 'Need bulk hiring?')}</h3>
                <p className="text-xs text-indigo-100 mb-4">{t('recruiter.enterpriseDesc', 'Enterprise plan: unlimited search, contacts & dedicated support.')}</p>
                <Link
                  to={`/recruiter/plans?redirect=${encodeURIComponent('/recruiter/dashboard')}`}
                  className="block text-center bg-white text-indigo-700 font-bold py-2 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  {t('recruiter.viewPlans', 'View Plans')}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
{/* 
      <SubscriptionPlansPopup
        role="recruiter"
        currentPlan={stats.currentPlan || 'free'}
        open={showSubscriptionPopup}
        onClose={() => setShowSubscriptionPopup(false)}
        redirectTo="/recruiter/dashboard"
        reason={popupReason}
      /> */}
    </div>
  );
};

export default RecruiterDashboard;
