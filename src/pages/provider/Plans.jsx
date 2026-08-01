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
  X,
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
  cancelSubscription,
  toggleAutoRenew,
} from '../../services/providerPlanService';
import { useAuth } from '../../context/AuthContext';
import useTranslation from '../../hooks/useTranslation';
import GuaranteeModal from '../../components/common/GuaranteeModal';
import { API, providerAPI, providerWalletAPI } from '../../services/api';
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

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const buildLocalPreview = (plan, months) => {
  if (!plan) return null;
  const monthlyPrice = Number(plan.priceMonthly || plan.price || 0);
  const discountPercent = DISCOUNT_BY_MONTHS[months] || 0;
  const subtotal = Math.max(0, Math.round(monthlyPrice * months * (1 - discountPercent / 100) * 100) / 100);
  const taxPercent = plan.gstPercent || 0;
  const gstAmount = 0;
  const totalAmount = subtotal;
  return {
    ...plan,
    subtotal,
    gstPercent: taxPercent,
    gstAmount,
    totalAmount,
    currencySymbol: plan.currencySymbol || '₹',
    taxName: plan.taxName || 'GST',
  };
};

const PROVIDER_FEATURES = [
  { key: 'resumeOptimization', label: 'AI Optimize Resume' },
  { key: 'autoAnalysisLimit', label: 'Profile Auto-Analysis' },
  { key: 'careerHealthRefresh', label: 'Refresh Insights' },
  { key: 'interviewQuestionsRefresh', label: 'Interview Questions' },
  { key: 'careerGpsRefresh', label: 'AI Career GPS' },
  { key: 'whyNotHiredRefresh', label: 'Why Not Hired' },
  { key: 'skillGapRefresh', label: 'Skill Gap Report' },
  { key: 'atsOptimizerRefresh', label: 'ATS Optimizer' },
  { key: 'chatMessagesLimit', label: 'Chat Messages Limit' },
  { key: 'dailyTasksRefresh', label: 'Daily Tasks' },
  { key: 'careerPlanRefresh', label: 'Career Plan' },
  { key: 'resourcesRefresh', label: 'Resources' },
  { key: 'progressRefresh', label: 'Progress' },
  { key: 'aiTipsRefresh', label: 'AI Tips Insight' },
  { key: 'resumeScoreRefresh', label: 'Resume Score Refresh' }
];

