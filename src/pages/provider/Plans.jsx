import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BadgePercent,
  Building2,
  Check,
  ChevronRight,
  Globe2,
  MapPin,
  SlidersHorizontal,
  Target,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Zap,
  Crown,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import RouteLoader from '../../components/common/RouteLoader';
import {
  getCurrentSubscription,
  getMyPlan,
  getProviderPlans,
  previewPlan,
  getProviderUsageMetrics,
  purchaseFixedPlan,
  confirmPaymentSuccess,
} from '../../services/providerPlanService';
import { useAuth } from '../../context/AuthContext';
import useTranslation from '../../hooks/useTranslation';
import GuaranteeModal from '../../components/common/GuaranteeModal';
import { API } from '../../services/api';
import LocationSearch from '../../components/LocationSearch';
import SkillSearchSelect from '../../components/common/SkillSearchSelect';
import { safeReturnPath } from '../../utils/navigation';

const DURATION_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const months = index + 1;
  const discount = { 3: 10, 6: 15, 12: 25 }[months] || 0;
  return {
    months,
    label: `${months} Month${months > 1 ? 's' : ''}`,
    badge: discount ? `Save ${discount}%` : '',
  };
});
const DISCOUNT_BY_MONTHS = { 1: 0, 3: 10, 6: 15, 12: 25 };

const planIconMap = {
  'add-multiple-skills': BadgeCheck,
  'one-pincode-top': Target,
  'top-in-city': Building2,
  'show-top-in-country': Globe2,
  'customise-plan': SlidersHorizontal,
};

const coverageLabels = {
  pincode: 'Selected Pincode',
  city: 'Entire City',
  country: 'Entire Country',
  custom: 'Custom Coverage',
};

const formatCurrency = (value, symbol = '₹') => `${symbol}${Number(value || 0).toLocaleString()}`;

const buildLocalPreview = (plan, months) => {
  if (!plan) return null;
  const monthlyPrice = Number(plan.priceMonthly || plan.price || 0);
  const discountPercent = DISCOUNT_BY_MONTHS[months] || 0;
  const subtotal = Math.max(0, Math.round(monthlyPrice * months * (1 - discountPercent / 100) * 100) / 100);
  const taxPercent = plan.gstPercent ?? 18;
  const gstAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;
  return {
    monthlyPrice,
    discountPercent,
    subtotal,
    gstPercent: taxPercent,
    gstAmount,
    totalAmount,
    currencySymbol: plan.currencySymbol || '₹',
    taxName: plan.taxName || 'GST',
  };
};

