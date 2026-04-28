import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiEye, HiUsers, HiPhone, HiTrendingUp, HiStar, HiClock, HiCheckCircle, HiBell, HiBriefcase, HiDocumentText } from 'react-icons/hi';
import { providerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SubscriptionPlansPopup from '../../components/common/SubscriptionPlansPopup';
import BoostSuggestionCard from '../../components/provider/BoostSuggestionCard';
import toast from 'react-hot-toast';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [popupReason, setPopupReason] = useState('');
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenPopup = params.get('showSubscriptionPopup') === '1';
    if (shouldOpenPopup) {
      setShowSubscriptionPopup(true);
      params.delete('showSubscriptionPopup');
      const cleanedSearch = params.toString();
      navigate(`${location.pathname}${cleanedSearch ? `?${cleanedSearch}` : ''}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const fetchDashboard = async () => {
    try {
      const { data } = await providerAPI.getDashboard();
      setDashboard(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };
  const stats = dashboard?.stats || {};
  const leads = dashboard?.leads || [];
  const profile = dashboard?.profile || {};
  const aiInsights = dashboard?.ai_insights || {};
  const isProfileEmpty = !profile.city && !profile.skills?.length;
  const planDisplayName = stats.isDefaultPlan
    ? 'Default Monthly Plan'
    : (stats.planName || stats.currentPlan || 'Free');

  useEffect(() => {
    if (loading || hasAutoPrompted || !dashboard) return;

    const forcePopupOnProviderPanel = true;
    const isFree = !stats.currentPlan || stats.currentPlan === 'free';
    const isExpired =
      stats.planStatus === 'expired' ||
      (stats.planEndDate && new Date(stats.planEndDate).getTime() <= Date.now());
    const applyLeft = Number(stats.remainingApplyLimit);
    const isExhausted = Number.isFinite(applyLeft) && applyLeft <= 0;

    if (forcePopupOnProviderPanel || isFree || isExpired || isExhausted) {
      let reason = 'Choose a subscription plan to get the best visibility and lead conversion.';
      if (isExpired) {
        reason = 'Your subscription has ended. Upgrade now to continue premium functionality.';
      } else if (isExhausted) {
        reason = 'Your current plan quota is exhausted. Upgrade to continue using premium limits.';
      } else if (isFree) {
        reason = 'You are on Free plan. Upgrade your subscription to unlock more functionality.';
      }
      setPopupReason(reason);
      setShowSubscriptionPopup(true);
      setHasAutoPrompted(true);
    }
  }, [loading, hasAutoPrompted, dashboard, stats.currentPlan, stats.planStatus, stats.planEndDate, stats.remainingApplyLimit]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading dashboard..." /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's your provider dashboard overview</p>
          {stats.subscriptionBadge && (
            <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200 font-semibold">{stats.subscriptionBadge}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 items-center">
          <Link to="/provider/find-recruiters" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1.5">
            <HiBriefcase className="w-4 h-4" /> Find Recruiters
          </Link>
          <Link to="/provider/profile" className="border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Edit Profile
          </Link>
          <Link to={`/provider/plans?redirect=${encodeURIComponent('/provider/dashboard')}`} className="border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition">
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* New user onboarding banner */}
      {isProfileEmpty && (
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold mb-1">👋 Welcome! Complete your profile to get leads</h2>
              <p className="text-blue-100 text-sm">Add your skills, location, and a photo so recruiters can find you.</p>
            </div>
            <Link to="/provider/profile"
              className="shrink-0 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition shadow">
              Set Up Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Profile Completion */}
      {!isProfileEmpty && stats.profileCompletion < 100 && (
        <div className="bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-800">Complete your profile</span>
            <span className="text-sm font-bold text-amber-700">{stats.profileCompletion}%</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2.5">
            <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${stats.profileCompletion}%` }}></div>
          </div>
          <p className="text-sm text-amber-700 mt-2">Complete your profile to get more leads and appear in search results.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Current Plan',      value: planDisplayName, icon: HiTrendingUp, color: 'bg-orange-50 text-orange-600' },
          { label: 'Profile Views',     value: stats.profileViews     || 0, icon: HiEye,          color: 'bg-blue-50 text-blue-600'    },
          { label: 'Leads Received',    value: stats.leadsReceived    || 0, icon: HiUsers,         color: 'bg-green-50 text-green-600'  },
          { label: 'Contacts Unlocked', value: stats.contactsUnlocked || 0, icon: HiPhone,         color: 'bg-purple-50 text-purple-600' },
          { label: 'Available Jobs',    value: stats.availableJobs    || 0, icon: HiBriefcase,     color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Applied Jobs',      value: stats.appliedJobs      || 0, icon: HiDocumentText,  color: 'bg-teal-50 text-teal-600'    },
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Leads</h2>
            <Link to="/provider/leads" className="text-sm text-indigo-600 hover:underline">View All →</Link>
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
              <p className="text-gray-400">No leads yet. Complete your profile to get started!</p>
            </div>
          )}
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
                Confidence: {Math.round(Number(aiInsights.confidence || 0) * 100)}%
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
            <h3 className="font-bold text-gray-900 mb-3">Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Plan</span>
                <span className="font-medium">{planDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Status</span>
                <span className="font-medium capitalize">{stats.planStatus || 'inactive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Expires</span>
                <span className="font-medium">{stats.planEndDate ? new Date(stats.planEndDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Apply Limit Left</span>
                <span className="font-medium">{stats.remainingApplyLimit !== undefined ? (stats.remainingApplyLimit === 'unlimited' ? '∞' : stats.remainingApplyLimit) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Skills Used</span>
                <span className="font-medium">{profile.skills?.length || 0} / {stats.currentPlan === 'free' ? 4 : '∞'}</span>
              </div>
            </div>
            <Link to={`/provider/plans?redirect=${encodeURIComponent('/provider/dashboard')}`} className="block mt-4 text-center bg-indigo-50 text-indigo-600 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition">
              Upgrade Plan →
            </Link>
          </div>

          {/* WhatsApp Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-3">WhatsApp Alerts</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lead notifications</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.whatsappAlerts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {profile.whatsappAlerts ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionPlansPopup
        role="provider"
        currentPlan={stats.currentPlan || 'free'}
        open={showSubscriptionPopup}
        onClose={() => setShowSubscriptionPopup(false)}
        redirectTo="/provider/dashboard"
        reason={popupReason}
      />
    </div>
  );
};

export default ProviderDashboard;
