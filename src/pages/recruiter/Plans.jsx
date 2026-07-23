import useTranslation from "../../hooks/useTranslation";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiCheck, HiOutlineLightningBolt, HiX, HiClock } from 'react-icons/hi';
import { FaRegClock, FaChartLine, FaWallet, FaShieldAlt, FaHeadset, FaRocket, FaSearch } from 'react-icons/fa';
import { paymentAPI, recruiterAPI } from '../../services/api';
import useStripePayment from '../../hooks/useStripePayment';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';

const PLAN_THEME_BY_SLUG = {
  free: {
    tag: 'FREE', sub: 'For new recruiters', button: 'Get Started',
    buttonClass: 'border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white',
    cardClass: 'border border-slate-200', bestFor: 'First-time recruiters',
    tagClass: 'text-green-600',
    highlight: false
  },
  'ai-starter': {
    tag: 'AI STARTER', sub: 'For startups & small teams', button: 'Choose Plan',
    buttonClass: 'bg-[#4a24ba] text-white hover:bg-[#381a91]',
    cardClass: 'border border-slate-200', bestFor: 'Startups\nHire up to 10 positions/month',
    highlight: false, featureBadge: 'Save 40+ hours/month', featureBadgeClass: 'bg-indigo-50 text-indigo-700',
    tagClass: 'text-[#4a24ba]'
  },
  'ai-growth': {
    tag: 'AI GROWTH', sub: 'For growing companies', button: 'Choose Plan',
    buttonClass: 'bg-[#4a24ba] text-white hover:bg-[#381a91]',
    cardClass: 'border border-slate-200', bestFor: 'SMBs\nHire up to 50 positions/month',
    highlight: false, featureBadge: 'Save 120+ hours/month', featureBadgeClass: 'bg-indigo-50 text-indigo-700',
    tagClass: 'text-[#4a24ba]'
  },
  'ai-business': {
    tag: 'AI BUSINESS', sub: 'For agencies & teams', button: 'Choose Plan',
    buttonClass: 'bg-[#ea580c] text-white hover:bg-[#c2410c]',
    cardClass: 'border border-slate-200', bestFor: 'Agencies & Large Teams\nUnlimited hiring',
    highlight: false, featureBadge: 'Save 300+ hours/month', featureBadgeClass: 'bg-orange-50 text-orange-600',
    tagClass: 'text-[#ea580c]'
  },
  enterprise: {
    tag: 'ENTERPRISE', sub: 'For large enterprises', button: 'Contact Sales',
    buttonClass: 'bg-slate-900 text-white hover:bg-black',
    cardClass: 'border border-slate-200', bestFor: 'Large Enterprises &\nRecruitment Firms',
    highlight: false, isCustom: true,
    tagClass: 'text-slate-900'
  },
};

const PLATFORM_FEATURES = [
  { id: 'copilot', label: 'AI Copilot Assistant', basePrice: 2000 },
  { id: 'resume_parser', label: 'AI Resume Parser & ATS', basePrice: 3000 },
  { id: 'interview_kits', label: 'AI Interview Kits', basePrice: 1500 },
  { id: 'automated_email', label: 'Automated Email Outreaches', basePrice: 2500 },
  { id: 'data_export', label: 'Advanced Data Export', basePrice: 500 }
];

const DEFAULT_THEME = {
  tag: 'PLAN', sub: 'For professionals', button: 'Choose Plan',
  buttonClass: 'bg-indigo-700 text-white hover:bg-indigo-800',
  topBorder: 'border-t-indigo-700', bestFor: 'Growing teams',
  highlight: false
};

