import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiLightningBolt, HiArrowLeft } from 'react-icons/hi';
import { FaRocket, FaCrown, FaStar, FaBuilding } from 'react-icons/fa';
import { paymentAPI, recruiterAPI } from '../../services/api';
import useStripePayment from '../../hooks/useStripePayment';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';

/* ── Plan icon chooser ──────────────────────────────────────────────── */
const PLAN_ICONS = {
  starter: { Icon: FaStar, from: '#3b82f6', to: '#6366f1' },
  basic: { Icon: FaStar, from: '#3b82f6', to: '#6366f1' },
  business: { Icon: FaCrown, from: '#8b5cf6', to: '#ec4899' },
  enterprise: { Icon: FaBuilding, from: '#f59e0b', to: '#ef4444' },
  default: { Icon: FaRocket, from: '#6366f1', to: '#8b5cf6' }
};
const PLAN_RANK = { free: 0, starter: 1, basic: 1, business: 2, pro: 2, enterprise: 3, featured: 3 };
const PLAN_THEME = {
  free: {
    card: 'border-slate-300 bg-slate-50/80',
    badge: 'bg-slate-700 text-white',
    button: 'bg-slate-700 text-white hover:bg-slate-800',
    check: 'text-slate-600',
    tag: 'FREE',
  },
  starter: {
    card: 'border-blue-300 bg-blue-50/80',
    badge: 'bg-blue-600 text-white',
    button: 'bg-blue-600 text-white hover:bg-blue-700',
    check: 'text-blue-600',
    tag: 'STARTER',
  },
  business: {
    card: 'border-emerald-300 bg-emerald-50/80',
    badge: 'bg-emerald-600 text-white',
    button: 'bg-emerald-600 text-white hover:bg-emerald-700',
    check: 'text-emerald-600',
    tag: 'BUSINESS',
  },
  enterprise: {
    card: 'border-amber-300 bg-amber-50/80',
    badge: 'bg-amber-600 text-white',
    button: 'bg-amber-600 text-white hover:bg-amber-700',
    check: 'text-amber-600',
    tag: 'ENTERPRISE',
  },
};
const PLAN_THEME_BY_SLUG = {
  free: PLAN_THEME.free,
  starter: PLAN_THEME.starter,
  basic: PLAN_THEME.starter,
  business: PLAN_THEME.business,
  pro: PLAN_THEME.business,
  enterprise: PLAN_THEME.enterprise,
  featured: PLAN_THEME.enterprise,
};
const PERIOD_LABELS = { 30: 'Monthly', 90: '3 Monthly', 180: 'Semi Annually', 365: 'Annually' };
const PERIOD_ORDER = ['Monthly', '3 Monthly', 'Semi Annually', 'Annually'];
const PlansIllustration = () => (
  <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-36 h-28 drop-shadow-xl">
    {[40, 70, 100].map((x, i) => (
      <g key={i}>
        <rect x={x} y={50 - i * 14} width="36" height={70 + i * 14} rx="6" fill="white" fillOpacity={0.15 + i * 0.1} />
        <rect x={x + 6} y={60 - i * 14} width="24" height="6" rx="2" fill="white" fillOpacity="0.6" />
        <rect x={x + 6} y={73 - i * 14} width="18" height="4" rx="2" fill="white" fillOpacity="0.4" />
      </g>
    ))}
    <circle cx="166" cy="38" r="20" fill="#fbbf24" fillOpacity="0.8" />
    <path d="M157 38 L163 44 L175 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RecruiterPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [activePeriod, setActivePeriod] = useState('Monthly');
  const { initiatePayment, loading: paymentLoading } = useStripePayment();
  const { formatPrice } = useLocale();

  // Custom Plan States
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCredits, setCustomCredits] = useState(10);
  const [customDuration, setCustomDuration] = useState(30);
  const [customPrice, setCustomPrice] = useState(0);

  // Payment Breakdown States
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [pendingPurchasePlanId, setPendingPurchasePlanId] = useState(null);
  const [isPendingCustom, setIsPendingCustom] = useState(false);

  const handlePurchaseClick = async (planId, isCustom = false) => {
    let targetPrice = 0;
    if (isCustom) {
      targetPrice = customPrice;
    } else {
      const plan = plans.find(p => p._id === planId);
      targetPrice = plan ? plan.price : 0;
    }

    try {
      setLoading(true);
      const { data } = await paymentAPI.calculateBreakdown({
        amount: targetPrice,
        context: 'subscription'
      });

      if (data?.success) {
        setBreakdownData(data.data);
        setPendingPurchasePlanId(planId);
        setIsPendingCustom(isCustom);
        setShowBreakdownModal(true);
      } else {
        toast.error('Failed to compute secure payment breakdown.');
      }
    } catch (err) {
      toast.error('Unable to fetch transaction cost breakdown. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPurchase = () => {
    setShowBreakdownModal(false);
    handlePurchase(pendingPurchasePlanId, isPendingCustom);
  };
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const requestedRedirect = searchParams.get('redirect');
  const redirectPath = requestedRedirect && requestedRedirect.startsWith('/')
    ? requestedRedirect
    : '/recruiter/dashboard';

  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    const handlePaymentRedirect = async () => {
      const params = new URLSearchParams(location.search);
      const status = params.get('payment');
      const sessionId = params.get('session_id');

      if (status === 'success') {
        if (!sessionId) {
          toast.error('Missing payment session information.');
          navigate('/recruiter/plans', { replace: true });
          return;
        }

        try {
          await paymentAPI.verifyPayment({ sessionId });
          toast.success('Plan activated successfully!');
          navigate(redirectPath, { replace: true });
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Payment verification failed.');
        } finally {
          fetchPlans();
        }
      } else if (status === 'cancelled') {
        toast.error('Payment was cancelled.');
        navigate('/recruiter/plans', { replace: true });
      }
    };

    handlePaymentRedirect();
  }, [location.search, navigate, redirectPath]);

  const fetchPlans = async () => {
    try {
      const { data } = await recruiterAPI.getPlans();
      setPlans(data);
      // Also fetch current plan from dashboard/profile
      const dashboard = await recruiterAPI.getDashboard();
      setCurrentPlan(dashboard.data?.stats?.currentPlan || 'free');
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (planId, isCustom = false) => {
    if (isCustom) {
      initiatePayment({
        planId: 'custom',
        customConfig: {
          name: 'Custom Recruiter Plan',
          unlockCredits: customCredits,
          duration: customDuration,
          price: customPrice,
        },
        onSuccess: () => {
          setActivePlanId(null);
          setShowCustomModal(false);
          fetchPlans();
        },
        onFailure: () => setActivePlanId(null),
      });
      return;
    }

    setActivePlanId(planId);
    initiatePayment({
      planId,
      onSuccess: () => { setActivePlanId(null); fetchPlans(); },
      onFailure: () => setActivePlanId(null),
    });
  };

  useEffect(() => {
    // Basic pricing logic for custom plans
    // e.g., 50 INR per credit + base price based on duration
    const pricePerCredit = 50;
    const durationMultiplier = customDuration === 30 ? 1 : customDuration === 90 ? 2.5 : customDuration === 180 ? 4.5 : 8;
    const basePrice = 500 * durationMultiplier;
    setCustomPrice(Math.round(basePrice + (customCredits * pricePerCredit)));
  }, [customCredits, customDuration]);

  useEffect(() => {
    if (!plans.length) return;
    const periodMap = {};
    plans.forEach((p) => {
      const label = PERIOD_LABELS[p.duration] || `${p.duration}d`;
      if (!periodMap[label]) periodMap[label] = [];
      periodMap[label].push(p);
    });
    const availablePeriods = PERIOD_ORDER.filter((p) => periodMap[p]);
    const defaultPeriod = availablePeriods.includes('Monthly') ? 'Monthly' : availablePeriods[0];
    if (defaultPeriod) setActivePeriod(defaultPeriod);
  }, [plans]);

  const periodMap = {};
  plans.forEach((p) => {
    const label = PERIOD_LABELS[p.duration] || `${p.duration}d`;
    if (!periodMap[label]) periodMap[label] = [];
    periodMap[label].push(p);
  });
  const availablePeriods = PERIOD_ORDER.filter((p) => periodMap[p]);
  const displayedPlans = (periodMap[activePeriod] || []).slice().sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const normalizedCurrentPlan = String(currentPlan || 'free').toLowerCase();
  const currentPlanMeta = plans.find((p) => String(p.slug || '').toLowerCase() === normalizedCurrentPlan);
  const currentPlanSortOrder = Number(currentPlanMeta?.sortOrder ?? PLAN_RANK[normalizedCurrentPlan] ?? 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-blue-600 hover:underline">
          <HiArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex flex-col items-center mb-8">
          {/* <PlansIllustration /> */}
          <h1 className="text-3xl font-extrabold text-gray-900 mt-4 mb-2">Choose Your Plan</h1>
          <p className="text-gray-500 text-center max-w-xl">
            Unlock premium features and connect with top talent. Upgrade your plan to get the most out of ServiceHub!
          </p>
        </div>
        {availablePeriods.length > 1 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-sm border border-gray-200 gap-1">
              {availablePeriods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setActivePeriod(period)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activePeriod === period ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayedPlans.map((plan) => {
              const theme = PLAN_THEME_BY_SLUG[String(plan.slug || '').toLowerCase()] || PLAN_THEME.starter;
              const meta = PLAN_ICONS[plan.slug] || PLAN_ICONS.default;
              const Icon = meta.Icon;
              const isPaying = paymentLoading && activePlanId === plan._id;
              const isActive = currentPlan === plan.slug;
              const isLowerPlan = currentPlanSortOrder > 0 && Number(plan.sortOrder || 0) < currentPlanSortOrder;
              const isUpgradeDisabled = isActive || isLowerPlan;
              return (
                <div
                  key={plan._id}
                  className={`relative rounded-3xl border-2 p-7 flex flex-col transition-all hover:shadow-xl ${isActive
                    ? 'border-green-400 ring-2 ring-green-200 bg-green-50/30'
                    : theme.card
                    }`}
                >
                  {isActive && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-extrabold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                      CURRENT PLAN
                    </div>
                  )}
                  {!isActive && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-extrabold px-4 py-1 rounded-full shadow-md whitespace-nowrap ${theme.badge}`}>
                      {theme.tag}
                    </div>
                  )}

                  {/* Plan icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
                    style={{ background: `linear-gradient(135deg,${meta.from},${meta.to})` }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>

                  {/* Price */}
                  <div className="mt-3 mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {formatPrice(plan.price, plan.priceAED, plan.priceUSD)}
                    </span>
                    <span className="text-gray-400 text-sm ml-1.5">/ {PERIOD_LABELS[plan.duration] || `${plan.duration}d`}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-7">
                    {(plan.features || []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <HiCheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${theme.check}`} />
                        <span className="text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => !isUpgradeDisabled && handlePurchaseClick(plan._id, false)}
                    disabled={isPaying || isUpgradeDisabled}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50 ${isActive
                      ? 'bg-green-100 text-green-700'
                      : isLowerPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `${theme.button}`
                      }`}
                  >
                    {isPaying ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : isActive ? (
                      'Current Plan'
                    ) : isLowerPlan ? (
                      'Lower Plan Disabled'
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <HiLightningBolt className="w-4 h-4" /> Get Started
                      </span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Customize Plan Card */}
            <div className="relative rounded-3xl border-2 border-dashed border-gray-300 p-7 flex flex-col transition-all hover:border-blue-400 hover:bg-blue-50/20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-gray-400 to-gray-600 shadow-sm">
                <HiLightningBolt className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Customize Your Plan</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">Build a plan that fits your exact needs. Choose credits and duration.</p>
              <div className="mt-auto">
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm transition shadow-sm bg-gray-800 text-white hover:bg-gray-900"
                >
                  Configure Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Plan Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Plan</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Contact Unlocks
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={customCredits}
                      onChange={(e) => setCustomCredits(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between mt-2 text-sm font-bold text-blue-600">
                      <span>{customCredits} Unlocks</span>
                      <span>{formatPrice(customCredits * 50)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Plan Duration
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[30, 90, 180, 365].map(d => (
                        <button
                          key={d}
                          onClick={() => setCustomDuration(d)}
                          className={`py-2 px-4 rounded-xl border-2 transition text-sm font-bold ${customDuration === d
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                            }`}
                        >
                          {PERIOD_LABELS[d] || `${d} Days`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500 text-sm">Estimated Total</span>
                      <span className="text-2xl font-extrabold text-gray-900">{formatPrice(customPrice)}</span>
                    </div>
                    <p className="text-xs text-gray-400">Tax and local conversions will be applied at checkout.</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePurchaseClick('custom', true)}
                    disabled={paymentLoading}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {paymentLoading ? 'Processing...' : 'Purchase Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bottom note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Free plan includes 2 contact unlocks per month. Secure payment powered by Stripe.
        </p>
        {/* Payment Breakdown Modal */}
        {showBreakdownModal && breakdownData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <HiLightningBolt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Secure Order Invoice</h3>
                    <p className="text-xs text-gray-500">Recalculated securely on backend ledger servers</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Base Plan Amount</span>
                    <span className="font-bold text-slate-800">₹{breakdownData.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-3">
                    <span className="text-slate-500 font-medium">GST/Taxes ({breakdownData.taxPercent}%)</span>
                    <span className="font-bold text-slate-800">₹{breakdownData.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-3 text-[10px] text-slate-400 font-medium">
                    <span>Includes {breakdownData.platformCommissionPercent}% platform commission internally.</span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200">
                    <span className="text-gray-900 font-extrabold">Final Payable Total</span>
                    <span className="text-lg font-black text-indigo-600">₹{breakdownData.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBreakdownModal(false);
                      setBreakdownData(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={paymentLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/15"
                  >
                    {paymentLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecruiterPlans;
