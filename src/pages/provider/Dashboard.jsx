import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { providerAPI } from '../../services/api';
import { getIncomeOpportunities } from '../../services/providerAIService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import useTranslation from '../../hooks/useTranslation';
import { confirmPaymentSuccess } from '../../services/providerPlanService';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  Briefcase, ArrowRight, Lock, RefreshCcw, Eye, FileText, CheckCircle2, Sparkles
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const DASHBOARD_CACHE_TTL = 0; // Disable cache so count updates immediately
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
  const navigate = useNavigate();
  const location = useLocation();
  const paymentHandledRef = useRef(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topJobs, setTopJobs] = useState([]);
  const [topJobsCount, setTopJobsCount] = useState(0);

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

    if (dashboardCache.data) {
      setDashboard(dashboardCache.data);
    }
    if (matchesCache.data) {
      setTopJobs(matchesCache.data.data);
      setTopJobsCount(matchesCache.data.totalCount || matchesCache.data.data?.length || 0);
    }

    if (dashboardFresh && matchesFresh) {
      setLoading(false);
      return;
    }

    if (!dashboardCache.data) {
      setLoading(true);
    }

    const dashboardPromise = dashboardFresh
      ? Promise.resolve({ data: dashboardCache.data })
      : (dashboardCache.inflight ||= providerAPI.getDashboard());

    const matchesPromise = matchesFresh
      ? Promise.resolve({ data: { success: true, data: matchesCache.data.data, totalCount: matchesCache.data.totalCount } })
      : (matchesCache.inflight ||= providerAPI.getMatches().catch(() => ({ data: { data: [], totalCount: 0 } })));

    try {
      const [dashboardRes, matchesRes] = await Promise.all([
        dashboardPromise,
        matchesPromise,
      ]);

      const dashboardData = dashboardRes.data;
      const matchesData = matchesRes.data?.data || [];
      const matchesTotalCount = matchesRes.data?.totalCount || matchesData.length;

      dashboardCache.data = dashboardData;
      dashboardCache.ts = Date.now();
      matchesCache.data = { data: matchesData, totalCount: matchesTotalCount };
      matchesCache.ts = Date.now();

      setDashboard(dashboardData);
      if (matchesRes.data?.success) {
        setTopJobs(matchesData);
        setTopJobsCount(matchesTotalCount);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (paymentHandledRef.current) return;

    if (params.get('success') === 'true' && params.get('sub_id')) {
      const subId = params.get('sub_id');
      const sessionId = params.get('session_id');

      const finalizePayment = async () => {
        paymentHandledRef.current = true;
        try {
          await confirmPaymentSuccess({
            subscriptionId: subId,
            paymentId: sessionId,
            orderId: 'stripe_session',
          });
          toast.success('Payment confirmed! Your WhatsApp plan is now active.');
          // Remove query params
          navigate('/provider/dashboard', { replace: true });
          // Reload dashboard stats
          loadDashboard(true);
        } catch (err) {
          toast.error('Failed to confirm payment status.');
        }
      };

      finalizePayment();
    }
  }, [location.search, navigate, loadDashboard]);

  const handleWhatsappCheckout = async () => {
    try {
      toast.loading('Redirecting to checkout...', { id: 'whatsapp-checkout' });
      const { data } = await providerAPI.checkoutWhatsappPlan();
      if (data?.checkout?.url) {
        window.location.href = data.checkout.url;
      } else {
        toast.error('Could not get checkout URL', { id: 'whatsapp-checkout' });
      }
    } catch (err) {
      console.error('WhatsApp Checkout error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate checkout', { id: 'whatsapp-checkout' });
    }
  };

  const profile = dashboard?.profile || {};
  const stats = dashboard?.stats || {};
  const hasPremiumInsights = dashboard?.subscription && !dashboard.subscription.isDefault;
  const waEndDate = dashboard?.subscription?.whatsappPlanEndDate;
  const waDaysLeft = waEndDate 
    ? Math.max(0, Math.ceil((new Date(waEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isProfileEmpty = !profile.city && !profile.skills?.length;
  const profileCompletion = stats.profileCompletion || 60; // Mock default if missing
  const activeJobsCount = topJobsCount || 0;
  const freelanceCount = 0;
  const resumeScore = stats.resumeScore || 0;

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-64"></div>
        </div>
      </div>
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
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good Afternoon, {user?.name?.split(' ')[0] || 'Ananya'}! 👋</h1>
          <p className="text-gray-500 mt-1">AI analyzed your profile and found the best opportunities for you.</p>
        </div>
      </div>

      {/* Main Grid: 3 columns layout (2 for content, 1 for sidebar) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Content (col-span-2) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Match Jobs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-teal-700" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Top Match Jobs</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{activeJobsCount}</div>
              <Link to="/provider/job-for-me" className="text-sm text-teal-700 font-bold hover:underline flex items-center gap-1 mt-1">
                View Matches <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Freelance Opportunities */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Freelance Opportunities</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{freelanceCount}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">Near your location</div>
              
              {/* WhatsApp Floating Icon */}
              <div className="absolute right-5 bottom-5 w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-110">
                <FaWhatsapp className="w-6 h-6" />
              </div>
            </div>

            {/* Resume Score */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-700">Resume Score</span>
                <div className="text-3xl font-bold text-gray-900 mt-2 mb-1">{resumeScore}<span className="text-sm text-gray-400 font-semibold">/100</span></div>
                <div className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-block mt-1 ${
                  resumeScore >= 80 ? 'text-green-700 bg-green-50' :
                  resumeScore >= 60 ? 'text-teal-700 bg-teal-50' :
                  'text-orange-700 bg-orange-50'
                }`}>
                  {resumeScore >= 80 ? 'Excellent' : resumeScore >= 60 ? 'Good - Needs Improvement' : 'Needs Improvement'}
                </div>
              </div>
              <div className="w-16 h-16 shrink-0 relative">
                <CircularProgressbar 
                  value={resumeScore} 
                  strokeWidth={10} 
                  styles={buildStyles({
                    pathColor: '#0f766e', // teal-700
                    trailColor: '#f1f5f9', // slate-100
                    strokeLinecap: 'round',
                  })}
                />
              </div>
            </div>
          </div>

          {/* Profile Completion Banner */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="p-2.5 bg-teal-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-teal-700" />
              </div>
              <div className="flex-1 max-w-sm">
                <div className="text-[13px] font-bold text-gray-800 mb-2">Complete your profile to increase match accuracy</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${profileCompletion}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-teal-700 whitespace-nowrap">{profileCompletion}% Complete</span>
                </div>
              </div>
            </div>
            <Link to="/provider/profile" className="shrink-0 w-full sm:w-auto text-center px-5 py-2.5 border-2 border-teal-700 text-teal-700 text-sm font-bold rounded-xl hover:bg-teal-50 transition">
              Complete Now
            </Link>
          </div>

          {/* AI Insights Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Your AI Insights 
                {!hasPremiumInsights && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full">Premium</span>
                )}
                {!hasPremiumInsights && <Lock className="w-3.5 h-3.5 text-gray-400" />}
              </h2>
              {!hasPremiumInsights ? (
                <Link to="/provider/plans" className="text-sm text-teal-700 hover:underline flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5" /> Unlock all insights with AI Pro
                </Link>
              ) : (
                <span className="text-sm text-teal-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Unlocked
                </span>
              )}
            </div>
            
            {!hasPremiumInsights ? (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {['ATS Score', 'Skill Gap', 'Interview Readiness', 'Career Roadmap', 'Salary Insights'].map((insight, idx) => (
                  <div key={idx} className="min-w-[150px] h-[130px] bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 relative group overflow-hidden cursor-pointer hover:border-teal-200 transition-colors">
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center pt-2">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm mb-3 ${
                        idx === 0 ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                        idx === 1 ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        idx === 2 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        idx === 3 ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        <Lock className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-gray-400 text-center z-0">{insight}</div>
                    <div className="absolute bottom-4 text-[11px] font-bold text-teal-700 z-20">
                      View Sample
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dashboard?.ai_insights?.summary && (
                  <p className="text-sm text-gray-700 bg-teal-50 p-3 rounded-xl border border-teal-100 mb-2">
                    {dashboard.ai_insights.summary}
                  </p>
                )}
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                  {(dashboard?.ai_insights?.tips?.length > 0 ? dashboard.ai_insights.tips : ['Improve your ATS score by adding more keywords', 'Add more skills to your profile', 'Prepare for technical interviews']).map((tip, idx) => (
                    <div key={idx} className="min-w-[200px] max-w-[250px] h-[130px] bg-white border border-teal-100 rounded-2xl p-4 flex flex-col justify-center gap-2 relative group hover:border-teal-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-1 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-medium text-gray-800 line-clamp-3 leading-relaxed">{tip}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Matching Jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                Top Matching Jobs for You
                <button onClick={() => loadDashboard(true)} className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-teal-100 transition-colors">
                    <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Refreshing...' : 'Refresh Matches'}
                </button>
              </h2>
              <Link to="/provider/job-for-me" className="text-sm font-bold text-teal-700 hover:underline flex items-center gap-1">
                View All Jobs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
              <div className="space-y-4">
                {topJobs.length > 0 ? topJobs.slice(0, 3).map((job, idx) => {
                  const role = job.title || 'Professional';
                  const company = job.company || 'Company';
                  const location = job.city || job.location?.city || 'Remote';
                  const mode = job.workMode || 'Flexible';
                  const salary = job.budgetMin ? `₹${job.budgetMin} - ${job.budgetMax} ${job.budgetType === 'yearly' ? 'LPA' : '/mo'}` : 'Not specified';
                  const tags = job.skills || [];
                  const displayedTags = tags.slice(0, 3);
                  const extraTags = tags.length > 3 ? tags.length - 3 : 0;
                  
                  return (
                    <div key={job._id || idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm border border-gray-100 bg-gray-50 text-gray-700`}>
                            {company.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link to="/provider/job-for-me" className="font-bold text-gray-900 text-base hover:text-teal-600 transition-colors">{role}</Link>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1.5 font-medium">
                              <span className="text-blue-600 flex items-center gap-1">{company} <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /></span>
                              <span className="text-gray-300">•</span>
                              <span>{location}</span>
                              <span className="text-gray-300 hidden sm:inline">•</span>
                              <span className="text-gray-600">{mode}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <span className="font-bold text-gray-700 text-sm">{salary}</span>
                              <div className="flex gap-1.5">
                                {displayedTags.map((tag, i) => (
                                  <span key={i} className="bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-md text-[10px] font-bold">{tag}</span>
                                ))}
                                {extraTags > 0 && <span className="bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-md text-[10px] font-bold">+{extraTags}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col items-center sm:items-end justify-between h-full space-y-0 sm:space-y-4 w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="text-left sm:text-right">
                            <div className="text-teal-700 font-extrabold text-sm">95% Match</div>
                            <div className="text-teal-600/70 text-[11px] font-bold mt-0.5">Great Match</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="text-gray-300 hover:text-gray-500 transition-colors">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            </button>
                            <Link to="/provider/job-for-me" className="bg-[#0f766e] hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm inline-block text-center">
                              View Job
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    <p className="text-gray-500 text-sm font-medium">No matching jobs found right now.</p>
                  </div>
                  )}
              
              <div className="text-center pt-2 pb-6">
                <Link to="/provider/job-for-me" className="text-teal-700 font-bold text-sm hover:underline flex items-center justify-center gap-1.5">
                  View All Matching Jobs <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar (col-span-1) */}
        <div className="space-y-6">
          
          {/* Freelance Alerts Premium Card */}
          <div className={`rounded-3xl p-6 text-white relative overflow-hidden shadow-lg border ${profile.whatsappFreelancePlanActive ? 'bg-teal-700 border-teal-600' : 'bg-[#0f766e] border-teal-800'}`}>
            {/* Decorative background element */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm z-10 ${profile.whatsappFreelancePlanActive ? 'bg-white text-teal-600' : 'bg-orange-400 border-2 border-[#0f766e]'}`}>
                  {profile.whatsappFreelancePlanActive ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-bold">💰</span>}
                </div>
                <span className="font-bold text-sm tracking-tight">{profile.whatsappFreelancePlanActive ? 'Active Plan' : 'LucoHire Freelance Alerts'}</span>
                {!profile.whatsappFreelancePlanActive && <span className="bg-orange-400 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ml-1">New</span>}
              </div>
              
              <h2 className="text-2xl font-extrabold mb-2 tracking-tight">{profile.whatsappFreelancePlanActive ? 'WhatsApp Alerts Enabled' : 'Earn Extra Income'}</h2>
              <p className="text-teal-50 text-[13px] mb-6 leading-relaxed font-medium">
                {profile.whatsappFreelancePlanActive 
                  ? 'You are now receiving verified freelance work instantly on your WhatsApp.' 
                  : 'Get verified freelance work delivered instantly on WhatsApp.'}
              </p>
              
              {profile.whatsappFreelancePlanActive ? (
                <div className="w-full bg-teal-800/50 text-teal-50 font-bold py-3.5 rounded-xl flex flex-col items-center justify-center gap-1 border border-teal-600 shadow-inner">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-300" /> Receiving Daily Alerts
                  </div>
                  {waDaysLeft > 0 && <span className="text-xs font-normal text-teal-200">({waDaysLeft} days remaining)</span>}
                </div>
              ) : (
                <>
                  <ul className="space-y-3 mb-8 text-[13px] text-white font-medium">
                    <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" /> Weekend Projects</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" /> Part-Time Work</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" /> Nearby Opportunities</li>
                    <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" /> Verified Clients Only</li>
                  </ul>

                  <div className="flex justify-between items-end mb-4 bg-teal-800/30 p-3 rounded-2xl border border-teal-600/30">
                    <div>
                      <div className="text-sm font-extrabold">Just ₹1/day</div>
                    </div>
                    <div className="text-[11px] text-teal-100 font-medium">Only ₹30/month</div>
                  </div>

                  <button 
                    onClick={handleWhatsappCheckout}
                    className="w-full bg-white text-teal-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-50 transition shadow-md">
                    Enable Alerts <div className="w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center"><FaWhatsapp className="w-3.5 h-3.5 text-white" /></div>
                  </button>
                  <div className="text-center text-[10px] text-teal-200 mt-3 font-medium">Cancel anytime</div>
                </>
              )}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <div className="p-1.5 bg-gray-50 rounded-lg text-lg leading-none">🤖</div> AI Recommendation
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-600 rounded">Premium</span>
                <Lock className="w-3 h-3 text-gray-400" />
              </h3>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            
            <p className="text-xs text-gray-500 mb-4 font-medium">Based on your profile, we found</p>
            
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-4xl font-extrabold text-[#0f766e] mb-1 leading-none">{freelanceCount}</div>
                <div className="text-xs text-gray-600 leading-snug font-medium mt-2">nearby freelance<br/>opportunities.</div>
              </div>
              
              <div className="w-20 h-20 bg-gray-50 rounded-full border-4 border-white shadow-sm flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-100/50 opacity-50 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] bg-size-[8px_8px]"></div>
                {/* Map path SVG mock */}
                <svg className="w-10 h-10 text-teal-600 absolute drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {/* Map route line mock */}
                <svg className="absolute w-full h-full" viewBox="0 0 100 100"><path d="M 20 80 Q 50 20 80 80" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="4 4" className="opacity-50" /></svg>
                <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-orange-500 border border-white"></div>
                <div className="absolute bottom-1/4 left-1/4 w-2 h-2 rounded-full bg-teal-500 border border-white"></div>
              </div>
            </div>
            
            <button className="w-full bg-[#0f766e] hover:bg-teal-800 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm">
              <Lock className="w-4 h-4" /> Unlock to View
            </button>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-sm">Activity</h3>
              <Link to="/provider/history" className="text-xs text-teal-700 font-bold flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-5">
              <div className="flex gap-3.5 relative">
                <div className="absolute left-3.5 top-8 bottom-[-16px] w-[2px] bg-gray-100"></div>
                <div className="relative z-10">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs font-bold text-gray-800">Resume viewed by Google</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">2h ago</p>
                </div>
              </div>
              
              <div className="flex gap-3.5 relative">
                <div className="absolute left-3.5 top-8 bottom-[-16px] w-[2px] bg-gray-100"></div>
                <div className="relative z-10">
                  <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm">
                    <FileText className="w-3.5 h-3.5 text-teal-700" />
                  </div>
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs font-bold text-gray-800">Applied for UI/UX Designer</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">5h ago</p>
                </div>
              </div>

              <div className="flex gap-3.5 relative">
                <div className="relative z-10">
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">Profile updated</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">Yesterday</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action WhatsApp */}
      {!profile.whatsappFreelancePlanActive && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={handleWhatsappCheckout}
            className="bg-white hover:bg-gray-50 text-gray-900 rounded-full pl-2 pr-5 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 transition transform hover:scale-105 border border-gray-100 group">
            <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-inner group-hover:bg-[#20bd5a] transition-colors">
              <FaWhatsapp className="w-7 h-7 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-extrabold leading-tight text-gray-900">Earn Extra Income</div>
              <div className="text-[11px] font-medium text-gray-500 mt-0.5">Nearby freelance work <br/> <span className="font-bold text-gray-700">₹30/month</span></div>
            </div>
            <ArrowRight className="w-5 h-5 ml-1 text-gray-400 group-hover:text-gray-700 transition-colors hidden sm:block" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
