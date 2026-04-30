import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  checkoutPlan,
  confirmPayment,
  getMyPlan,
  getProviderPlans,
  previewPlan,
} from '../../services/providerPlanService';
import { useAuth } from '../../context/AuthContext';

const DURATION_OPTIONS = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months', badge: 'Save 10%' },
  { months: 6, label: '6 Months', badge: 'Save 15%' },
  { months: 12, label: '12 Months', badge: 'Save 25%' },
];
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
  const [tab, setTab] = useState('provider');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

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
    const runPreview = async () => {
      if (!selectedPlan) return;
      try {
        const preview = await previewPlan({
          planId: selectedPlan._id,
          durationMonths: selectedDuration,
        });
        setPricingPreview(preview?.pricing || null);
      } catch (_) {
        setPricingPreview(buildLocalPreview(selectedPlan, selectedDuration));
      }
    };

    runPreview();
  }, [selectedPlan, selectedDuration]);

  const summary = useMemo(() => {
    if (!selectedPlan) return null;
    const pricing = pricingPreview || buildLocalPreview(selectedPlan, selectedDuration);
    return {
      planName: selectedPlan.name,
      planType: 'Provider Plan',
      coverage: coverageLabels[selectedPlan.coverageType] || 'Custom Coverage',
      skills: Number(selectedPlan.maxSkills || 1) > 1 ? 'Multiple Skills' : 'One Skill',
      duration: `${selectedDuration} Month${selectedDuration > 1 ? 's' : ''}`,
      subtotal: pricing?.subtotal || 0,
      gstAmount: pricing?.gstAmount || 0,
      totalAmount: pricing?.totalAmount || 0,
    };
  }, [pricingPreview, selectedDuration, selectedPlan]);

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
      });

      if (response?.checkout?.paymentRequired && response?.checkout?.orderId && window?.Razorpay) {
        const options = {
          key: response.checkout.keyId,
          amount: response.checkout.amount,
          currency: response.checkout.currency || 'INR',
          order_id: response.checkout.orderId,
          name: 'ServiceHub',
          description: selectedPlan.name,
          handler: async (payment) => {
            await confirmPayment({
              subscriptionId: response.subscription?._id,
              paymentId: payment?.razorpay_payment_id,
              orderId: payment?.razorpay_order_id,
            });
            await getMyPlan();
            toast.success('Payment successful! Plan activated.');
          },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.success(response?.checkout?.message || 'Checkout created. Awaiting payment confirmation.');
        await getMyPlan();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      <div className="max-w-8xl px-2 lg:grid grid-cols-4 mx-auto gap-3 py-8">
        <div className='col-span-3'>


          <div className="flex flex-col gap-6 ">
            <div>
              <h1 className="text-2xl font-bold text-[#06133D]">Choose Your Visibility Plan</h1>
              <p className="text-sm text-[#64748B] mt-1">Select the perfect plan to boost your visibility and get more leads.</p>
            </div>

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
                      <p className="text-sm font-semibold text-[#06133D]">Your one skill for one pin code is free!</p>
                      <p className="text-xs text-[#64748B]">For getting more opportunities, go for our economical plans below.</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                {plans.length === 0 ? (
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-10 text-center text-[#64748B]">
                    No plans available right now.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                    {plans.map((plan) => {
                      const Icon = planIconMap[plan.slug] || BadgeCheck;
                      const isSelected = selectedPlan?._id === plan._id;
                      const hasDiscount = Number(plan.discountedPrice || 0) > Number(plan.priceMonthly || plan.price || 0);
                      const priceMonthly = Number(plan.priceMonthly || plan.price || 0);

                      return (
                        <div
                          key={plan._id}
                          className={`bg-white border rounded-2xl p-4 shadow-sm transition ${isSelected ? 'border-[#005BFF] ring-2 ring-[#D6E3FF]' : 'border-[#E8EEF9]'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F7FF] flex items-center justify-center">
                              <Icon className="w-5 h-5 text-[#005BFF]" />
                            </div>
                            {plan.isPopular && (
                              <span className="text-[10px] font-bold uppercase bg-[#E6F2FF] text-[#005BFF] px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-[#06133D] text-sm">{plan.name}</h3>
                          <ul className="mt-3 space-y-2 text-xs text-[#64748B]">
                            {(plan.features || []).slice(0, 5).map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-[#12B76A] mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-lg font-bold text-[#06133D]">{formatCurrency(priceMonthly)}</span>
                            <span className="text-xs text-[#64748B]">/ month</span>
                            {hasDiscount && (
                              <span className="text-xs text-[#94A3B8] line-through">{formatCurrency(plan.discountedPrice)}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            className={`mt-4 w-full text-sm font-semibold px-4 py-2.5 rounded-xl transition ${isSelected
                              ? 'bg-[#005BFF] text-white'
                              : 'border border-[#D6E3FF] text-[#005BFF] hover:bg-[#EEF4FF]'
                              }`}
                          >
                            {isSelected ? 'Selected Plan' : 'Select Plan'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#06133D]">Choose Plan Duration & Save More</h3>
                    <span className="text-xs text-[#64748B]">Monthly billing</span>
                  </div>
                  <div className="grid sm:grid-cols-4 gap-3">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.months}
                        type="button"
                        onClick={() => setSelectedDuration(option.months)}
                        className={`border rounded-xl px-3 py-3 text-left transition ${selectedDuration === option.months
                          ? 'border-[#005BFF] bg-[#EEF4FF]'
                          : 'border-[#E8EEF9] hover:border-[#C7DAFF]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#06133D]">{option.label}</span>
                          {option.badge && (
                            <span className="text-[10px] font-bold bg-[#E6F2FF] text-[#005BFF] px-2 py-0.5 rounded-full">
                              {option.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-4">
                    <Wallet className="w-6 h-6 text-[#005BFF]" />
                    <h4 className="mt-3 text-sm font-semibold text-[#06133D]">More Visibility</h4>
                    <p className="text-xs text-[#64748B] mt-1">Rank higher in search results.</p>
                  </div>
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-4">
                    <MapPin className="w-6 h-6 text-[#12B76A]" />
                    <h4 className="mt-3 text-sm font-semibold text-[#06133D]">Qualified Leads</h4>
                    <p className="text-xs text-[#64748B] mt-1">Get priority & verified leads.</p>
                  </div>
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-4">
                    <BadgeCheck className="w-6 h-6 text-[#F59E0B]" />
                    <h4 className="mt-3 text-sm font-semibold text-[#06133D]">Dedicated Support</h4>
                    <p className="text-xs text-[#64748B] mt-1">Access premium plan support.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF4FF] flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-[#005BFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#06133D]">7-day money-back guarantee</p>
                      <p className="text-xs text-[#64748B]">Cancel anytime. No hidden charges.</p>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E8EEF9] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F4F7FF] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#005BFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#06133D]">Need help choosing?</p>
                      <p className="text-xs text-[#64748B]">Talk to our plan experts.</p>
                    </div>
                    <button
                      type="button"
                      className="ml-auto text-xs font-semibold text-[#005BFF] flex items-center gap-1"
                    >
                      Chat on WhatsApp <ChevronRight className="w-4 h-4" />
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
              {user?.profilePhoto || user?.avatar ? (
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
          <div className="bg-white border border-[#E8EEF9] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#06133D] mb-4">Your Plan Summary</h3>
            {summary ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Plan</span>
                  <span className="font-semibold text-[#06133D]">{summary.planName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Plan Type</span>
                  <span className="font-semibold text-[#06133D]">{summary.planType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Coverage</span>
                  <span className="font-semibold text-[#06133D]">{summary.coverage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Skills</span>
                  <span className="font-semibold text-[#06133D]">{summary.skills}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Duration</span>
                  <span className="font-semibold text-[#06133D]">{summary.duration}</span>
                </div>

                <div className="h-px bg-[#EEF2FF]" />
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Subtotal</span>
                  <span className="font-semibold text-[#06133D]">{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">GST (18%)</span>
                  <span className="font-semibold text-[#06133D]">{formatCurrency(summary.gstAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-[#06133D]">Total Amount</span>
                  <span className="font-bold text-[#06133D]">{formatCurrency(summary.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#64748B]">Select a plan to view summary.</div>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!selectedPlan || checkoutLoading}
              className="mt-5 w-full bg-[#005BFF] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#0A4EE0] transition disabled:opacity-60"
            >
              {checkoutLoading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>

          <div className="bg-white border border-[#E8EEF9] rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-[#06133D] mb-3">What you get?</h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> Top position in entire city</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> More visibility & leads</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> Priority in search results</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> WhatsApp & SMS alerts</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#12B76A]" /> Cancel or change anytime</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProviderPlans;
