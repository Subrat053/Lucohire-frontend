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

  const handlePurchase = (planId) => {
    setActivePlanId(planId);
    initiatePayment({
      planId,
      onSuccess: () => { setActivePlanId(null); fetchPlans(); },
      onFailure: () => setActivePlanId(null),
    });
  };

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
    <div className="max-w-6xl mx-auto px-4 py-10">
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
                    onClick={() => !isUpgradeDisabled && handlePurchase(plan._id)}
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
          </div>
        )}
        {/* Bottom note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Free plan includes 2 contact unlocks per month. Secure payment powered by Stripe.
        </p>
      </div>
    </div>
  );
}

export default RecruiterPlans;
