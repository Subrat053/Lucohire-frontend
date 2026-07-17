import useTranslation from "../../hooks/useTranslation";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiCheck, HiOutlineLightningBolt, HiX } from 'react-icons/hi';
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
    cardClass: 'border-2 border-[#4a24ba] shadow-xl shadow-indigo-100/50 relative z-10', bestFor: 'Startups\nHire up to 10 positions/month',
    highlight: true, badge: 'Most Popular', featureBadge: 'Save 40+ hours/month', featureBadgeClass: 'bg-indigo-50 text-indigo-700',
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
  const [customPlanDuration, setCustomPlanDuration] = useState(1);
  const [customPlanFeatures, setCustomPlanFeatures] = useState([]);
  const [customPlanNotes, setCustomPlanNotes] = useState('');

  const [roiHires, setRoiHires] = useState(500);
  const manualCostPerHire = 8000;

  const manualTotal = roiHires * manualCostPerHire;
  const lucohireTotal = Math.floor(manualTotal * 0.25);
  const savings = manualTotal - lucohireTotal;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await recruiterAPI.getPlans();
      setPlans(data || []);
      const dashboard = await recruiterAPI.getDashboard();
      setCurrentPlan(dashboard.data?.stats?.currentPlan || 'free');
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = async (planId) => {
    const plan = plans.find(p => p._id === planId);
    if (!plan) return;
    
    const baseSlug = plan.slug?.toLowerCase().replace('-yearly', '');
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
        notes: customPlanNotes
      });
      if (res.data?.success) {
        toast.success('Custom plan request submitted! Our team will contact you shortly.');
        setShowCustomPlanModal(false);
        setCustomPlanDuration(1);
        setCustomPlanFeatures([]);
        setCustomPlanNotes('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const plansByDuration = { Monthly: [], Yearly: [] };
  plans.forEach(p => {
    if (p.duration >= 365) plansByDuration.Yearly.push(p);
    else plansByDuration.Monthly.push(p);
  });
  const displayedPlans = plansByDuration[activePeriod]?.length ? plansByDuration[activePeriod] : plans;

  const sortOrder = { 'free': 1, 'starter': 2, 'growth': 3, 'business': 4, 'enterprise': 5 };
  displayedPlans.sort((a,b) => (sortOrder[a.slug] || 99) - (sortOrder[b.slug] || 99));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 py-3 px-6 hidden md:flex items-center justify-between text-xs font-bold text-slate-600">
        <div className="flex items-center gap-2"><HiCheck className="text-green-500 text-lg"/>{t("Free Job Posting Forever")}</div>
        <div className="flex items-center gap-2"><FaWallet className="text-indigo-500"/>{t("14 Days Money Back Guarantee")}</div>
        <div className="flex items-center gap-2"><FaRegClock className="text-orange-500"/>{t("Cancel Anytime No Questions Asked")}</div>
        <div className="flex items-center gap-2"><FaShieldAlt className="text-green-600"/>{t("100% Secure Payments")}</div>
        <div className="flex items-center gap-2"><FaHeadset className="text-blue-500"/>{t("24/7 Priority Support")}</div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-16">
          <div className="max-w-xl">
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{t("Hire Faster.")}<br />{t("Let")}<span className="text-indigo-600">{t("AI")}</span>{t("Do the Hard Work.")}</h1>
            <p className="text-slate-500 text-lg mb-8 font-medium">{t(
              "The AI-Powered Recruitment Platform for Startups, Teams, Agencies & Enterprises."
            )}</p>
            <ul className="space-y-4">
              {['Post Jobs for Free Forever', 'Unlimited Candidate Search', 'AI Screening & Smart Shortlisting', 'Automate Outreach & Follow-ups', 'Make Data-Driven Hiring Decisions'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <HiCheck className="w-4 h-4"/>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center w-40">
                <FaRegClock className="text-indigo-500 text-3xl mb-3" />
                <div className="text-3xl font-black text-slate-900">92%</div>
                <div className="text-xs text-slate-500 font-bold">{t("Time Saved")}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center w-40">
                <FaChartLine className="text-indigo-500 text-3xl mb-3" />
                <div className="text-3xl font-black text-slate-900">{t("5X")}</div>
                <div className="text-xs text-slate-500 font-bold text-center">{t("More Qualified")}<br/>{t("Applicants")}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center w-40">
                <FaWallet className="text-indigo-500 text-3xl mb-3" />
                <div className="text-3xl font-black text-slate-900">80%</div>
                <div className="text-xs text-slate-500 font-bold">{t("Lower Hiring Cost")}</div>
              </div>
            </div>
            <div className="self-end text-right mt-4">
              <div className="text-xs font-bold text-slate-600">{t("Trusted by")}<br/><span className="text-slate-900 font-black">10,000+</span><br/>{t("Recruiters & Companies")}</div>
            </div>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="flex justify-center items-center gap-2 mb-10 relative">
              <div className="bg-white border border-slate-200 p-1 rounded-full inline-flex font-bold text-sm shadow-sm relative">
                <button 
                  onClick={() => setActivePeriod('Monthly')}
                  className={`px-6 py-2.5 rounded-full transition-all ${activePeriod === 'Monthly' ? 'bg-[#4a24ba] text-white shadow-md' : 'text-slate-900 hover:bg-slate-50'}`}
                >{t("Billed Monthly")}</button>
                <button 
                  onClick={() => setActivePeriod('Yearly')}
                  className={`px-6 py-2.5 rounded-full transition-all ${activePeriod === 'Yearly' ? 'bg-[#4a24ba] text-white shadow-md' : 'text-slate-900 hover:bg-slate-50'}`}
                >{t("Billed Yearly")}</button>
              </div>
              <div className="text-green-600 text-[10px] font-bold flex items-center gap-1">{t("Save up to 20%")}<HiOutlineLightningBolt className="w-4 h-4 text-green-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-20">
              {displayedPlans.map(plan => {
                const baseSlug = plan.slug?.toLowerCase().replace('-yearly', '');
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
            </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 my-8">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{t("Request Custom Plan")}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{t("Tell us your requirements and our team will get in touch.")}</p>
                  </div>
                  <button onClick={() => setShowCustomPlanModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-500">
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
                
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">{t("Features Needed")}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Custom solutions', 'Dedicated support', 'SLA & security', 'Unlimited hiring', 'Custom integrations', 'Data export'].map((feature) => (
                        <label key={feature} className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={customPlanFeatures.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) setCustomPlanFeatures([...customPlanFeatures, feature]);
                              else setCustomPlanFeatures(customPlanFeatures.filter(f => f !== feature));
                            }}
                            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

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

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowCustomPlanModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition">{t("Cancel")}</button>
                  <button onClick={submitCustomPlanRequest} disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-70">
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecruiterPlans;