const RecruiterPlans = () => {
  const {
    t
  } = useTranslation();

  const [plans, setPlans] = useState([]);
  const [customOffers, setCustomOffers] = useState([]);
  const [hasCustomRequest, setHasCustomRequest] = useState(false);
  const [acceptedCustomPlan, setAcceptedCustomPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [activePeriod, setActivePeriod] = useState('Monthly');
  const { initiatePayment, loading: paymentLoading } = useStripePayment();
  const { formatPrice } = useLocale();

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [pendingPurchasePlanId, setPendingPurchasePlanId] = useState(null);

  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }
  const [customPlanDuration, setCustomPlanDuration] = useState(1);
  const [customPlanJobs, setCustomPlanJobs] = useState(10);
  const [customPlanUnlocks, setCustomPlanUnlocks] = useState(100);
  const [customPlanCampaigns, setCustomPlanCampaigns] = useState(2);
  const [customPlanBoosts, setCustomPlanBoosts] = useState(1);
  const [customPlanBoostDays, setCustomPlanBoostDays] = useState(30);
  const [customPlanFeatures, setCustomPlanFeatures] = useState([]);
  const [customPlanNotes, setCustomPlanNotes] = useState('');

  const [roiHires, setRoiHires] = useState(500);
  const manualCostPerHire = 8000;

  const manualTotal = roiHires * manualCostPerHire;
  const lucohireTotal = Math.floor(manualTotal * 0.25);
  const savings = manualTotal - lucohireTotal;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { 
    const query = new URLSearchParams(location.search);
    const paymentStatus = query.get('payment');
    const sessionId = query.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      verifyStripePayment(sessionId);
    } else {
      fetchPlans(); 
    }
  }, [location.search]);

  const verifyStripePayment = async (sessionId) => {
    try {
      setLoading(true);
      const res = await paymentAPI.verifyPayment({ sessionId });
      if (res.data?.success) {
        toast.success(res.data.message || 'Payment successful! Plan activated.');
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify payment. Contact support if you were charged.');
    } finally {
      fetchPlans();
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await recruiterAPI.getPlans();
      setPlans(data || []);
      const dashboard = await recruiterAPI.getDashboard();
      setCurrentPlan(dashboard.data?.stats?.currentPlan || 'free');
      
      const customRes = await recruiterAPI.getMyCustomPlanRequests();
      if (customRes.data?.success) {
        const allRequests = customRes.data.data;
        // Has any non-closed AND non-accepted request — hide the Enterprise card from the grid
        setHasCustomRequest(allRequests.some(r => r.status !== 'closed' && r.status !== 'accepted' && r.offerDetails?.status !== 'accepted'));
        
        // Show offers: must have a price, must not have been accepted
        setCustomOffers(allRequests.filter(req =>
          req.status === 'resolved' &&
          req.offerDetails?.price > 0 &&
          req.offerDetails?.status !== 'accepted'
        ));

        // Find accepted custom plan
        setAcceptedCustomPlan(allRequests.find(req => req.status === 'accepted' || req.offerDetails?.status === 'accepted'));
      }
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = async (planId) => {
    const plan = plans.find(p => p._id === planId);
    if (!plan) return;
    
    if (plan.price === 0) {
      toast.error('Free plan is already assigned by default.');
      return;
    }
    
    const baseSlug = plan.slug?.toLowerCase().replace('-yearly', '').replace('-quarterly', '');
    const theme = PLAN_THEME_BY_SLUG[baseSlug] || DEFAULT_THEME;
    if (theme.isCustom) {
      setShowCustomPlanModal(true);
      return;
    }

    try {
      setLoading(true);
      const { data } = await paymentAPI.calculateBreakdown({
        amount: plan.price,
        context: 'subscription'
      });
      if (data?.success) {
        setBreakdownData(data.data);
        setPendingPurchasePlanId(planId);
        setShowBreakdownModal(true);
      } else {
        toast.error('Failed to compute secure payment breakdown.');
      }
    } catch (err) {
      toast.error('Unable to fetch transaction cost breakdown.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPurchase = () => {
    setShowBreakdownModal(false);
    setActivePlanId(pendingPurchasePlanId);
    initiatePayment({
      planId: pendingPurchasePlanId,
      onSuccess: () => { setActivePlanId(null); fetchPlans(); },
      onFailure: () => setActivePlanId(null),
    });
  };

  const handlePayCustomOffer = async (req) => {
    try {
      const offer = req.offerDetails;
      if (!offer?.price) return toast.error("Invalid offer details");
      if (!offer.planId) return toast.error("Offer is being prepared. Please try again in a moment or contact support.");
      
      setLoading(true);
      const { data } = await paymentAPI.calculateBreakdown({
        amount: offer.price,
        context: 'subscription'
      });
      
      if (data?.success) {
        setBreakdownData(data.data);
        setPendingPurchasePlanId(offer.planId);
        setShowBreakdownModal(true);
      } else {
        toast.error('Failed to compute secure payment breakdown.');
      }
    } catch {
      toast.error("Could not initiate payment for offer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (id) => {
    setConfirmModal({
      title: 'Decline Offer',
      message: 'Are you sure you want to decline this custom plan offer? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await recruiterAPI.cancelCustomPlanRequest(id);
          toast.success('Offer declined.');
          fetchPlans();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to decline.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleCancelActiveRequest = async () => {
    const res = await recruiterAPI.getMyCustomPlanRequests();
    const active = res.data?.data?.find(r => r.status !== 'closed');
    if (!active) return;
    setConfirmModal({
      title: 'Cancel Plan Request',
      message: 'Cancel your custom plan request? Our team will stop working on your offer and the Enterprise card will return to the plan grid.',
      onConfirm: async () => {
        try {
          await recruiterAPI.cancelCustomPlanRequest(active._id);
          toast.success('Custom plan request cancelled.');
          fetchPlans();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to cancel request.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const submitCustomPlanRequest = async () => {
    if (customPlanDuration < 1) {
      toast.error('Duration must be at least 1 month');
      return;
    }
    try {
      setLoading(true);
      const res = await recruiterAPI.createCustomPlanRequest({
        durationMonths: customPlanDuration,
        selectedFeatures: customPlanFeatures,
        jobsPerMonth: customPlanJobs,
        profileUnlocks: customPlanUnlocks,
        campaigns: customPlanCampaigns,
        boostJobs: customPlanBoosts,
        boostDays: customPlanBoostDays,
        notes: customPlanNotes
      });
      if (res.data?.success) {
        toast.success('Custom plan request submitted! Our team will contact you shortly.');
        setShowCustomPlanModal(false);
        setCustomPlanDuration(1);
        setCustomPlanJobs(10);
        setCustomPlanUnlocks(100);
        setCustomPlanCampaigns(2);
        setCustomPlanBoosts(1);
        setCustomPlanBoostDays(30);
        setCustomPlanFeatures([]);
        setCustomPlanNotes('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const plansByDuration = { Monthly: [], Quarterly: [], Yearly: [] };
  plans.forEach(p => {
    if (p.duration >= 365) plansByDuration.Yearly.push(p);
    else if (p.duration >= 90) plansByDuration.Quarterly.push(p);
    else plansByDuration.Monthly.push(p);
  });
  
  if (plansByDuration.Quarterly.length === 0 && plansByDuration.Monthly.length > 0) {
    plansByDuration.Quarterly = plansByDuration.Monthly.map(p => ({
      ...p,
      _id: p._id + '_quarterly',
      slug: p.slug + '-quarterly',
      duration: 90,
      price: p.price > 0 ? Math.round(p.price * 0.9) : 0
    }));
  }
  
  const displayedPlans = plansByDuration[activePeriod] || [];

  const sortOrder = { 'free': 1, 'ai-starter': 2, 'ai-growth': 3, 'ai-business': 4, 'enterprise': 5 };
  displayedPlans.sort((a,b) => {
    const aBase = a.slug?.toLowerCase().replace('-yearly', '').replace('-quarterly', '');
    const bBase = b.slug?.toLowerCase().replace('-yearly', '').replace('-quarterly', '');
    return (sortOrder[aBase] || 99) - (sortOrder[bBase] || 99);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Custom Plan Offer Banner — shown when offer is ready to pay */}
            {customOffers.length > 0 && (
              <div className="mb-10 bg-indigo-50 border border-indigo-200 rounded-3xl p-6 shadow-xs">
                <h3 className="text-lg font-black text-indigo-900 mb-4 flex items-center gap-2"><HiOutlineLightningBolt className="w-5 h-5" /> Your Custom Plan Offers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customOffers.map(req => (
                    <div key={req._id} className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900 mb-1">{req.offerDetails.durationMonths} Months Custom Plan</div>
                        <div className="text-xs text-slate-500 mb-2">Includes custom feature set negotiated with our team.</div>
                        <div className="text-lg font-black text-indigo-700">₹{(req.offerDetails?.price || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handlePayCustomOffer(req)}
                          disabled={paymentLoading}
                          className="px-6 py-2.5 bg-[#4a24ba] text-white text-sm font-bold rounded-xl hover:bg-[#381a91] transition shadow-sm w-full"
                        >
                          Accept & Pay
                        </button>
                        <button
                          onClick={() => handleCancelRequest(req._id)}
                          className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-red-600 transition w-full text-center"
                        >
                          Decline Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Request Banner — shown when request is under review but no offer yet */}
            {hasCustomRequest && customOffers.length === 0 && (
              <div className="mb-10 bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <HiClock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-black text-amber-900">Custom Plan Request Under Review</span>
                  </div>
                  <p className="text-xs text-amber-700 font-medium">Our team is reviewing your requirements. You&apos;ll receive an email with your tailored offer shortly.</p>
                </div>
                <button
                  onClick={handleCancelActiveRequest}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 transition whitespace-nowrap border border-slate-200 rounded-xl px-4 py-2 bg-white"
                >
                  Cancel Request
                </button>
              </div>
            )}

            {/* Active Custom Plan Banner */}
            {acceptedCustomPlan && currentPlan?.startsWith('custom') && (
              <div className="mb-10 bg-green-50 border border-green-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 opacity-20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-black text-green-900">Custom Enterprise Plan Active</span>
                  </div>
                  <p className="text-xs text-green-700 font-medium">
                    You are currently on a {acceptedCustomPlan.offerDetails?.durationMonths} Months Custom Plan ({acceptedCustomPlan.offerDetails?.jobsPerMonth} Jobs, {acceptedCustomPlan.offerDetails?.profileUnlocks} Unlocks, {acceptedCustomPlan.offerDetails?.boostJobs} Boosts).
                  </p>
                </div>
                <div className="relative z-10 px-4 py-2 bg-green-100 text-green-800 text-xs font-black rounded-xl border border-green-200 uppercase tracking-wide">
                  Current Plan
                </div>
              </div>
            )}

            <div className="flex justify-center items-center gap-2 mb-10 relative">
              <div className="bg-white border border-slate-200 p-1 rounded-full inline-flex font-bold text-sm shadow-sm relative">
                <button 
                  onClick={() => setActivePeriod('Monthly')}
                  className={`px-6 py-2.5 rounded-full transition-all ${activePeriod === 'Monthly' ? 'bg-[#4a24ba] text-white shadow-md' : 'text-slate-900 hover:bg-slate-50'}`}
                >{t("Monthly")}</button>
                <button 
                  onClick={() => setActivePeriod('Quarterly')}
                  className={`px-6 py-2.5 rounded-full transition-all flex items-center gap-1 ${activePeriod === 'Quarterly' ? 'bg-[#4a24ba] text-white shadow-md' : 'text-slate-900 hover:bg-slate-50'}`}
                >{t("Quarterly")} <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activePeriod === 'Quarterly' ? 'bg-white/20' : 'bg-green-100 text-green-700'}`}>-10%</span></button>
                <button 
                  onClick={() => setActivePeriod('Yearly')}
                  className={`px-6 py-2.5 rounded-full transition-all flex items-center gap-1 ${activePeriod === 'Yearly' ? 'bg-[#4a24ba] text-white shadow-md' : 'text-slate-900 hover:bg-slate-50'}`}
                >{t("Yearly")} <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activePeriod === 'Yearly' ? 'bg-white/20' : 'bg-green-100 text-green-700'}`}>-20%</span></button>
              </div>
            </div>

            {(() => {
              // Enterprise is always rendered as a hardcoded card below — filter it out of DB plans to avoid duplicates
              const visiblePlans = displayedPlans.filter(p => {
                const base = p.slug?.toLowerCase().replace('-yearly', '').replace('-quarterly', '');
                return !PLAN_THEME_BY_SLUG[base]?.isCustom;
              });

              const colClass = hasCustomRequest
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5';

              return (
                <div className={`grid ${colClass} gap-4 mb-20`}>
                  {visiblePlans.map(plan => {
                    const baseSlug = plan.slug?.toLowerCase().replace('-yearly', '').replace('-quarterly', '');
                    const theme = PLAN_THEME_BY_SLUG[baseSlug] || DEFAULT_THEME;
                    const isCurrent = currentPlan === plan.slug;
                    
                    return (
                      <div key={plan._id} className={`bg-white rounded-3xl flex flex-col relative transition-transform hover:-translate-y-1 ${theme.cardClass || 'border border-slate-200'}`}>
                        {theme.badge && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#4a24ba] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                            {theme.badge}
                          </div>
                        )}
                        <div className="p-4 lg:p-5 flex flex-col flex-1">
                          <div className="text-center mb-4">
                            <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${theme.tagClass || 'text-slate-900'}`}>{theme.tag}</h3>
                            <p className="text-[10px] text-slate-500 font-bold">
                              {theme.sub}</p>
                          </div>
                          
                          <div className="text-center mb-5 h-12 flex items-end justify-center">
                            {theme.isCustom ? (
                              <div className="text-2xl font-black text-slate-900 mb-1">{t("Custom")}</div>
                            ) : (
                              <div>
                                <div className="flex justify-center items-end gap-1 mb-1">
                                  {plan.price === 0 ? (
                                    <span className="text-2xl font-black text-slate-900">₹0</span>
                                  ) : (
                                    <>
                                      <span className="text-2xl font-black text-slate-900">₹{plan.price.toLocaleString('en-IN')}</span>
                                      <span className="text-[11px] text-slate-500 font-bold mb-1">{t("/month")}</span>
                                    </>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  {plan.price === 0 ? 'Forever Free' : `Billed ${activePeriod.toLowerCase()}`}
                                </div>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={() => !isCurrent && handlePurchaseClick(plan._id)}
                            disabled={isCurrent || paymentLoading}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all mb-5 ${isCurrent ? 'bg-green-100 text-green-700' : theme.buttonClass}`}
                          >
                            {isCurrent ? 'Current Plan' : theme.button}
                          </button>

                          <div className="text-center mb-5">
                            <p className="text-[9px] text-slate-500 font-bold mb-1">{t("Best for:")}</p>
                            <p className="text-[10px] text-slate-800 font-black whitespace-pre-line leading-tight">{theme.bestFor}</p>
                          </div>

                          {theme.featureBadge && (
                            <div className="bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-lg py-1 px-1.5 text-center mb-5 border border-indigo-100 flex items-center justify-center gap-1">
                              <FaRegClock/> {theme.featureBadge}
                            </div>
                          )}

                          <ul className="space-y-2 mt-auto">
                            {(plan.features || []).slice(0,4).map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[10px] font-bold text-slate-600 leading-tight">
                                <HiCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          
                          <div className="mt-6 text-center text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">{t("View all features →")}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Enterprise / Custom Plan card — always hardcoded, shown only when no active request */}
                  {!hasCustomRequest && (
                    <div className="bg-white rounded-3xl flex flex-col relative transition-transform hover:-translate-y-1 border border-slate-200">
                      <div className="p-4 lg:p-5 flex flex-col flex-1">
                        <div className="text-center mb-4">
                          <h3 className="text-sm font-black uppercase tracking-widest mb-1 text-slate-900">ENTERPRISE</h3>
                          <p className="text-[10px] text-slate-500 font-bold">For large enterprises</p>
                        </div>
                        <div className="text-center mb-5 h-12 flex items-end justify-center">
                          <div className="text-2xl font-black text-slate-900 mb-1">{t('Custom')}</div>
                        </div>
                        <button
                          onClick={() => setShowCustomPlanModal(true)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs transition-all mb-5 bg-slate-900 text-white hover:bg-black"
                        >
                          Contact Sales
                        </button>
                        <div className="text-center mb-5">
                          <p className="text-[9px] text-slate-500 font-bold mb-1">{t('Best for:')}</p>
                          <p className="text-[10px] text-slate-800 font-black whitespace-pre-line leading-tight">{`Large Enterprises &
Recruitment Firms`}</p>
                        </div>
                        <ul className="space-y-2 mt-auto">
                          {['Custom job postings', 'Dedicated account manager', 'Priority support', 'Custom integrations'].map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[10px] font-bold text-slate-600 leading-tight">
                              <HiCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />{f}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6 text-center text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">{t('View all features →')}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          <div className="bg-[#1e1b4b] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20"><FaRocket className="text-6xl"/></div>
            <h3 className="text-2xl font-black mb-2">{t("Why Upgrade?")}</h3>
            <p className="text-indigo-200 text-sm font-medium mb-8">{t("Unlock powerful AI features and save more time.")}</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-bold border-b border-white/10 pb-4">
                <div className="flex items-center gap-3"><FaRocket className="text-indigo-400"/>{t("AI Hiring Copilot")}</div>
                <div className="text-[10px] text-indigo-300">{t("Unlock in Starter")}</div>
              </div>
              <div className="flex items-center justify-between text-sm font-bold border-b border-white/10 pb-4">
                <div className="flex items-center gap-3"><FaSearch className="text-indigo-400"/>{t("Hidden Talent Access")}</div>
                <div className="text-[10px] text-indigo-300">{t("Unlock in Growth")}</div>
              </div>
              <div className="flex items-center justify-between text-sm font-bold border-b border-white/10 pb-4">
                <div className="flex items-center gap-3"><HiCheck className="text-indigo-400"/>{t("Smart Shortlisting")}</div>
                <div className="text-[10px] text-indigo-300">{t("Unlock in Growth")}</div>
              </div>
              <div className="flex items-center justify-between text-sm font-bold border-b border-white/10 pb-4">
                <div className="flex items-center gap-3"><FaChartLine className="text-indigo-400"/>{t("Salary Intelligence")}</div>
                <div className="text-[10px] text-indigo-300">{t("Unlock in Business")}</div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-black mb-2">{t("Calculate Your ROI")}</h3>
            <p className="text-slate-400 text-sm font-medium mb-10">{t("See how much you can save with Lucohire AI")}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <label className="block text-sm font-bold mb-4">{t("How many hires do you make per year?")}</label>
                <div className="flex justify-between items-end mb-4">
                  <div className="text-4xl font-black">{roiHires}</div>
                  <div className="text-xs text-slate-400 font-bold">{t("Hires / Year")}</div>
                </div>
                <input 
                  type="range" min="10" max="2000" step="10" 
                  value={roiHires} onChange={e => setRoiHires(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-8"
                />
                <div className="flex justify-between items-center text-sm font-bold bg-slate-800 p-4 rounded-xl">
                  <span>{t("Average cost per hire (manual)")}</span>
                  <span>₹{manualCostPerHire.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">{t("*Calculation is based on industry average and may vary.")}</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-800 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-400 font-bold mb-1">{t("Manual Hiring Cost")}</div>
                    <div className="text-2xl font-black">₹{manualTotal.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-bold">{t("Per Year")}</div>
                  </div>
                </div>
                <div className="bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="text-xs text-indigo-300 font-bold mb-1">{t("With Lucohire")}</div>
                    <div className="text-2xl font-black text-white">₹{lucohireTotal.toLocaleString()}</div>
                    <div className="text-[10px] text-indigo-400 font-bold">{t("Per Year")}</div>
                  </div>
                </div>
                
                <div className="bg-[#022c22] border border-[#059669] p-5 rounded-2xl mt-4">
                  <div className="text-xs text-emerald-400 font-bold mb-1">{t("You Save")}</div>
                  <div className="text-3xl font-black text-emerald-400 mb-4">₹{savings.toLocaleString()}</div>
                  <div className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-lg border border-emerald-500/30">{t("75% Cost Reduction")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compare All Features Section */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200 mb-20 overflow-x-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">{t("Compare All Features")}</h2>
            <p className="text-slate-500 font-medium">{t("Everything you need to make the right choice.")}</p>
          </div>
          
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-4 px-6 w-1/3 text-slate-400 font-black text-xs uppercase tracking-wider">{t("Features")}</th>
                {['FREE', 'STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE'].map((tier, i) => (
                  <th key={i} className="py-4 px-6 text-center">
                    <span className="text-slate-900 font-black text-sm">{tier}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Category 1 */}
              <tr>
                <td colSpan="6" className="py-6 px-6 bg-slate-50 text-indigo-700 font-black text-sm rounded-t-xl">{t("Candidate Access & Engagement")}</td>
              </tr>
              {[
                ['Job Postings', '1', '10', '50', 'Unlimited', 'Custom'],
                ['Talent Pool Access', 'Limited', 'Full', 'Full', 'Full', 'Full'],
                ['Direct Messaging', '-', '100/mo', '500/mo', 'Unlimited', 'Custom'],
                ['Automated Follow-ups', '-', '-', 'Yes', 'Yes', 'Yes'],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-slate-700">{row[0]}</td>
                  {row.slice(1).map((val, j) => (
                    <td key={j} className="py-4 px-6 text-center text-sm font-bold text-slate-600">
                      {val === 'Yes' ? <HiCheck className="text-green-500 w-5 h-5 mx-auto"/> : val === '-' ? <span className="text-slate-300">-</span> : val}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Category 2 */}
              <tr>
                <td colSpan="6" className="py-6 px-6 bg-slate-50 text-indigo-700 font-black text-sm">{t("AI Hiring & Intelligence")}</td>
              </tr>
              {[
                ['AI Resume Screening', '-', 'Yes', 'Yes', 'Yes', 'Yes'],
                ['Smart Match Score', '-', 'Yes', 'Yes', 'Yes', 'Yes'],
                ['Skill Gap Analysis', '-', '-', 'Yes', 'Yes', 'Yes'],
                ['Salary Insights', '-', '-', '-', 'Yes', 'Yes'],
                ['Predictive Hiring Models', '-', '-', '-', '-', 'Yes'],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-slate-700">{row[0]}</td>
                  {row.slice(1).map((val, j) => (
                    <td key={j} className="py-4 px-6 text-center text-sm font-bold text-slate-600">
                      {val === 'Yes' ? <HiCheck className="text-green-500 w-5 h-5 mx-auto"/> : val === '-' ? <span className="text-slate-300">-</span> : val}
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Category 3 */}
              <tr>
                <td colSpan="6" className="py-6 px-6 bg-slate-50 text-indigo-700 font-black text-sm">{t("Support & Branding")}</td>
              </tr>
              {[
                ['Company Career Page', 'Basic', 'Custom', 'Custom', 'Premium', 'White-label'],
                ['Support Level', 'Email', 'Priority Email', '24/7 Chat', 'Dedicated AM', 'Dedicated Team'],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-slate-700">{row[0]}</td>
                  {row.slice(1).map((val, j) => (
                    <td key={j} className="py-4 px-6 text-center text-sm font-bold text-slate-600">
                      {val === 'Yes' ? <HiCheck className="text-green-500 w-5 h-5 mx-auto"/> : val === '-' ? <span className="text-slate-300">-</span> : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {showBreakdownModal && breakdownData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <HiOutlineLightningBolt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t("Secure Order Invoice")}</h3>
                    <p className="text-xs text-gray-500">{t("Recalculated securely on backend ledger servers")}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">{t("Base Plan Amount")}</span>
                    <span className="font-bold text-slate-800">₹{breakdownData.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200">
                    <span className="text-gray-900 font-extrabold">{t("Final Payable Total")}</span>
                    <span className="text-lg font-black text-indigo-600">₹{breakdownData.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowBreakdownModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">{t("Cancel")}</button>
                  <button onClick={confirmPurchase} disabled={paymentLoading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/15">
                    {paymentLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCustomPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
              <div className="p-6 md:p-8 flex-shrink-0 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{t("Request Custom Plan")}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{t("Tell us your requirements and our team will get in touch.")}</p>
                  </div>
                  <button onClick={() => setShowCustomPlanModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-500">
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">{t("Desired Duration (Months)")}</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={customPlanDuration} 
                      onChange={(e) => setCustomPlanDuration(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{t("Jobs per Month")}</label>
                      <input 
                        type="number" min="1" 
                        value={customPlanJobs} 
                        onChange={(e) => setCustomPlanJobs(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{t("Profile Unlocks")}</label>
                      <input 
                        type="number" min="0" 
                        value={customPlanUnlocks} 
                        onChange={(e) => setCustomPlanUnlocks(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{t("Outreach Campaigns")}</label>
                      <input 
                        type="number" min="0" 
                        value={customPlanCampaigns} 
                        onChange={(e) => setCustomPlanCampaigns(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{t("Number of Boost Jobs")}</label>
                      <input 
                        type="number" min="0" 
                        value={customPlanBoosts} 
                        onChange={(e) => setCustomPlanBoosts(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{t("Total Boost Days")}</label>
                      <input 
                        type="number" min="0" 
                        value={customPlanBoostDays} 
                        onChange={(e) => setCustomPlanBoostDays(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">{t("Platform Features Needed")}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                      {PLATFORM_FEATURES.map((feature) => (
                        <label key={feature.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer bg-white shadow-xs transition">
                          <input 
                            type="checkbox" 
                            checked={customPlanFeatures.includes(feature.label)}
                            onChange={(e) => {
                              if (e.target.checked) setCustomPlanFeatures([...customPlanFeatures, feature.label]);
                              else setCustomPlanFeatures(customPlanFeatures.filter(f => f !== feature.label));
                            }}
                            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-[11px] font-bold text-slate-700">{feature.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {customPlanFeatures.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-indigo-900">Estimated Price</div>
                        <div className="text-[10px] text-indigo-700">Based on {customPlanFeatures.length} features × {customPlanDuration || 1} months</div>
                      </div>
                      <div className="text-xl font-black text-indigo-700">
                        ₹{(((customPlanFeatures.reduce((acc, featureLabel) => {
                          const feature = PLATFORM_FEATURES.find(f => f.label === featureLabel);
                          return acc + (feature ? feature.basePrice : 0);
                        }, 0) + (customPlanJobs * 500) + (customPlanUnlocks * 10) + (customPlanCampaigns * 1500) + (customPlanBoosts * 2500))) * Math.max(1, customPlanDuration)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">{t("Additional Notes")}</label>
                    <textarea 
                      value={customPlanNotes}
                      onChange={(e) => setCustomPlanNotes(e.target.value)}
                      rows={3}
                      placeholder={t("Any specific requirements...")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex-shrink-0 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
                <div className="flex gap-3">
                  <button onClick={() => setShowCustomPlanModal(false)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition shadow-sm">{t("Cancel")}</button>
                  <button onClick={submitCustomPlanRequest} disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-70">
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Confirm Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-6">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                  <HiX className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{confirmModal.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="flex border-t border-slate-100">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Keep it
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 transition border-l border-slate-100"
                >
                  Yes, {confirmModal.title.startsWith('Decline') ? 'Decline' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecruiterPlans;