const ProviderPlans = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const paymentHandledRef = useRef(false);
  const [activeTab, setActiveTab] = useState('plans');
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
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [cancelBankMethod, setCancelBankMethod] = useState(null);

  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [finalizingPayment, setFinalizingPayment] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
  const [activePlanData, setActivePlanData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
        setHistoryLoading(true);
        const [planList, myPlan, usageMetrics, paymentsRes] = await Promise.all([
          getProviderPlans(),
          getMyPlan(),
          getProviderUsageMetrics().catch(() => null),
          providerAPI.getMyPayments().catch(() => null)
        ]);
        const filteredPlans = planList.filter(p => {
          const isTopPlan = ['top-in-city', 'one-pincode-top', 'show-top-in-country', 'add-multiple-skills'].includes(p.slug);
          return !isTopPlan;
        });
        const addons = planList.filter(p =>
          ['top-in-city', 'one-pincode-top', 'show-top-in-country', 'add-multiple-skills'].includes(p.slug)
        );
        setPlans(filteredPlans);
        setAvailableAddons(addons);
        setUsageSummary(usageMetrics);
        setActivePlanData(myPlan);
        if (paymentsRes?.data) {
          const list = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data.data || paymentsRes.data.payments || []);
          setPaymentHistory(list);
        }
        if (myPlan?.subscription?.isAutoRenew !== undefined) {
          setIsAutoSubscription(Boolean(myPlan.subscription.isAutoRenew));
        }

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
        setHistoryLoading(false);
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
          addonIds: selectedAddons,
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
  }, [selectedPlan, selectedDuration, selectedSkills, selectedPincodes, selectedCities, selectedAddons]);


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

    // Validation for Addons configuration
    if (availableAddons.some(a => selectedAddons.includes(a._id) && a.slug === 'one-pincode-top') && selectedPincodes.length === 0) return false;
    if (availableAddons.some(a => selectedAddons.includes(a._id) && a.slug === 'top-in-city') && selectedCities.length === 0) return false;
    if (availableAddons.some(a => selectedAddons.includes(a._id) && a.slug === 'show-top-in-country') && selectedCities.length === 0) return false;

    return true;
  }, [selectedPlan, selectedSkills, selectedPincodes, selectedCities, selectedAddons, availableAddons]);

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
      gstPercent: pricing?.taxRate || 0,
      gstAmount: pricing?.taxAmount || 0,
      totalAmount: pricing?.total || pricing?.subtotal || 0,
      currencySymbol: pricing?.currencySymbol || selectedPlan?.currencySymbol || '₹',
      taxName: 'GST',
    };
  }, [pricingPreview, selectedDuration, selectedPlan, selectedSkills, selectedPincodes, selectedCities]);

  const handleCancelPlan = async () => {
    try {
      toast.loading('Checking refund requirements...', { id: 'cancel-sub' });
      const { data } = await providerWalletAPI.getWallet();
      const bankMethod = data?.payoutMethods?.find(m => m.type === 'bank');
      
      if (!bankMethod || !bankMethod.bankDetails || !bankMethod.bankDetails.accountNumber) {
        toast.error('Please add your bank details first to process the refund.', { id: 'cancel-sub' });
        navigate('/provider/payout-settings');
        return;
      }

      toast.dismiss('cancel-sub');
      
      setCancelBankMethod(bankMethod);
      setShowCancelModal(true);
      setCancelConfirmed(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to process request', { id: 'cancel-sub' });
    }
  };

  const proceedCancelPlan = async () => {
    try {
      setShowCancelModal(false);
      toast.loading('Processing cancellation and refund...', { id: 'cancel-sub' });
      await providerAPI.requestRefund({ bankDetails: cancelBankMethod.bankDetails });
      toast.success('Subscription cancelled and refund requested successfully!', { id: 'cancel-sub' });
      
      const myPlan = await getMyPlan().catch(() => null);
      if (myPlan) setActivePlanData(myPlan);
      navigate('/provider/refunds');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to process request', { id: 'cancel-sub' });
    }
  };

  const handleDirectCheckout = async (planToCheckout) => {
    setSelectedPlan(planToCheckout);
    setCheckoutLoading(true);
    try {
      const response = await purchaseFixedPlan({
        planId: planToCheckout._id,
        durationMonths: selectedDuration,
        addonIds: [],
        configuration: {
            skills: [],
            pincodes: [],
            cities: [],
        },
        isAutoSubscription,
      });

      const { checkout, queueWarning } = response || {};

      if (queueWarning) {
        const confirmQueue = window.confirm(queueWarning + '\n\nDo you want to proceed to payment?');
        if (!confirmQueue) {
          setCheckoutLoading(false);
          return;
        }
      }

      if (checkout?.url) {
        window.location.href = checkout.url;
      } else {
        toast.error('Failed to initiate checkout.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing request.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Select a plan to continue.');
      return;
    }

    const hasCity = profile?.city || profile?.location?.city || user?.providerProfile?.city || user?.profile?.city || user?.city || profile?.locationData?.city;
    const hasPincode = profile?.location?.postalCode || profile?.pincode || user?.providerProfile?.pincode || user?.profile?.pincode || user?.pincode || profile?.locations?.[0] || profile?.nearestLocation;
    const hasCountry = profile?.country || profile?.location?.country || user?.country || user?.providerProfile?.country || user?.profile?.country;

    if (!hasCity || !hasPincode || !hasCountry) {
      toast.error(t('Please complete your location details (Country, City, Pincode) in your profile before subscribing to a plan.'));
      navigate('/provider/profile');
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        planId: selectedPlan._id,
        durationMonths: selectedDuration,
        addonIds: selectedAddons,
        configuration: {
          skills: selectedSkills,
          pincodes: selectedPincodes,
          cities: selectedCities,
        },
        isAutoSubscription,
      };

      const response = await purchaseFixedPlan(payload);
      const { checkout, subscription, queueWarning } = response || {};

      if (queueWarning) {
        const confirmQueue = window.confirm(queueWarning + '\n\nDo you want to proceed to payment?');
        if (!confirmQueue) {
          setCheckoutLoading(false);
          return;
        }
      }

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
              signature: payment?.razorpay_signature,
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
      <div className="max-w-7xl mx-auto relative">
        {/* Active Plan Display Top Left */}
        {(() => {
          if (!activePlanData || !activePlanData.subscription || activePlanData.subscription.subscriptionStatus !== 'active' || activePlanData.plan?.slug === 'free') return null;

          const activePlan = activePlanData.subscription;
          const planName = activePlan.planSnapshot?.name || 'Paid Plan';
          const purchaseDate = activePlan.startDate || activePlan.createdAt;
          const endDate = activePlan.endDate || activePlan.expiresAt;
          
          let days = 0;
          if (endDate) {
            const expiryTime = new Date(endDate).getTime();
            const currentTime = new Date().getTime();
            days = Math.max(0, Math.ceil((expiryTime - currentTime) / (1000 * 60 * 60 * 24)));
          } else if (purchaseDate) {
            const validationDays = (activePlan.durationMonths || 1) * (activePlan.planSnapshot?.duration || 30);
            const purchaseTime = new Date(purchaseDate).getTime();
            const currentTime = new Date().getTime();
            const validityMs = validationDays * 24 * 60 * 60 * 1000;
            const diff = (purchaseTime + validityMs) - currentTime;
            days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          }
          
          if (days <= 0) return null;

          return (
            <div className="lg:absolute lg:top-4 lg:left-2 mb-6 lg:mb-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-3 text-white shadow-md flex flex-col gap-2 z-10 w-full lg:w-auto min-w-[250px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[9px] font-semibold text-emerald-100 uppercase tracking-wider mb-0.5">{t("Current Active Plan")}</h2>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-yellow-300" />
                    {planName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm text-center border border-white/10 shadow-inner">
                    <div className="text-base font-extrabold leading-none">{days}</div>
                    <div className="text-[7px] font-bold text-emerald-100 uppercase tracking-wider mt-0.5">{t("Days Left")}</div>
                  </div>
                </div>
              </div>

              {/* Auto Subscription Toggle */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/20">
                <span className="flex items-center gap-1.5 text-emerald-100 text-[11px] font-semibold">
                  <RefreshCw className={`w-3.5 h-3.5 ${isAutoSubscription ? 'text-yellow-300' : 'text-emerald-200'}`} />
                  {t("Auto Subscription")}
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={async () => {
                    const nextState = !isAutoSubscription;
                    setIsAutoSubscription(nextState);
                    try {
                      const res = await toggleAutoRenew(nextState);
                      toast.success(res.message || (nextState ? t("Auto Subscription Enabled") : t("Auto Subscription Disabled")));
                    } catch (err) {
                      toast.success(nextState ? t("Auto Subscription Enabled") : t("Auto Subscription Disabled"));
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAutoSubscription ? 'bg-emerald-400' : 'bg-slate-700/60'
                  }`}
                  aria-label="Toggle Auto Subscription"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isAutoSubscription ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Header */}
        <div className="text-center mb-10 lg:pl-24">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight mb-3">{t("Choose the Right Plan for Your")} <span className="text-emerald-600">{t("Career Growth")}</span>
          </h1>
          <p className="text-slate-500 text-base">{t(
            "Unlock powerful AI insights, personalized reports, and smart alerts to get hired faster."
          )}</p>
        </div>



        {/* Duration Toggles */}
        <div className="flex justify-center mb-10 relative px-4 sm:px-0">
          <div className="bg-white border border-emerald-100 rounded-2xl sm:rounded-full p-1.5 flex flex-col sm:flex-row sm:inline-flex items-stretch sm:items-center relative shadow-sm w-full sm:w-auto gap-1 sm:gap-0">
            <button
              onClick={() => setSelectedDuration(1)}
              className={`relative z-10 w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2.5 text-sm font-bold rounded-xl sm:rounded-full transition-colors flex items-center justify-center ${selectedDuration === 1 ? 'text-white bg-emerald-600 shadow' : 'text-slate-500 hover:text-emerald-950 bg-slate-50 sm:bg-transparent'}`}
            >{t("Monthly Plans")}</button>
            <button
              onClick={() => setSelectedDuration(3)}
              className={`relative z-10 w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2.5 text-sm font-bold rounded-xl sm:rounded-full transition-colors flex items-center justify-center gap-2 ${selectedDuration === 3 ? 'text-white bg-emerald-600 shadow' : 'text-slate-500 hover:text-emerald-950 bg-slate-50 sm:bg-transparent'}`}
            >{t("Quarterly Plans")}<span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${selectedDuration === 3 ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>{t("10% OFF")}</span>
            </button>
            <button
              onClick={() => setSelectedDuration(12)}
              className={`relative z-10 w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2.5 text-sm font-bold rounded-xl sm:rounded-full transition-colors flex items-center justify-center gap-2 ${selectedDuration === 12 ? 'text-white bg-emerald-600 shadow' : 'text-slate-500 hover:text-emerald-950 bg-slate-50 sm:bg-transparent'}`}
            >{t("Yearly Plans")}<span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${selectedDuration === 12 ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>{t("20% OFF")}</span>
              {selectedDuration !== 12 && (
                <div className="absolute top-0 right-2 -translate-y-1/2 sm:-top-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{t("BEST VALUE")}</div>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-xl font-bold text-slate-700">{t("No Plans Available")}</h3>
            <p className="text-slate-500 mt-2">{t("There are currently no provider plans available. Please check back later.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[...plans].sort((a,b) => a.price - b.price).map((plan) => {
              const isPro = plan.isPopular;
              const isPremium = plan.price > 500;
              
              // Apply duration discounts properly
              let displayPrice = plan.priceMonthly || plan.price;
              let displayMonthly = displayPrice;
              if (selectedDuration === 3) displayMonthly = displayPrice * 0.9;
              if (selectedDuration === 12) displayMonthly = displayPrice * 0.8;
              
              return (
                <div 
                  key={plan._id} 
                  onClick={(e) => {
                    if (!e.target.closest('button')) {
                      document.getElementById(`plan-btn-${plan._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="bg-white rounded-3xl p-6 relative flex flex-col border border-emerald-100 shadow-md transition-all duration-300 hover:border-2 hover:border-teal-600 hover:shadow-xl hover:scale-105 hover:z-10 cursor-pointer"
                >
                  {isPro && (
                    <></>
                  )}
                  {isPremium && (
                    <div className="absolute top-4 right-4 text-amber-500">
                      <Crown className="w-8 h-8" />
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isPro ? 'text-teal-600' : isPremium ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-emerald-950">{formatCurrency(Math.round(displayMonthly), plan.currencySymbol)}</span>
                      <span className="text-xs text-slate-500 font-semibold">{t("/month")}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 h-4">{plan.description}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-950 mb-4 uppercase tracking-wider">
                      {t('WHAT\'S INCLUDED')}
                    </p>
                  <ul className="space-y-3">
                    {(plan.features || []).map((feature, i) => {
                      if (!feature) return null;
                      const [name, val] = feature.split(':');
                      return (
                        <li key={`f-${i}`} className="flex items-start justify-between text-xs gap-3">
                          <div className="flex items-start gap-2 text-emerald-950 font-medium">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{name.trim()}</span>
                          </div>
                          {val && <span className="text-slate-500 text-right shrink-0">{val.trim()}</span>}
                        </li>
                      );
                    })}
                    {plan.aiLimits && PROVIDER_FEATURES.map(({ key, label }) => {
                      const val = plan.aiLimits[key];
                      if (val === undefined || val === null) return null;
                      const isIncluded = val !== 0;
                      return (
                        <li key={`ai-${key}`} className={`flex items-start justify-between text-xs gap-3 ${!isIncluded ? 'opacity-50' : ''}`}>
                          <div className={`flex items-start gap-2 font-medium ${isIncluded ? 'text-emerald-950' : 'text-slate-500'}`}>
                            {isIncluded ? (
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <span className={!isIncluded ? 'line-through' : ''}>{label}</span>
                          </div>
                          {isIncluded && <span className="text-slate-500 text-right shrink-0 font-bold">{val === -1 ? 'Unlimited' : val}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="mt-8 pt-4">
                  {(() => {
                    const isActivePlan = activePlanData?.subscription?.subscriptionStatus === 'active' && String(activePlanData?.subscription?.planId) === String(plan._id) && Number(activePlanData?.subscription?.durationMonths || 1) === selectedDuration;
                    if (isActivePlan) {
                      return (
                        <button
                          id={`plan-btn-${plan._id}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const nextState = !isAutoSubscription;
                            setIsAutoSubscription(nextState);
                            try {
                              const res = await toggleAutoRenew(nextState);
                              toast.success(res.message || (nextState ? t("Auto Renewal Enabled") : t("Auto Renewal Cancelled")));
                            } catch (err) {
                              toast.success(nextState ? t("Auto Renewal Enabled") : t("Auto Renewal Cancelled"));
                            }
                          }}
                          className={`w-full py-3 rounded-xl font-bold text-sm border transition-all shadow-sm flex items-center justify-center gap-2 ${
                            isAutoSubscription 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          {isAutoSubscription ? t("Cancel Renewal") : t("Enable Renewal")}
                        </button>
                      );
                    }

                    return (
                      <button
                        id={`plan-btn-${plan._id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                          setShowConfigModal(true);
                        }}
                        disabled={checkoutLoading}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                          isPro 
                            ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                            : isPremium
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {checkoutLoading && selectedPlan?._id === plan._id ? (
                          <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" /> {t("Processing...")}
                          </span>
                        ) : (
                          `${t("Get Started with")} ${plan.name.split(' ')[0]}`
                        )}
                      </button>
                    );
                  })()}
                  <p className="text-[10px] text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />{t("Cancel anytime. No hidden charges.")}</p>
                </div>
              </div>
            );
          })}
        </div>
        )}

          
          {/* Important Disclaimers */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle className="w-16 h-16 text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2 text-xs text-amber-800 font-medium">
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  {t("All prices are in INR and exclusive of applicable taxes (GST), where applicable.")}
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  {t("Showcase your freelance profile and receive direct calls or WhatsApp enquiries from verified clients—with your consent.")}
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  {t("Subscriptions renew automatically until cancelled by the user. You can cancel future renewals anytime before the next billing cycle.")}
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  {t("By subscribing, you agree to our Terms & Conditions, Privacy Policy, and Refund Policy.")}
                </p>
              </div>
              <div className="flex-1 bg-white/60 p-4 rounded-xl border border-amber-100/50">
                <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  {t("AI disclaimer")}
                </span>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  {t("AI-generated scores, recommendations and career insights are intended to assist users and do not guarantee interviews, recruiter responses or employment outcomes.")}
                </p>
              </div>
            </div>
          </div>

        {/* Empty Comparison Table (Removed) */}

          {/* Bottom Bar */}
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setIsAutoSubscription(!isAutoSubscription)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${isAutoSubscription ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoSubscription ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">{t("Auto Subscription")}</p>
                <p className="text-xs text-slate-500">{t("Your plan will auto-renew at the end of each billing cycle.")}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 sm:gap-6 text-xs font-bold text-slate-500 mt-4 md:mt-0">
              <div className="flex items-center gap-1.5 sm:gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />{t("100% Secure Payments")}</div>
              <div className="flex items-center gap-1.5 sm:gap-2"><RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />{t("Cancel Anytime")}</div>
              <div className="flex items-center gap-1.5 sm:gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />{t("7-Day Money Back Guarantee (T&C Apply)")}</div>
            </div>
          </div>
      {/* Configuration & Checkout Modal */}
      {showConfigModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-emerald-600/10 bg-linear-to-r from-emerald-600/5 to-transparent flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-emerald-950">{t("Configure Plan")}</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">{t("Set your coverage and complete checkout")}</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none transition-colors hover:bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Addons Selection */}
              {availableAddons.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Optional Add-ons
                  </h3>
                  <div className="space-y-3">
                    {availableAddons.map(addon => {
                      const displayMonthly = Number(addon.priceMonthly || addon.price || 0);
                      return (
                        <label key={addon._id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 cursor-pointer transition-colors">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={selectedAddons.includes(addon._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedAddons(prev => [...prev, addon._id]);
                                else setSelectedAddons(prev => prev.filter(id => id !== addon._id));
                              }}
                              className="w-5 h-5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-emerald-950">{addon.name}</div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{addon.description}</div>
                            <div className="mt-2 font-extrabold text-emerald-700">
                              +₹{displayMonthly}<span className="text-[10px] text-slate-500 font-medium">/mo</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coverage Selectors (Driven by Addons) */}
              {availableAddons.some(a => selectedAddons.includes(a._id) && a.slug === 'one-pincode-top') && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Target Locality / Area")}</label>
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
                    placeholder={t("Search and select locality/area")}
                  />
                </div>
              )}

              {availableAddons.some(a => selectedAddons.includes(a._id) && a.slug === 'top-in-city') && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Target City")}</label>
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
                    placeholder={t("Search and select city")}
                  />
                </div>
              )}

              {availableAddons.some(a => selectedAddons.includes(a._id) && a.slug === 'show-top-in-country') && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Target Country")}</label>
                  <select
                    value={selectedCities[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCities(val ? [val] : []);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm"
                  >
                    <option value="">{t("-- Select Country --")}</option>
                    <option value="India">{t("India (IN)")}</option>
                    <option value="United Arab Emirates">{t("United Arab Emirates (AE)")}</option>
                    <option value="United States">{t("United States (US)")}</option>
                    <option value="United Kingdom">{t("United Kingdom (UK)")}</option>
                  </select>
                </div>
              )}

              {/* Boost Skills Selector */}
              {availableAddons.some(a => selectedAddons.includes(a._id) && ['top-in-city', 'one-pincode-top', 'show-top-in-country', 'add-multiple-skills'].includes(a.slug)) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t("Select Target Skills (Max 5)")}</label>
                  <SkillSearchSelect
                    selected={selectedSkills}
                    onAdd={(skill) => {
                      if (selectedSkills.length >= 5) {
                        toast.error(`Your plan allows max 5 skills.`);
                        return;
                      }
                      setSelectedSkills([...selectedSkills, skill]);
                    }}
                    onRemove={(skill) => {
                      setSelectedSkills(selectedSkills.filter(s => s !== skill));
                    }}
                    maxAllowed={5}
                    plan={selectedPlan.slug}
                  />
                </div>
              )}

              {/* Premium Order Summary */}
              <div className="bg-linear-to-br from-emerald-600/5 to-teal-600/5 border border-emerald-600/10 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />{t("Order Summary")}</h3>
                <div className="flex justify-between items-center text-emerald-950">
                  <span className="font-semibold">{selectedPlan.name}{t(" Plan (")}{selectedDuration}{t(" Month")}{selectedDuration > 1 ? 's' : ''}) + {selectedAddons.length} Add-on(s)</span>
                </div>
                <div className="pt-4 border-t border-emerald-600/10 flex justify-between items-center">
                  <span className="font-extrabold text-emerald-950 text-lg">{t("Ready to Check out")}</span>
                </div>
              </div>

              {/* Validation Warning */}
              {!isConfigurationValid && (
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{t("Please complete location and skill selection to proceed.")}</div>
              )}

            </div>
            <div className="p-6 border-t border-emerald-100 bg-white">
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || !isConfigurationValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
              >
                {checkoutLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <Wallet className="w-4 h-4" />{t("Proceed to Payment")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6">
            <h2 className="text-xl font-extrabold text-emerald-950 mb-2">{t("Cancel Subscription")}</h2>
            <p className="text-sm text-slate-500 mb-6">
              {t("Are you sure you want to cancel your active subscription? This will cancel your plan immediately and process a refund to your bank account.")}
            </p>
            
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
              <input
                type="checkbox"
                checked={cancelConfirmed}
                onChange={(e) => setCancelConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-sm text-red-800 font-medium leading-tight">
                {t("I understand that my plan will be cancelled immediately and I will lose access to premium features.")}
              </span>
            </label>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t("Keep My Plan")}
              </button>
              <button
                onClick={proceedCancelPlan}
                disabled={!cancelConfirmed}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
              >
                {t("Cancel Subscription")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProviderPlans;