const ProviderPlans = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const paymentHandledRef = useRef(false);
  const [tab, setTab] = useState('provider');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedPincodes, setSelectedPincodes] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [isAutoSubscription, setIsAutoSubscription] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [finalizingPayment, setFinalizingPayment] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);

  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return safeReturnPath(
      location.state?.returnTo ||
        params.get('returnTo') ||
        params.get('redirect') ||
        sessionStorage.getItem('paymentReturnTo') ||
        '/provider/dashboard',
    );
  }, [location.search, location.state?.returnTo]);

  useEffect(() => {
    const fetchSkills = async () => {
      setSkillsLoading(true);
      try {
        const { data } = await API.get('/skills');
        if (Array.isArray(data)) {
          const all = data.flatMap(cat => cat.skills || []);
          const names = [...new Set(all.map(s => s.name))].sort();
          setAvailableSkills(names);
        }
      } catch (err) {
        console.warn('Failed to fetch backend skills, using fallbacks:', err);
        setAvailableSkills([
          'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Driver', 'Cook',
          'Welder', 'Mason', 'AC Technician', 'CCTV Installer', 'Tiler',
          'Interior Designer', 'UI/UX Designer', 'Graphic Designer', 'Web Developer',
          'Mobile Developer', 'Content Writer', 'Digital Marketer', 'Accountant',
          'Data Entry Operator', 'Receptionist', 'Security Guard', 'Housekeeping',
          'Nurse', 'Caretaker', 'Tailor', 'Beautician', 'Yoga Trainer', 'Tutor'
        ]);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('paymentReturnTo', returnTo);
    if (location.state?.source) {
      sessionStorage.setItem('paymentReturnSource', String(location.state.source));
    }
  }, [location.state?.source, returnTo]);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!selectedPlan) {
      setSelectedSkills([]);
      setSelectedPincodes([]);
      setSelectedCities([]);
      return;
    }

    const defaultCity = profile?.city || profile?.location?.city || user?.providerProfile?.city || user?.profile?.city || user?.city || profile?.locationData?.city || '';
    
    const defaultPincode = profile?.location?.postalCode || profile?.pincode || user?.providerProfile?.pincode || user?.profile?.pincode || user?.pincode || profile?.locations?.[0] || profile?.nearestLocation || defaultCity || '';
    
    // Skills might be stored as an array of strings or objects. We'll try to extract them.
    let rawSkills = profile?.skills || profile?.expandedSkills || user?.providerProfile?.skills || user?.profile?.skills || user?.skills || [];
    if (!Array.isArray(rawSkills)) rawSkills = [rawSkills].filter(Boolean);
    
    // Extract skill strings if they are objects
    const mappedSkills = rawSkills.map(s => typeof s === 'string' ? s : (s?.name || s?.skill || '')).filter(Boolean);
    
    const maxSkills = selectedPlan.maxSkills || 1;
    const initialSkills = mappedSkills.length > 0 ? mappedSkills.slice(0, maxSkills) : [];

    setSelectedSkills(initialSkills);
    setSelectedPincodes(defaultPincode ? [defaultPincode] : []);
    setSelectedCities(defaultCity ? [defaultCity] : []);
  }, [selectedPlan, user, profile]);


  // =============================================================
  const initials = useMemo(() => {
    const name = user?.name || 'Provider';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const providerName = user?.name || 'Provider';

  const providerLocation =
    user?.providerProfile?.city ||
    user?.profile?.city ||
    user?.city ||
    'Noida, UP';

  const providerSubtitle = `Provider • ${providerLocation}`;
  // ===============================================================

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      setError('');
      try {
        const [planList, myPlan, usageMetrics] = await Promise.all([
          getProviderPlans(),
          getMyPlan(),
          getProviderUsageMetrics().catch(() => null)
        ]);
        setPlans(planList);
        setUsageSummary(usageMetrics);

        if (myPlan?.subscription?.planId) {
          const existing = planList.find((plan) => String(plan._id) === String(myPlan.subscription.planId));
          if (existing) {
            setSelectedPlan(existing);
            setSelectedDuration(Number(myPlan.subscription.durationMonths || 1));
          }
        }

        if (!selectedPlan && planList.length) {
          const popular = planList.find((plan) => plan.isPopular);
          setSelectedPlan(popular || planList[0]);
        }
      } catch (err) {
        setError('Failed to load plans. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (paymentHandledRef.current) {
      return;
    }

    if (params.get('success') === 'true' && params.get('sub_id')) {
      const subId = params.get('sub_id');
      const sessionId = params.get('session_id');

      const finalizePayment = async () => {
        paymentHandledRef.current = true;
        setFinalizingPayment(true);
        try {
          await confirmPaymentSuccess({
            subscriptionId: subId,
            paymentId: sessionId,
            orderId: 'stripe_session',
          });
          await getCurrentSubscription().catch(() => null);
          const updatedUsage = await getProviderUsageMetrics().catch(() => null);
          if (updatedUsage) setUsageSummary(updatedUsage);
          toast.success('Payment confirmed! Your plan is now active.');
          sessionStorage.removeItem('paymentReturnTo');
          sessionStorage.removeItem('paymentReturnSource');
          navigate(returnTo, {
            replace: true,
            state: {
              paymentSuccess: true,
              refreshSubscription: true,
              source: 'provider-plans',
            },
          });
        } catch (err) {
          toast.error('Failed to confirm payment status.');
        } finally {
          setFinalizingPayment(false);
        }
      };
      finalizePayment();
    } else if (params.get('cancelled') === 'true') {
      paymentHandledRef.current = true;
      toast.error('Payment was cancelled.');
      sessionStorage.removeItem('paymentReturnSource');
      navigate('/provider/plans', { replace: true });
    }
  }, [location.search, navigate, returnTo]);


  useEffect(() => {
    const runPreview = async () => {
      if (!selectedPlan) return;
      try {
        const preview = await previewPlan({
          planId: selectedPlan._id,
          durationMonths: selectedDuration,
          selectedSkills,
          selectedPincodes,
          selectedCities,
        });
        setPricingPreview(preview?.pricing || null);
      } catch (_) {
        setPricingPreview(buildLocalPreview(selectedPlan, selectedDuration));
      }
    };

    runPreview();
  }, [selectedPlan, selectedDuration, selectedSkills, selectedPincodes, selectedCities]);


  const isConfigurationValid = useMemo(() => {
    if (!selectedPlan) return false;
    if (selectedPlan.slug === 'free') return true;
    if (selectedPlan.slug === 'customise-plan') return true;

    if (selectedPlan.slug === 'add-multiple-skills') {
      return selectedSkills.length >= 1 && selectedSkills.length <= (selectedPlan.maxSkills || 5);
    }
    if (selectedPlan.coverageType === 'pincode' || selectedPlan.slug === 'one-pincode-top') {
      return selectedSkills.length >= 1 && selectedSkills.length <= (selectedPlan.maxSkills || 1) && selectedPincodes.length === 1;
    }
    if (selectedPlan.coverageType === 'city' || selectedPlan.slug === 'top-in-city') {
      return selectedSkills.length >= 1 && selectedSkills.length <= (selectedPlan.maxSkills || 1) && selectedCities.length === 1;
    }
    if (selectedPlan.coverageType === 'country' || selectedPlan.slug === 'show-top-in-country') {
      return selectedSkills.length >= 1 && selectedSkills.length <= (selectedPlan.maxSkills || 1) && selectedCities.length === 1;
    }

    return false;
  }, [selectedPlan, selectedSkills, selectedPincodes, selectedCities]);

  const summary = useMemo(() => {
    if (!selectedPlan) return null;
    const pricing = pricingPreview || buildLocalPreview(selectedPlan, selectedDuration);
    
    let coverage = 'Basic Coverage';
    let skillsDisplay = selectedSkills.length > 0 ? selectedSkills.join(', ') : 'No skills selected';

    if (selectedPlan.slug === 'add-multiple-skills') {
      coverage = null; // Hide coverage from UI
      skillsDisplay = `${selectedSkills.length} Skill(s) Selected`;
    } else if (selectedPlan.slug === 'one-pincode-top') {
      coverage = selectedPincodes[0] || 'No locality selected';
      skillsDisplay = selectedSkills[0] || 'No skill selected';
    } else if (selectedPlan.slug === 'top-in-city') {
      coverage = `City: ${selectedCities[0] || 'No city selected'}`;
      skillsDisplay = `${selectedSkills.length} Skill(s) Selected`;
    } else if (selectedPlan.slug === 'show-top-in-country') {
      coverage = `Country: ${selectedCities[0] || 'No country selected'}`;
      skillsDisplay = `${selectedSkills.length} Skill(s) Selected`;
    }

    return {
      planName: selectedPlan.name,
      planType: 'Provider Boost',
      coverage,
      skills: skillsDisplay,
      duration: `${selectedDuration} Month${selectedDuration > 1 ? 's' : ''}`,
      subtotal: pricing?.subtotal || 0,
      gstPercent: 0,
      gstAmount: 0,
      totalAmount: pricing?.subtotal || 0,
      currencySymbol: pricing?.currencySymbol || selectedPlan?.currencySymbol || '₹',
      taxName: 'GST',
    };
  }, [pricingPreview, selectedDuration, selectedPlan, selectedSkills, selectedPincodes, selectedCities]);

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Select a plan to continue.');
      return;
    }

    setCheckoutLoading(true);
    try {

      const response = await purchaseFixedPlan({
        planId: selectedPlan._id,
        durationMonths: selectedDuration,
        selectedSkills,
        selectedPincodes,
        selectedCities,
        isAutoSubscription,
      });

      const { checkout, subscription } = response || {};

      if (checkout?.simulationMode) {
        // Simulation Flow
        const confirm = window.confirm('Simulation Mode: Click OK to simulate successful payment.');
        if (confirm) {
          await confirmPaymentSuccess({
            subscriptionId: subscription?._id,
            paymentId: 'sim_' + Date.now(),
            orderId: 'sim_order_' + Date.now(),
          });
          await getMyPlan();
          const updatedUsage = await getProviderUsageMetrics().catch(() => null);
          if (updatedUsage) setUsageSummary(updatedUsage);
          toast.success('Simulation: Payment successful! Plan activated.');
          sessionStorage.removeItem('paymentReturnTo');
          sessionStorage.removeItem('paymentReturnSource');
          navigate(returnTo, {
            replace: true,
            state: {
              paymentSuccess: true,
              refreshSubscription: true,
              source: 'provider-plans-simulation',
            },
          });
          return;
        }
      }

      if (checkout?.paymentRequired && checkout?.url) {
        // Stripe Redirect Flow
        toast.success('Redirecting to payment gateway...');
        window.location.href = checkout.url;
        return;
      }

      if (checkout?.paymentRequired && checkout?.orderId && window?.Razorpay) {

        // Razorpay Flow
        const options = {
          key: checkout.publishableKey || checkout.keyId,
          amount: checkout.amount,
          currency: checkout.currency || 'INR',
          order_id: checkout.orderId,
          name: 'ServiceHub',
          description: selectedPlan.name,
          handler: async (payment) => {
            await confirmPaymentSuccess({
              subscriptionId: subscription?._id,
              paymentId: payment?.razorpay_payment_id,
              orderId: payment?.razorpay_order_id,
            });
            await getMyPlan();
            const updatedUsage = await getProviderUsageMetrics().catch(() => null);
            if (updatedUsage) setUsageSummary(updatedUsage);
            toast.success('Payment successful! Plan activated.');
            sessionStorage.removeItem('paymentReturnTo');
            sessionStorage.removeItem('paymentReturnSource');
            navigate(returnTo, {
              replace: true,
              state: {
                paymentSuccess: true,
                refreshSubscription: true,
                source: 'provider-plans-razorpay',
              },
            });
          },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else if (checkout?.paymentRequired && checkout?.paymentProvider === 'stripe') {
        // Stripe Flow (Basic redirect or message for now)
        toast.success('Stripe payment initialized. Redirecting...');
      } else {
        toast.success(checkout?.message || 'Checkout created. Our team will review your request.');
        await getMyPlan();
        const updatedUsage = await getProviderUsageMetrics().catch(() => null);
        if (updatedUsage) setUsageSummary(updatedUsage);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <RouteLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#06133D] tracking-tight mb-3">
            Choose the Right Plan for Your <span className="text-[#005BFF]">Career Growth</span>
          </h1>
          <p className="text-[#64748B] text-base">
            Unlock powerful AI insights, personalized reports, and smart alerts to get hired faster.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-10">
          {[
            { icon: <Zap className="w-4 h-4" />, text: 'AI-Powered Insights' },
            { icon: <Target className="w-4 h-4" />, text: 'Smart Job Matching' },
            { icon: <BadgeCheck className="w-4 h-4" />, text: 'Verified Jobs' },
            { icon: <MessageCircle className="w-4 h-4" />, text: 'WhatsApp & Email Alerts' },
            { icon: <ShieldCheck className="w-4 h-4" />, text: 'Bank-Level Security' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-[#06133D] bg-white border border-[#E8EEF9] px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-[#005BFF]">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Duration Toggles */}
        <div className="flex justify-center mb-10 relative">
          <div className="bg-white border border-[#E8EEF9] rounded-full p-1 inline-flex items-center relative shadow-sm">
            <button
              onClick={() => setSelectedDuration(1)}
              className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-colors ${selectedDuration === 1 ? 'text-white bg-[#005BFF] shadow' : 'text-[#64748B] hover:text-[#06133D]'}`}
            >
              Monthly Plans
            </button>
            <button
              onClick={() => setSelectedDuration(3)}
              className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-colors flex items-center gap-1.5 ${selectedDuration === 3 ? 'text-white bg-[#005BFF] shadow' : 'text-[#64748B] hover:text-[#06133D]'}`}
            >
              Quarterly Plans <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDuration === 3 ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>10% OFF</span>
            </button>
            <button
              onClick={() => setSelectedDuration(12)}
              className={`relative z-10 px-6 py-2.5 text-sm font-bold rounded-full transition-colors flex items-center gap-1.5 ${selectedDuration === 12 ? 'text-white bg-[#005BFF] shadow' : 'text-[#64748B] hover:text-[#06133D]'}`}
            >
              Yearly Plans <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDuration === 12 ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>20% OFF</span>
              {selectedDuration !== 12 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#005BFF] text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">BEST VALUE</div>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.filter(p => ['basic-ai', 'pro-ai', 'premium-ai'].includes(p.slug)).sort((a,b) => a.price - b.price).map((plan) => {
            const isPro = plan.slug === 'pro-ai';
            const isPremium = plan.slug === 'premium-ai';
            
            // Apply duration discounts properly
            let displayPrice = plan.priceMonthly || plan.price;
            let displayMonthly = displayPrice;
            if (selectedDuration === 3) displayMonthly = displayPrice * 0.9;
            if (selectedDuration === 12) displayMonthly = displayPrice * 0.8;
            
            return (
              <div key={plan._id} className={`bg-white rounded-3xl p-6 relative flex flex-col ${isPro ? 'border-2 border-[#8B5CF6] shadow-xl scale-105 z-10' : 'border border-[#E8EEF9] shadow-md'}`}>
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#8B5CF6] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    MOST POPULAR
                  </div>
                )}
                {isPremium && (
                  <div className="absolute top-4 right-4 text-amber-500">
                    <Crown className="w-8 h-8" />
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isPro ? 'text-[#8B5CF6]' : isPremium ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#06133D]">{formatCurrency(Math.round(displayMonthly), plan.currencySymbol)}</span>
                    <span className="text-xs text-[#64748B] font-semibold">/month</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-2 h-4">{plan.description}</p>
                </div>

                <div className="flex-1">
                  <p className="text-xs font-bold text-[#06133D] mb-4 uppercase tracking-wider">
                    {isPro ? 'EVERYTHING IN BASIC, PLUS' : isPremium ? 'EVERYTHING IN PRO, PLUS' : 'WHAT\'S INCLUDED'}
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => {
                      const [name, val] = feature.split(':');
                      return (
                        <li key={i} className="flex items-start justify-between text-xs gap-3">
                          <div className="flex items-start gap-2 text-[#06133D] font-medium">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{name.trim()}</span>
                          </div>
                          {val && <span className="text-[#64748B] text-right shrink-0">{val.trim()}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowConfigModal(true);
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isPro 
                        ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white' 
                        : isPremium
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Get Started with {plan.name.split(' ')[0]}
                  </button>
                  <p className="text-[10px] text-center text-[#64748B] mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Cancel anytime. No hidden charges.
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl border border-[#E8EEF9] shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#E8EEF9]">
                  <th className="p-6 font-bold text-[#06133D] bg-slate-50 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#005BFF]" />
                      PLAN COMPARISON <br/> AT A GLANCE
                    </div>
                  </th>
                  <th className="p-6 text-center">
                    <div className="text-xs font-bold text-emerald-600 uppercase">BASIC AI</div>
                    <div className="text-[#06133D] font-extrabold mt-1">₹ 199/month</div>
                  </th>
                  <th className="p-6 text-center bg-[#F5F3FF]">
                    <div className="text-xs font-bold text-[#8B5CF6] uppercase">PRO AI</div>
                    <div className="text-[#06133D] font-extrabold mt-1">₹ 499/month</div>
                  </th>
                  <th className="p-6 text-center">
                    <div className="text-xs font-bold text-amber-600 uppercase">PREMIUM AI CAREER COACH</div>
                    <div className="text-[#06133D] font-extrabold mt-1">₹ 999/month</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF9]">
                {[
                  { label: 'AI Career Analysis (Skill Gap, Why Not, Interview Prob, Resume, Career GPS)', basic: '5 requests / month', pro: '20 requests / month', premium: 'Unlimited' },
                  { label: 'AI Chat Assistant', basic: '20 questions / month', pro: '200 questions / month', premium: 'Unlimited*' },
                  { label: 'WhatsApp Alerts', basic: '20 / month', pro: '100 / month', premium: 'Unlimited*' },
                  { label: 'Email Alerts', basic: '30 / month', pro: '200 / month', premium: 'Unlimited*' },
                  { label: 'Job Alerts', basic: 'Daily', pro: 'Real-time', premium: 'Instant' },
                  { label: 'Deep Career Reports (Claude)', basic: '—', pro: '—', premium: '10 reports / month' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-xs font-semibold text-[#06133D]">{row.label}</td>
                    <td className="p-4 text-center text-xs text-[#64748B]">{row.basic}</td>
                    <td className="p-4 text-center text-xs text-[#64748B] bg-[#F5F3FF]/50">{row.pro}</td>
                    <td className="p-4 text-center text-xs text-[#64748B]">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 text-[10px] text-center text-[#94A3B8] border-t border-[#E8EEF9]">
            * Fair usage policy applies to prevent spam.
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-white border border-[#E8EEF9] rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAutoSubscription(!isAutoSubscription)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutoSubscription ? 'bg-[#005BFF]' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoSubscription ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <div>
              <p className="text-sm font-bold text-[#06133D]">Auto Subscription</p>
              <p className="text-xs text-[#64748B]">Your plan will auto-renew at the end of each billing cycle.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-bold text-[#64748B]">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#005BFF]" /> 100% Secure Payments</div>
            <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-[#005BFF]" /> Cancel Anytime</div>
            <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#005BFF]" /> 7-Day Money Back Guarantee (T&C Apply)</div>
          </div>
        </div>
      </div>

      {/* Configuration & Checkout Modal */}
      {showConfigModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#005BFF]/10 bg-gradient-to-r from-[#005BFF]/5 to-transparent flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-[#06133D]">Configure Plan</h2>
                <p className="text-xs text-[#64748B] font-medium mt-1">Set your coverage and complete checkout</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none transition-colors hover:bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Coverage Selectors (From Old UI logic) */}
              {selectedPlan.coverageType === 'pincode' && (
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Target Locality / Area</label>
                  <LocationSearch
                    value={selectedPincodes[0] || ''}
                    onChange={(val) => { if (!val) setSelectedPincodes([]); }}
                    onSelect={(item) => {
                      if (item) {
                        const pincode = item.raw?.address_components?.find(c => c.types.includes('postal_code'))?.long_name || item.pincode || '';
                        const label = pincode ? `${item.formattedAddress} (${pincode})` : item.formattedAddress || item.name;
                        setSelectedPincodes([label]);
                      } else {
                        setSelectedPincodes([]);
                      }
                    }}
                    placeholder="Search and select locality/area"
                  />
                </div>
              )}

              {selectedPlan.coverageType === 'city' && (
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Target City</label>
                  <LocationSearch
                    value={selectedCities[0] || ''}
                    onChange={(val) => { if (!val) setSelectedCities([]); }}
                    onSelect={(item) => {
                      if (item) {
                        const city = item.city || item.name || '';
                        setSelectedCities([city]);
                      } else {
                        setSelectedCities([]);
                      }
                    }}
                    placeholder="Search and select city"
                  />
                </div>
              )}

              {selectedPlan.coverageType === 'country' && (
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Target Country</label>
                  <select
                    value={selectedCities[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCities(val ? [val] : []);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm"
                  >
                    <option value="">-- Select Country --</option>
                    <option value="India">India (IN)</option>
                    <option value="United Arab Emirates">United Arab Emirates (AE)</option>
                    <option value="United States">United States (US)</option>
                    <option value="United Kingdom">United Kingdom (UK)</option>
                  </select>
                </div>
              )}

              {/* Boost Skills Selector */}
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                  Select Target Skills (Max {selectedPlan.maxSkills})
                </label>
                <SkillSearchSelect
                  selected={selectedSkills}
                  onAdd={(skill) => {
                    if (selectedSkills.length >= selectedPlan.maxSkills) {
                      toast.error(`Your plan allows max ${selectedPlan.maxSkills} skills.`);
                      return;
                    }
                    setSelectedSkills([...selectedSkills, skill]);
                  }}
                  onRemove={(skill) => {
                    setSelectedSkills(selectedSkills.filter(s => s !== skill));
                  }}
                  maxAllowed={selectedPlan.maxSkills || 1}
                  plan={selectedPlan.slug}
                />
              </div>

              {/* Premium Order Summary */}
              <div className="bg-gradient-to-br from-[#005BFF]/5 to-[#8B5CF6]/5 border border-[#005BFF]/10 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-extrabold text-[#06133D] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-[#005BFF]" />
                  Order Summary
                </h3>
                <div className="flex justify-between items-center text-[#06133D]">
                  <span className="font-semibold">{selectedPlan.name} Plan ({selectedDuration} Month{selectedDuration > 1 ? 's' : ''})</span>
                  <span className="font-bold">{formatCurrency(summary?.subtotal || 0, selectedPlan.currencySymbol)}</span>
                </div>
                <div className="pt-4 border-t border-[#005BFF]/10 flex justify-between items-center">
                  <span className="font-extrabold text-[#06133D] text-lg">Total Pay</span>
                  <div className="text-right">
                    <span className="font-extrabold text-[#005BFF] text-2xl">{formatCurrency(summary?.subtotal || 0, selectedPlan.currencySymbol)}</span>
                    <p className="text-[10px] text-[#64748B] font-medium mt-1">(GST managed manually)</p>
                  </div>
                </div>
              </div>

              {/* Validation Warning */}
              {!isConfigurationValid && (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Please complete location and skill selection to proceed.
                </div>
              )}

            </div>
            <div className="p-6 border-t border-[#E8EEF9] bg-white">
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || !isConfigurationValid}
                className="w-full bg-[#005BFF] hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
              >
                {checkoutLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <Wallet className="w-4 h-4" />
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProviderPlans;
