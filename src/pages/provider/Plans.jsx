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
} from 'lucide-react';
import toast from 'react-hot-toast';
import RouteLoader from '../../components/common/RouteLoader';
import {
  checkoutPlan,
  confirmPayment,
  getCurrentSubscription,
  getMyPlan,
  getProviderPlans,
  previewPlan,
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

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const buildLocalPreview = (plan, months) => {
  if (!plan) return null;
  const monthlyPrice = Number(plan.priceMonthly || plan.price || 0);
  const discountPercent = DISCOUNT_BY_MONTHS[months] || 0;
  const subtotal = Math.max(0, Math.round(monthlyPrice * months * (1 - discountPercent / 100) * 100) / 100);
  const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;
  return {
    monthlyPrice,
    discountPercent,
    subtotal,
    gstPercent: 18,
    gstAmount,
    totalAmount,
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

  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [finalizingPayment, setFinalizingPayment] = useState(false);

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

  useEffect(() => {
    setSelectedSkills([]);
    setSelectedPincodes([]);
    setSelectedCities([]);
  }, [selectedPlan]);


  // =============================================================
  const navigate = useNavigate();
  const { user } = useAuth();

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
        const [planList, myPlan] = await Promise.all([getProviderPlans(), getMyPlan()]);
        setPlans(planList);

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
          await confirmPayment({
            subscriptionId: subId,
            paymentId: sessionId,
            orderId: 'stripe_session',
          });
          await getCurrentSubscription().catch(() => null);
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
    if (selectedPlan.slug === 'one-pincode-top') {
      return selectedSkills.length === 1 && selectedPincodes.length === 1;
    }
    if (selectedPlan.slug === 'top-in-city') {
      return selectedSkills.length >= 1 && selectedCities.length === 1;
    }
    if (selectedPlan.slug === 'show-top-in-country') {
      return selectedSkills.length >= 1 && selectedCities.length === 1;
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
      gstAmount: pricing?.gstAmount || 0,
      totalAmount: pricing?.totalAmount || 0,
    };
  }, [pricingPreview, selectedDuration, selectedPlan, selectedSkills, selectedPincodes, selectedCities]);

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Select a plan to continue.');
      return;
    }

    setCheckoutLoading(true);
    try {

      const response = await checkoutPlan({
        planId: selectedPlan._id,
        durationMonths: selectedDuration,
        selectedSkills,
        selectedPincodes,
        selectedCities,
      });

      const { checkout, subscription } = response || {};

      if (checkout?.simulationMode) {
        // Simulation Flow
        const confirm = window.confirm('Simulation Mode: Click OK to simulate successful payment.');
        if (confirm) {
          await confirmPayment({
            subscriptionId: subscription?._id,
            paymentId: 'sim_' + Date.now(),
            orderId: 'sim_order_' + Date.now(),
          });
          await getMyPlan();
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
            await confirmPayment({
              subscriptionId: subscription?._id,
              paymentId: payment?.razorpay_payment_id,
              orderId: payment?.razorpay_order_id,
            });
            await getMyPlan();
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
        // Implement Stripe Elements/Redirect here if needed
        // For now, if no clientSecret, we might just be in a state where manual is better
      } else {
        toast.success(checkout?.message || 'Checkout created. Our team will review your request.');
        await getMyPlan();
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
    <div className="min-h-screen bg-[#F5F8FF]">
      <div className="max-w-8xl px-2 lg:grid grid-cols-4 mx-auto gap-3 py-8">
        <div className='col-span-3'>


          <div className="flex flex-col gap-6 ">
            <div>
              <h1 className="text-2xl font-bold text-[#06133D]">{t('plans.chooseVisibility', 'Choose Your Visibility Plan')}</h1>
              <p className="text-sm text-[#64748B] mt-1">{t('plans.chooseVisibilityDesc', 'Select the perfect plan to boost your visibility and get more leads.')}</p>
            </div>

            {finalizingPayment && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
                Finalizing your payment and updating coverage limits...
              </div>
            )}

            {/* <div className="flex items-center gap-3">
            <div className="flex bg-white border border-[#E8EEF9] rounded-full p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setTab('provider')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${tab === 'provider' ? 'bg-[#005BFF] text-white' : 'text-[#64748B]'
                  }`}
              >
                For Providers
              </button>
              <button
                type="button"
                onClick={() => setTab('recruiter')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${tab === 'recruiter' ? 'bg-[#005BFF] text-white' : 'text-[#64748B]'
                  }`}
              >
                For Recruiters
              </button>
            </div>
          </div> */}

            <div className="grid grid-cols-1  ">
              <div className="space-y-6 ">
                <div className="bg-[#EEF4FF] border border-[#D6E3FF] rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <BadgePercent className="w-5 h-5 text-[#005BFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#06133D]">{t('plans.freePlanTitle', 'Your one skill for one pin code is free!')}</p>
                      <p className="text-xs text-[#64748B]">{t('plans.freePlanDesc', 'For getting more opportunities, go for our economical plans below.')}</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                {plans.length === 0 ? (
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-10 text-center text-[#64748B]">
                    {t('plans.noPlans', 'No plans available right now.')}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                    {plans.map((plan) => {
                      const Icon = planIconMap[plan.slug] || BadgeCheck;
                      const isSelected = selectedPlan?._id === plan._id;
                      const hasOldPrice = Number(plan.oldMonthlyPrice || plan.discountedPrice || 0) > Number(plan.priceMonthly || plan.price || 0);
                      const priceMonthly = Number(plan.priceMonthly || plan.price || 0);
                      const oldPrice = Number(plan.oldMonthlyPrice || plan.discountedPrice || 0);

                      return (
                        <div
                          key={plan._id}
                          className={`bg-white border rounded-2xl p-4 shadow-sm transition relative overflow-hidden ${isSelected ? 'border-[#005BFF] ring-2 ring-[#D6E3FF]' : 'border-[#E8EEF9]'
                            }`}
                        >
                          {plan.isPopular && (
                            <div className="absolute top-0 right-0">
                               <div className="bg-[#005BFF] text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                  {t('common.popular', 'Popular')}
                               </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F7FF] flex items-center justify-center">
                              <Icon className="w-5 h-5 text-[#005BFF]" />
                            </div>
                          </div>
                          <h3 className="font-bold text-[#06133D] text-sm">{plan.name}</h3>
                          <ul className="mt-3 space-y-2 text-xs text-[#64748B]">
                            {(plan.features || []).slice(0, 5).map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-[#12B76A] mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4 flex flex-col gap-0.5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-extrabold text-[#06133D]">{formatCurrency(priceMonthly)}</span>
                                <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-tighter">/ month</span>
                            </div>
                            {hasOldPrice && (
                              <span className="text-xs text-[#94A3B8] line-through font-medium">{formatCurrency(oldPrice)}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (plan.slug === 'customise-plan') {
                                navigate('/provider/customise-plan');
                              } else {
                                setSelectedPlan(plan);
                              }
                            }}
                             className={`mt-4 w-full text-xs font-bold px-4 py-2.5 rounded-xl transition ${isSelected
                               ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-0'
                               : 'border-2 border-[#081B3A] text-[#081B3A] hover:bg-[#081B3A]/5'
                               }`}
                          >
                            {plan.slug === 'customise-plan'
                              ? t('plans.customiseNow', 'Customise Plan')
                              : isSelected ? t('plans.currentSelection', 'Current Selection') : t('plans.selectPlan', 'Select Plan')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                

                {/* Coverage Details Section */}
                {selectedPlan && selectedPlan.slug !== 'free' && selectedPlan.slug !== 'customise-plan' && (
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-6 shadow-sm animate-fade-in">
                    <h3 className="text-base font-bold text-[#06133D] mb-5">{t('plans.configureCoverage', 'Configure Your Coverage')}</h3>
                    <div className="space-y-6">
                      
                      {/* Locality Autocomplete - for Locality Plan */}
                      {selectedPlan.slug === 'one-pincode-top' && (
                        <div>
                          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Target Locality / Area
                          </label>
                          <LocationSearch
                            value={selectedPincodes[0] || ''}
                            onChange={(val) => {
                              if (!val) setSelectedPincodes([]);
                            }}
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
                          {selectedPincodes.length > 0 ? (
                            <div className="mt-3 bg-[#F0FFF7] border border-[#D1FADF] rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-[#027A48] animate-scale-up">
                              <span>📍</span>
                              <span className="truncate">{selectedPincodes[0]}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedPincodes([])}
                                className="text-[#027A48] hover:text-red-500 font-extrabold text-sm ml-auto"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1 font-semibold flex items-center gap-1 animate-pulse">
                              ⚠️ Select locality to continue
                            </p>
                          )}
                        </div>
                      )}

                      {/* City Autocomplete - for City Plan */}
                      {selectedPlan.slug === 'top-in-city' && (
                        <div>
                          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Target City
                          </label>
                          <LocationSearch
                            value={selectedCities[0] || ''}
                            onChange={(val) => {
                              if (!val) setSelectedCities([]);
                            }}
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
                          {selectedCities.length > 0 ? (
                            <div className="mt-3 bg-[#F0FFF7] border border-[#D1FADF] rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-[#027A48] animate-scale-up">
                              <span>🏢</span>
                              <span className="truncate">{selectedCities[0]}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedCities([])}
                                className="text-[#027A48] hover:text-red-500 font-extrabold text-sm ml-auto"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1 font-semibold flex items-center gap-1 animate-pulse">
                              ⚠️ Select city to continue
                            </p>
                          )}
                        </div>
                      )}

                      {/* Country Autocomplete/Dropdown - for Country Plan */}
                      {selectedPlan.slug === 'show-top-in-country' && (
                        <div>
                          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Target Country
                          </label>
                          <select
                            value={selectedCities[0] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedCities(val ? [val] : []);
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#005BFF] focus:border-transparent outline-none text-sm font-semibold text-[#06133D] bg-white"
                          >
                            <option value="">-- Select Country --</option>
                            <option value="India">India (IN)</option>
                            <option value="United Arab Emirates">United Arab Emirates (AE)</option>
                            <option value="United States">United States (US)</option>
                            <option value="United Kingdom">United Kingdom (UK)</option>
                          </select>
                          {selectedCities.length > 0 ? (
                            <div className="mt-3 bg-[#F0FFF7] border border-[#D1FADF] rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-[#027A48] animate-scale-up">
                              <span>🌐</span>
                              <span className="truncate">{selectedCities[0]}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedCities([])}
                                className="text-[#027A48] hover:text-red-500 font-extrabold text-sm ml-auto"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1 font-semibold flex items-center gap-1 animate-pulse">
                              ⚠️ Select country to continue
                            </p>
                          )}
                        </div>
                      )}

                      {/* Boost Skills Selector Section */}
                      <div>
                        <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
                          {selectedPlan.maxSkills === 1 ? 'Select Speciality' : `Boost Skills (Max ${selectedPlan.maxSkills})`}
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
                        {selectedSkills.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1.5 font-semibold flex items-center gap-1 animate-pulse">
                            ⚠️ Please select at least one speciality to continue
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#E8EEF9] rounded-2xl p-6 shadow-sm">

                  <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold text-[#06133D]">{t('plans.chooseDuration', 'Choose Duration & Save')}</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">{t('plans.chooseDurationDesc', 'Commit for longer and get massive discounts.')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FF] rounded-lg">
                        <BadgePercent className="w-4 h-4 text-[#005BFF]" />
                        <span className="text-xs font-bold text-[#005BFF]">{t('plans.saveUpTo', 'Save up to 25%')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.months}
                        type="button"
                        onClick={() => setSelectedDuration(option.months)}
                        className={`relative border-2 rounded-xl px-4 py-4 text-left transition ${selectedDuration === option.months
                          ? 'border-[#005BFF] bg-[#F4F8FF]'
                          : 'border-[#F1F5F9] hover:border-[#E2E8F0] bg-white'
                          }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm font-bold ${selectedDuration === option.months ? 'text-[#005BFF]' : 'text-[#06133D]'}`}>{t(`plans.duration${option.months}`, option.label)}</span>
                          {option.badge ? (
                            <span className="text-[10px] font-bold text-[#12B76A]">
                              {t('plans.savePercent', 'Save {{percent}}%', { percent: DISCOUNT_BY_MONTHS[option.months] })} {t('common.discount', 'Discount')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#64748B]">{t('plans.noDiscount', 'No discount')}</span>
                          )}
                        </div>
                        {selectedDuration === option.months && (
                            <div className="absolute top-2 right-2">
                                <div className="w-4 h-4 rounded-full bg-[#005BFF] flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                            </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0F5FF] flex items-center justify-center mb-4">
                        <Target className="w-6 h-6 text-[#005BFF]" />
                    </div>
                    <h4 className="text-base font-bold text-[#06133D]">{t('plans.feature1Title', 'Targeted Visibility')}</h4>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{t('plans.feature1Desc', 'Appear exactly where your customers are searching. Be it a pincode, city or country.')}</p>
                  </div>
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0FFF7] flex items-center justify-center mb-4">
                        <BadgeCheck className="w-6 h-6 text-[#12B76A]" />
                    </div>
                    <h4 className="text-base font-bold text-[#06133D]">{t('plans.feature2Title', 'Verified Ranking')}</h4>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{t('plans.feature2Desc', 'Paid plans get priority placement and a verified badge that builds instant trust with recruiters.')}</p>
                  </div>
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF8F0] flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                    <h4 className="text-base font-bold text-[#06133D]">{t('plans.feature3Title', 'Business Growth')}</h4>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">{t('plans.feature3Desc', 'Get detailed insights into how many people view your profile and contact you.')}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setShowGuaranteeModal(true)}
                    className="bg-white border border-[#E8EEF9] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EEF4FF] flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                      <BadgeCheck className="w-6 h-6 text-[#005BFF] group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#06133D] group-hover:text-emerald-700 transition-colors">{t('plans.guaranteeTitle', '7-day money-back guarantee')}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{t('plans.guaranteeDesc', 'Not satisfied with the leads? Get a full refund within 7 days, no questions asked.')}</p>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F4F7FF] flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-6 h-6 text-[#005BFF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#06133D]">{t('plans.customTitle', 'Need a custom solution?')}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 whitespace-normal leading-relaxed">{t('plans.customDesc', 'Configure dynamic visibility for localities, cities, or countries.')}</p>
                    </div>
                     <button
                       type="button"
                       onClick={() => navigate('/provider/customise-plan')}
                       className="w-full sm:w-auto shrink-0 px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-lg hover:bg-sky-600 transition text-center"
                     >
                      {t('plans.customiseNow', 'Customise Plan')}
                    </button>
                  </div>
                </div>
              </div>



            </div>


          </div>
        </div>
        <div className="space-y-4 col-span-1">
          <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5">
            <div className="flex items-center gap-4">
              {user?.profilePhotoApproval?.status === 'pending' && user?.profilePhotoApproval?.pendingUrl ? (
                <img
                  src={user.profilePhotoApproval.pendingUrl}
                  alt={providerName}
                  className="h-16 w-16 rounded-full object-cover border border-[#E5EAF3]"
                />
              ) : user?.profilePhoto || user?.avatar ? (
                <img
                  src={user.profilePhoto || user.avatar}
                  alt={providerName}
                  className="h-16 w-16 rounded-full object-cover border border-[#E5EAF3]"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#005BFF] flex items-center justify-center text-xl font-bold text-white">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#06133D] truncate">{providerName}</h3>
                  <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-semibold text-[#005BFF]">
                    Profile
                  </span>
                </div>

                <p className="text-sm text-[#64748B] mt-1 truncate">
                  {providerSubtitle}
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/provider/profile')}
                  className="mt-2 text-sm font-semibold text-[#005BFF] inline-flex items-center gap-1"
                >
                  View Profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {/* =========================================== */}
          <div className="bg-white border border-[#E8EEF9] rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#06133D] mb-4">{t('plans.summaryTitle', 'Your Plan Summary')}</h3>
            {summary ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">{t('plans.summaryPlan', 'Plan')}</span>
                  <span className="font-semibold text-[#06133D]">{summary.planName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">{t('plans.summaryPlanType', 'Plan Type')}</span>
                  <span className="font-semibold text-[#06133D]">{summary.planType}</span>
                </div>
                {summary.coverage && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">{t('plans.summaryCoverage', 'Coverage')}</span>
                    <span className="font-semibold text-[#06133D]">{summary.coverage}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">{t('plans.summarySkills', 'Skills')}</span>
                  <span className="font-semibold text-[#06133D]">{summary.skills}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">{t('plans.summaryDuration', 'Duration')}</span>
                  <span className="font-semibold text-[#06133D]">{summary.duration}</span>
                </div>

                <div className="h-px bg-[#EEF2FF]" />
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">{t('plans.summarySubtotal', 'Subtotal')}</span>
                  <span className="font-semibold text-[#06133D]">{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">{t('plans.summaryGst', 'GST (18%)')}</span>
                  <span className="font-semibold text-[#06133D]">{formatCurrency(summary.gstAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base border-t border-dashed border-[#EEF2FF] pt-2">
                  <span className="font-semibold text-[#06133D]">{t('plans.summaryTotal', 'Total Amount')}</span>
                  <span className="font-bold text-violet-700">{formatCurrency(summary.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#64748B]">{t('plans.selectPlanToView', 'Select a plan to view summary.')}</div>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!isConfigurationValid || checkoutLoading}
              className="mt-5 w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition disabled:opacity-60 shadow-md"
            >
              {checkoutLoading ? t('common.processing', 'Processing...') : t('plans.proceedPayment', 'Proceed to Payment')}
            </button>
          </div>

          <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-[#06133D] mb-3">{t('plans.whatYouGet', 'What you get?')}</h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> {t('plans.get1', 'Top position in entire city')}</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> {t('plans.get2', 'More visibility & leads')}</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> {t('plans.get3', 'Priority in search results')}</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> {t('plans.get4', 'WhatsApp & SMS alerts')}</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> {t('plans.get5', 'Cancel or change anytime')}</li>
            </ul>
          </div>
        </div>
      </div>

      <GuaranteeModal 
        isOpen={showGuaranteeModal} 
        onClose={() => setShowGuaranteeModal(false)} 
      />
    </div>
  );
};

export default ProviderPlans;
