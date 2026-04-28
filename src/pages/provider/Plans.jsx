import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI, providerAPI } from '../../services/api';
import useStripePayment from '../../hooks/useStripePayment';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';

// Map plan duration (days) to billing period label
const PERIOD_LABELS = { 30: 'Monthly', 90: '3 Monthly', 180: 'Semi Annually', 365: 'Annually' };
const PERIOD_ORDER  = ['Monthly', '3 Monthly', 'Semi Annually', 'Annually'];
const PLAN_RANK = { free: 0, starter: 1, basic: 1, business: 2, pro: 2, enterprise: 3, featured: 3 };
const PLAN_THEME = {
  free: {
    card: 'border-slate-300 bg-slate-50/70',
    feature: 'text-slate-700',
    button: 'bg-slate-700 text-white hover:bg-slate-800',
    badge: 'bg-slate-700 text-white',
    tag: 'FREE',
  },
  starter: {
    card: 'border-blue-300 bg-blue-50/70',
    feature: 'text-blue-700',
    button: 'bg-blue-600 text-white hover:bg-blue-700',
    badge: 'bg-blue-600 text-white',
    tag: 'STARTER',
  },
  business: {
    card: 'border-emerald-300 bg-emerald-50/70',
    feature: 'text-emerald-700',
    button: 'bg-emerald-600 text-white hover:bg-emerald-700',
    badge: 'bg-emerald-600 text-white',
    tag: 'BUSINESS',
  },
  enterprise: {
    card: 'border-amber-300 bg-amber-50/70',
    feature: 'text-amber-700',
    button: 'bg-amber-600 text-white hover:bg-amber-700',
    badge: 'bg-amber-600 text-white',
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

// Feature icons mapping for known plan slugs
const PLAN_META = {
  starter:  { icon: '🗂️', title: 'Starter',              subtitle: 'Essential visibility\nfor getting started' },
  business: { icon: '🏆', title: 'Business',             subtitle: 'Higher reach and rank\nfor growing faster' },
  enterprise:{ icon: '⚡', title: 'Enterprise',           subtitle: 'Maximum reach with\npriority functionality' },
  basic:    { icon: '🗂️', title: 'Multiple Categories',  subtitle: 'Access all categories\nAfter 2 Free Specialities' },
  pro:      { icon: '🏆', title: 'Top Placement',         subtitle: 'Get Featured on Top\nIn Your Area' },
  featured: { icon: '⚡', title: 'Instant Job Alerts',    subtitle: 'Receive Job Alerts\nDirectly To Your Phone' },
};

const ProviderPlans = () => {
  const [plans, setPlans]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [activePeriod, setActivePeriod] = useState('Monthly');
  const [activePlanId, setActivePlanId] = useState(null);
  const { initiatePayment, loading: paymentLoading } = useStripePayment();
  const { formatPrice } = useLocale();
  const location  = useLocation();
  const navigate  = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const requestedRedirect = searchParams.get('redirect');
  const redirectPath = requestedRedirect && requestedRedirect.startsWith('/')
    ? requestedRedirect
    : '/provider/dashboard';

  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    const handlePaymentRedirect = async () => {
      const params = new URLSearchParams(location.search);
      const status = params.get('payment');
      const sessionId = params.get('session_id');

      if (status === 'success') {
        if (!sessionId) {
          toast.error('Missing payment session information.');
          navigate('/provider/plans', { replace: true });
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
        navigate('/provider/plans', { replace: true });
      }
    };

    handlePaymentRedirect();
  }, [location.search, navigate, redirectPath]);

  const fetchPlans = async () => {
    try {
      const { data } = await providerAPI.getPlans();
      setPlans(data);
      // Also fetch current plan from profile
      const response = await providerAPI.getProfile();
      setCurrentPlan(response.data?.currentPlan || 'free');
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!plans.length) return;
    const periodMap = {};
    plans.forEach(p => {
      const label = PERIOD_LABELS[p.duration] || `${p.duration}d`;
      if (!periodMap[label]) periodMap[label] = [];
      periodMap[label].push(p);
    });
    const availablePeriods = PERIOD_ORDER.filter(p => periodMap[p]);
    const defaultPeriod = availablePeriods.includes('Monthly') ? 'Monthly' : availablePeriods[0];
    if (defaultPeriod) {
      setActivePeriod(defaultPeriod);
    }
  }, [plans]);

  const handlePurchase = (planId) => {
    setActivePlanId(planId);
    initiatePayment({
      planId,
      onSuccess: () => { setActivePlanId(null); fetchPlans(); },
      onFailure: () => setActivePlanId(null),
    });
  };

  // Group plans by period label
  const periodMap = {};
  plans.forEach(p => {
    const label = PERIOD_LABELS[p.duration] || `${p.duration}d`;
    if (!periodMap[label]) periodMap[label] = [];
    periodMap[label].push(p);
  });
  const availablePeriods = PERIOD_ORDER.filter(p => periodMap[p]);
  const displayedPlans   = periodMap[activePeriod] || [];
  const normalizedCurrentPlan = String(currentPlan || 'free').toLowerCase();
  const currentPlanMeta = plans.find((p) => String(p.slug || '').toLowerCase() === normalizedCurrentPlan);
  const currentPlanSortOrder = Number(currentPlanMeta?.sortOrder ?? PLAN_RANK[normalizedCurrentPlan] ?? 0);

  // Helper: price per month display
  const monthlyEquiv = (plan) => {
    if (plan.duration === 30)  return null;
    if (plan.duration === 90)  return `${formatPrice(plan.price)} / 3 months`;
    if (plan.duration === 180) return `${formatPrice(plan.price)} / 6 months`;
    if (plan.duration === 365) return `${formatPrice(plan.price)} / year`;
    return null;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-sky-100 via-blue-200 to-blue-500">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-100 via-blue-200 to-blue-500 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-900">
            ServiceHub&nbsp;<span className="font-normal text-blue-700">Provider</span>&nbsp;Plans
          </h1>
          <div className="h-0.5 bg-linear-to-r from-transparent via-blue-400 to-transparent mt-3 mb-4" />
          {currentPlan && currentPlan !== 'free' && (
            <span className="inline-flex items-center gap-2 bg-green-500/20 border border-green-300/40 text-green-800 text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-sm mt-2">
              ✅ Active: <span className="capitalize font-bold">{currentPlan}</span>
            </span>
          )}
        </div>

        {/* Period Tabs */}
        {availablePeriods.length > 1 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white/60 backdrop-blur-sm rounded-full p-1 shadow-sm border border-white/40 gap-1">
              {availablePeriods.map(period => (
                <button key={period} type="button"
                  onClick={() => setActivePeriod(period)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
                    activePeriod === period
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}>{period}</button>
              ))}
            </div>
          </div>
        )}

        {/* Plan Cards */}
        {displayedPlans.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-10 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No plans available</p>
            <p className="text-sm">Check back soon or contact support.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {displayedPlans.map(plan => {
              const theme = PLAN_THEME_BY_SLUG[String(plan.slug || '').toLowerCase()] || PLAN_THEME.starter;
              const meta     = PLAN_META[plan.slug] || { icon: '📦', title: plan.name, subtitle: '' };
              const isActive = currentPlan === plan.slug;
              const isLowerPlan = currentPlanSortOrder > 0 && Number(plan.sortOrder || 0) < currentPlanSortOrder;
              const isUpgradeDisabled = isActive || isLowerPlan;
              const isBusy   = paymentLoading && activePlanId === plan._id;
              const subLines = meta.subtitle.split('\n');
              const equiv    = monthlyEquiv(plan);

              return (
                <div key={plan._id}
                  className={`relative backdrop-blur-sm rounded-2xl border shadow-sm flex flex-col p-5 transition hover:shadow-md ${
                    isActive
                      ? 'border-green-400 ring-2 ring-green-300/60'
                      : theme.card
                  }`}>
                  {isActive && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow">
                      ACTIVE
                    </span>
                  )}
                  {!isActive && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full shadow ${theme.badge}`}>
                      {theme.tag}
                    </span>
                  )}

                  {/* Icon + Title */}
                  <div className="text-3xl mb-2">{meta.icon}</div>
                  <p className="font-bold text-gray-900 text-base leading-snug">{meta.title}</p>

                  {/* Price */}
                  <div className="mt-3 mb-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {formatPrice(plan.price, plan.priceAED, plan.priceUSD)}
                    </span>
                    <span className="text-gray-400 text-sm"> / {plan.duration === 30 ? 'Month' : plan.duration === 90 ? '3 Months' : plan.duration === 365 ? 'Year' : `${plan.duration}d`}</span>
                  </div>

                  {/* Subtitle lines */}
                  <div className="text-xs text-gray-500 space-y-0.5 mb-4 flex-1">
                    {subLines.map((line, i) => (
                      <p key={i} className={i === 1 ? 'italic' : ''}>{line}</p>
                    ))}
                    {/* Features from backend */}
                    {(plan.features || []).slice(0, 2).map((f, i) => (
                      <p key={`f${i}`} className={theme.feature}>✓ {f}</p>
                    ))}
                  </div>

                  {/* Upgrade button */}
                  <button
                    onClick={() => !isUpgradeDisabled && handlePurchase(plan._id)}
                    disabled={isBusy || isUpgradeDisabled}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
                      isActive
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : isLowerPlan
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `${theme.button} active:scale-[.98] shadow-sm disabled:opacity-60`
                    }`}>
                    {isBusy ? 'Processing…' : isActive ? 'Current Plan' : isLowerPlan ? 'Lower Plan Disabled' : 'Upgrade'}
                  </button>

                  {/* Equivalent price */}
                  {equiv && (
                    <p className="text-center text-xs text-gray-400 mt-2">{equiv}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Free tier reminder */}
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center text-sm text-gray-600 border border-white/40">
          <p>
            Free plan includes <strong>2 job applies / month</strong> &amp; basic listing.
            Upgrade anytime to unlock more features.
          </p>
          <button onClick={() => navigate('/provider/profile')}
            className="mt-2 text-blue-700 font-medium underline text-xs hover:text-blue-900 transition">
            ← Back to Profile
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProviderPlans;
