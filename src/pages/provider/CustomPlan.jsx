import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerAPI } from '../../services/api';
import { getProviderPlans, getMyPlan, checkoutPlan, confirmPayment } from '../../services/providerPlanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Gift, Layers, MapPin, Building2, Globe, Trash2, Plus, Sparkles, 
  ChevronDown, ChevronUp, Lock, CheckCircle, Shield, RefreshCw, X, Search 
} from 'lucide-react';

const ALL_SKILLS = [
  'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Driver', 'Cook',
  'Welder', 'Mason', 'AC Technician', 'CCTV Installer', 'Tiler',
  'Interior Designer', 'UI/UX Designer', 'Graphic Designer', 'Web Developer',
  'Mobile Developer', 'Content Writer', 'Digital Marketer', 'Accountant',
  'Data Entry Operator', 'Receptionist', 'Security Guard', 'Housekeeping',
  'Nurse', 'Caretaker', 'Tailor', 'Beautician', 'Yoga Trainer', 'Tutor',
  'Video Editing'
];

const LOCALITIES_LIST = [
  'Andheri West, Mumbai', 'Borivali West, Mumbai', 'Goregaon East, Mumbai', 
  'Bandra West, Mumbai', 'Indiranagar, Bengaluru', 'Whitefield, Bengaluru', 
  'Connaught Place, Delhi', 'Saket, Delhi', 'Ameerpet, Hyderabad', 
  'Gachibowli, Hyderabad', 'Adyar, Chennai', 'Salt Lake, Kolkata'
];

const CITIES_LIST = [
  'Mumbai', 'Pune', 'Thane', 'Nagpur', 'Bengaluru', 'Delhi', 'Noida', 'Gurugram', 
  'Hyderabad', 'Chennai', 'Kolkata'
];

const COUNTRIES_LIST = [
  'India', 'United Arab Emirates', 'Singapore', 'United States', 'United Kingdom', 
  'Canada', 'Australia', 'Germany', 'Saudi Arabia'
];

// Predefined Durations & Prices
const LOCALITY_DURATIONS = [
  { months: 1, label: '1 Month', price: 300 },
  { months: 2, label: '2 Months', price: 500 },
  { months: 3, label: '3 Months', price: 700 },
  { months: 4, label: '4 Months', price: 800 }
];

const CITY_DURATIONS = [
  { months: 1, label: '1 Month (Trial)', price: 250, isTrial: true },
  { months: 1, label: '1 Month', price: 350 },
  { months: 3, label: '3 Months', price: 900 }
];

const COUNTRY_DURATIONS = [
  { months: 6, label: '6 Months', price: 3500 },
  { months: 12, label: '12 Months', price: 6000 }
];

// Helper to get initials
const getInitials = (skillName) => {
  if (!skillName) return 'SK';
  return skillName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const SearchSelect = ({ options, selected, onChange, placeholder, icon: Icon }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const clickAway = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', clickAway);
    return () => document.removeEventListener('mousedown', clickAway);
  }, []);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full z-20">
      <div className="relative">
        <input
          type="text"
          value={open ? query : (selected || '')}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-violet-500 outline-none focus:ring-4 focus:ring-violet-100 bg-white shadow-sm transition"
        />
        {Icon && <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto z-50">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 italic">No matches found.</div>
          )}
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setQuery('');
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 text-gray-700 transition"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [customisePlanObj, setCustomisePlanObj] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [profile, setProfile] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const isRedirected = params.get('redirected') === 'true';

  // Selection states
  const [selectedAchievements, setSelectedAchievements] = useState({
    multipleSkills: true,
    locality: true,
    city: true,
    country: true
  });

  // Table items states (Prepopulated from Mockup)
  const [localitySkill, setLocalitySkill] = useState('Graphic Designer');
  const [localityItems, setLocalityItems] = useState([
    { id: 1, locality: 'Andheri West, Mumbai', durationMonths: 4, price: 800 },
    { id: 2, locality: 'Borivali West, Mumbai', durationMonths: 3, price: 700 },
    { id: 3, locality: 'Goregaon East, Mumbai', durationMonths: 2, price: 500 }
  ]);

  const [citySkill, setCitySkill] = useState('Video Editing');
  const [cityItems, setCityItems] = useState([
    { id: 1, city: 'Pune', durationMonths: 1, price: 250, isTrial: true },
    { id: 2, city: 'Thane', durationMonths: 1, price: 350 },
    { id: 3, city: 'Nagpur', durationMonths: 3, price: 900 }
  ]);

  const [countrySkill, setCountrySkill] = useState('UI/UX Designer');
  const [countryItems, setCountryItems] = useState([
    { id: 1, country: 'India', durationMonths: 12, price: 6000 },
    { id: 2, country: 'United Arab Emirates', durationMonths: 6, price: 3500 }
  ]);

  // Expandable summary blocks
  const [expandedSummary, setExpandedSummary] = useState({
    locality: true,
    city: true,
    country: true
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [plansList, myPlan, profData] = await Promise.all([
        getProviderPlans(),
        getMyPlan(),
        providerAPI.getProfile()
      ]);

      setProfile(profData.data || null);

      const customPlan = plansList.find(p => p.slug === 'customise-plan');
      if (customPlan) {
        setCustomisePlanObj(customPlan);
      }

      if (myPlan?.subscription?.planSnapshot?.slug === 'customise-plan' || profData.data?.currentPlan === 'customise-plan') {
        setActivePlan({
          subscription: myPlan.subscription,
          config: myPlan.subscription?.customConfig || profData.data?.customConfig
        });
      }
    } catch (err) {
      toast.error('Failed to sync plan data.');
    } finally {
      setLoading(false);
    }
  };

  // Add handlers
  const handleAddLocality = () => {
    const newItem = {
      id: Date.now(),
      locality: LOCALITIES_LIST[0],
      durationMonths: 1,
      price: 300
    };
    setLocalityItems([...localityItems, newItem]);
  };

  const handleAddCity = () => {
    const newItem = {
      id: Date.now(),
      city: CITIES_LIST[0],
      durationMonths: 1,
      price: 350
    };
    setCityItems([...cityItems, newItem]);
  };

  const handleAddCountry = () => {
    const newItem = {
      id: Date.now(),
      country: COUNTRIES_LIST[0],
      durationMonths: 6,
      price: 3500
    };
    setCountryItems([...countryItems, newItem]);
  };

  // Delete handlers
  const handleDeleteLocality = (id) => {
    setLocalityItems(localityItems.filter(item => item.id !== id));
  };

  const handleDeleteCity = (id) => {
    setCityItems(cityItems.filter(item => item.id !== id));
  };

  const handleDeleteCountry = (id) => {
    setCountryItems(countryItems.filter(item => item.id !== id));
  };

  // Change handlers
  const handleLocalityItemChange = (id, field, value) => {
    setLocalityItems(localityItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'durationMonths') {
          const durationObj = LOCALITY_DURATIONS.find(d => d.months === Number(value));
          updated.price = durationObj ? durationObj.price : 300;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleCityItemChange = (id, field, value) => {
    setCityItems(cityItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'durationMonths') {
          // If trial or regular 1 month
          const durationObj = CITY_DURATIONS.find((d, idx) => {
            if (value === '1_trial') return d.isTrial;
            return d.months === Number(value) && !d.isTrial;
          });
          if (value === '1_trial') {
            updated.durationMonths = 1;
            updated.isTrial = true;
            updated.price = 250;
          } else {
            updated.durationMonths = Number(value);
            updated.isTrial = false;
            updated.price = durationObj ? durationObj.price : 350;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleCountryItemChange = (id, field, value) => {
    setCountryItems(countryItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'durationMonths') {
          const durationObj = COUNTRY_DURATIONS.find(d => d.months === Number(value));
          updated.price = durationObj ? durationObj.price : 3500;
        }
        return updated;
      }
      return item;
    }));
  };

  // Clear all
  const handleClearAll = () => {
    setLocalityItems([]);
    setCityItems([]);
    setCountryItems([]);
    toast.success('Configuration cleared.');
  };

  // Calculations
  const localityTotal = selectedAchievements.locality && localitySkill ? localityItems.reduce((acc, item) => acc + item.price, 0) : 0;
  const cityTotal = selectedAchievements.city && citySkill ? cityItems.reduce((acc, item) => acc + item.price, 0) : 0;
  const countryTotal = selectedAchievements.country && countrySkill ? countryItems.reduce((acc, item) => acc + item.price, 0) : 0;

  const subtotal = localityTotal + cityTotal + countryTotal;
  const gstAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;
  const savings = Math.round(subtotal * 0.15); // Dynamic 15% savings based on AI smart plan recommendation

  // Proceed to checkout
  const handleProceedToPayment = async () => {
    if (subtotal <= 0) {
      toast.error('Please configure at least one boost plan to proceed.');
      return;
    }
    if (!customisePlanObj) {
      toast.error('Custom plan object not found in seeded plans.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const customConfig = {
        localities: selectedAchievements.locality && localitySkill ? localityItems.map(item => ({
          skill: localitySkill,
          locality: item.locality,
          durationMonths: item.durationMonths,
          price: item.price
        })) : [],
        cities: selectedAchievements.city && citySkill ? cityItems.map(item => ({
          skill: citySkill,
          city: item.city,
          durationMonths: item.durationMonths,
          price: item.price,
          isTrial: item.isTrial
        })) : [],
        countries: selectedAchievements.country && countrySkill ? countryItems.map(item => ({
          skill: countrySkill,
          country: item.country,
          durationMonths: item.durationMonths,
          price: item.price
        })) : [],
        subtotal,
        gstAmount,
        totalAmount
      };

      const response = await checkoutPlan({
        planId: customisePlanObj._id,
        durationMonths: 1, // Custom plans override duration pricing
        customAmount: subtotal,
        customConfig
      });

      const { checkout, subscription } = response || {};

      if (checkout?.simulationMode) {
        const confirm = window.confirm('Simulation Mode: Click OK to simulate successful customized payment.');
        if (confirm) {
          await confirmPayment({
            subscriptionId: subscription?._id,
            paymentId: 'sim_' + Date.now(),
            orderId: 'sim_order_' + Date.now()
          });
          toast.success('Subscription activated successfully!');
          loadInitialData(); // Reload profile and plan states
          return;
        }
      }

      if (checkout?.paymentRequired && checkout?.url) {
        toast.success('Redirecting to payment gateway...');
        window.location.href = checkout.url;
      } else {
        toast.success(checkout?.message || 'Checkout created.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout initialization failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Active Plan Dashboard View
  if (activePlan) {
    const config = activePlan.config || {};
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/provider/profile')}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Profile
            </button>
            <div className="bg-emerald-50 text-emerald-600 font-semibold px-4 py-1.5 rounded-full border border-emerald-200 text-sm flex items-center gap-2 shadow-sm">
              <CheckCircle className="w-4 h-4" /> Active customised Plan
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 mb-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-600 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Smart Visibility Boosts Are Active!</h1>
              <p className="mt-3 text-slate-500">You have configured and purchased a personalised plan. Enjoy top visibility rankings across your configured regions.</p>
            </div>

            <hr className="border-slate-100 mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Localities Boost Info Card */}
              {config.localities?.length > 0 && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4 text-purple-700">
                    <MapPin className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Locality Boosts</h3>
                  </div>
                  <div className="space-y-4">
                    {config.localities.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                        <div className="font-bold text-slate-800 text-sm">{item.skill}</div>
                        <div className="text-slate-600 text-xs mt-1">{item.locality}</div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 text-xs">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">{item.durationMonths} Month{item.durationMonths > 1 ? 's' : ''}</span>
                          <span className="font-bold text-slate-700">₹{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cities Boost Info Card */}
              {config.cities?.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4 text-blue-700">
                    <Building2 className="w-5 h-5" />
                    <h3 className="font-bold text-lg">City Boosts</h3>
                  </div>
                  <div className="space-y-4">
                    {config.cities.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="font-bold text-slate-800 text-sm">{item.skill}</div>
                        <div className="text-slate-600 text-xs mt-1">{item.city}</div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 text-xs">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {item.isTrial ? '1 Month (Trial)' : `${item.durationMonths} Month${item.durationMonths > 1 ? 's' : ''}`}
                          </span>
                          <span className="font-bold text-slate-700">₹{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Countries Boost Info Card */}
              {config.countries?.length > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4 text-emerald-700">
                    <Globe className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Country Boosts</h3>
                  </div>
                  <div className="space-y-4">
                    {config.countries.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                        <div className="font-bold text-slate-800 text-sm">{item.skill}</div>
                        <div className="text-slate-600 text-xs mt-1">{item.country}</div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 text-xs">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">{item.durationMonths} Month{item.durationMonths > 1 ? 's' : ''}</span>
                          <span className="font-bold text-slate-700">₹{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 mt-8 flex flex-col md:flex-row md:items-center md:justify-between border border-slate-100">
              <div className="text-sm text-slate-500 mb-4 md:mb-0">
                <div className="font-bold text-slate-700">Renewal Info</div>
                <div>Your plan will remain active until <span className="font-bold text-slate-700">{activePlan.subscription?.endDate ? new Date(activePlan.subscription.endDate).toLocaleDateString() : 'N/A'}</span>.</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePlan(null)} // Click to design another plan
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition shadow-md"
                >
                  Create New custom Plan
                </button>
                <button
                  onClick={() => navigate('/provider/profile')}
                  className="px-6 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Builder Plan View
  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/provider/plans')}
              className="flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-800 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Plan
            </button>
            <span className="text-slate-300">/</span>
            <button
              onClick={() => navigate('/provider/profile')}
              className="text-sm font-bold text-slate-500 hover:text-slate-700 transition"
            >
              Back to Profile
            </button>
          </div>
          
          <div className="bg-violet-50 text-violet-700 font-semibold px-4 py-2 rounded-full border border-violet-100 text-xs flex items-center gap-2 shadow-sm w-fit">
            <Gift className="w-4 h-4 text-violet-600" />
            <span>Your one skill for one pin code is <span className="underline">FREE!</span></span>
          </div>
        </div>

        {isRedirected && (
          <div className="mb-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Plan Activated Successfully!</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Your new provider plan is now active. You can now go to your profile, or customize your visibility further below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => navigate('/provider/profile')}
                className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/10"
              >
                Back to Profile
              </button>
              <button
                onClick={() => {
                  // Clean up URL query parameters
                  navigate('/provider/custom-plan', { replace: true });
                }}
                className="flex-1 md:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
              >
                Customise Plan
              </button>
            </div>
          </div>
        )}

        {/* Title Block */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customise Your Plan</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Create a personalised visibility plan by choosing skills, locations and duration as per your goals.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Configurator Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Choose Achievements */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4">Choose What You Want to Achieve</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Achievement Card 1: Multiple Skills */}
                <button
                  type="button"
                  onClick={() => setSelectedAchievements(s => ({ ...s, multipleSkills: !s.multipleSkills }))}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${
                    selectedAchievements.multipleSkills
                      ? 'border-violet-600 bg-violet-50/20 ring-2 ring-violet-600/10'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {selectedAchievements.multipleSkills && (
                    <div className="absolute top-3 right-3 bg-violet-600 text-white rounded-full p-0.5">
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-violet-600" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 mb-3">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Multiple Skills</h3>
                  <p className="text-slate-400 text-xs mt-1">Showcase multiple skills in your profile</p>
                </button>

                {/* Achievement Card 2: Top in Locality */}
                <button
                  type="button"
                  onClick={() => setSelectedAchievements(s => ({ ...s, locality: !s.locality }))}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${
                    selectedAchievements.locality
                      ? 'border-pink-500 bg-pink-50/10 ring-2 ring-pink-500/10'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {selectedAchievements.locality && (
                    <div className="absolute top-3 right-3 bg-pink-500 text-white rounded-full p-0.5">
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-pink-500" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-3">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Top in Locality</h3>
                  <p className="text-slate-400 text-xs mt-1">Be a top choice in selected locality(ies)</p>
                </button>

                {/* Achievement Card 3: Top in City */}
                <button
                  type="button"
                  onClick={() => setSelectedAchievements(s => ({ ...s, city: !s.city }))}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${
                    selectedAchievements.city
                      ? 'border-blue-500 bg-blue-50/10 ring-2 ring-blue-500/10'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {selectedAchievements.city && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-0.5">
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-blue-500" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Top in City</h3>
                  <p className="text-slate-400 text-xs mt-1">Rank on top across selected city(ies)</p>
                </button>

                {/* Achievement Card 4: Top in Country */}
                <button
                  type="button"
                  onClick={() => setSelectedAchievements(s => ({ ...s, country: !s.country }))}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${
                    selectedAchievements.country
                      ? 'border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/10'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {selectedAchievements.country && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-0.5">
                      <CheckCircle className="w-3.5 h-3.5 fill-white text-emerald-500" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-500 mb-3">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Top in Country</h3>
                  <p className="text-slate-400 text-xs mt-1">Max visibility across selected country(ies)</p>
                </button>

              </div>
            </div>

            {/* Config Sections */}
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800">Build Your Smart Visibility Plan</h2>
                <span className="bg-violet-50 text-violet-600 border border-violet-100 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Smart Filters
                </span>
              </div>

              {/* Section 01: Locality Boost */}
              {selectedAchievements.locality && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  
                  {/* Skill Search Selection Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-violet-600 text-white font-bold text-xs rounded-full flex items-center justify-center shadow-md">01</div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">Top in One Locality</h3>
                        <p className="text-xs text-slate-400">Be visible at the top in selected localities.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                        Search Skill with AI
                      </span>
                      <div className="w-full sm:w-64">
                        <SearchSelect
                          options={ALL_SKILLS}
                          selected={localitySkill}
                          onChange={(s) => setLocalitySkill(s)}
                          placeholder="Search skill (e.g. Graphic Design)"
                          icon={Search}
                        />
                      </div>
                    </div>
                  </div>

                  {localitySkill ? (
                    <div>
                      {/* Selected Skill Pill */}
                      <div className="mb-4 inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full">
                        <span>{getInitials(localitySkill)}</span>
                        <span>{localitySkill}</span>
                        <button type="button" onClick={() => setLocalitySkill('')} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Locality Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              <th className="py-3 px-4">Locality</th>
                              <th className="py-3 px-4">Duration</th>
                              <th className="py-3 px-4">Price</th>
                              <th className="py-3 px-4 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {localityItems.map(item => (
                              <tr key={item.id} className="text-sm">
                                <td className="py-3 px-4">
                                  <select
                                    value={item.locality}
                                    onChange={(e) => handleLocalityItemChange(item.id, 'locality', e.target.value)}
                                    className="w-full bg-transparent font-medium text-slate-700 outline-none"
                                  >
                                    {LOCALITIES_LIST.map(loc => (
                                      <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={item.durationMonths}
                                    onChange={(e) => handleLocalityItemChange(item.id, 'durationMonths', e.target.value)}
                                    className="bg-transparent font-medium text-slate-700 outline-none"
                                  >
                                    {LOCALITY_DURATIONS.map(d => (
                                      <option key={d.months} value={d.months}>{d.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">
                                  ₹{item.price}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLocality(item.id)}
                                    className="text-slate-300 hover:text-red-500 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <button
                          type="button"
                          onClick={handleAddLocality}
                          className="flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another Locality
                        </button>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400">Skill Total </span>
                          <span className="font-extrabold text-violet-700 text-lg">₹{localityTotal}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      Please select a skill to configure Locality Boosts.
                    </div>
                  )}

                </div>
              )}

              {/* Section 02: City Boost */}
              {selectedAchievements.city && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  
                  {/* Skill Search Selection Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-violet-600 text-white font-bold text-xs rounded-full flex items-center justify-center shadow-md">02</div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">Top in City</h3>
                        <p className="text-xs text-slate-400">Be visible at the top in selected cities.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                        Search Skill with AI
                      </span>
                      <div className="w-full sm:w-64">
                        <SearchSelect
                          options={ALL_SKILLS}
                          selected={citySkill}
                          onChange={(s) => setCitySkill(s)}
                          placeholder="Search skill (e.g. Video Editing)"
                          icon={Search}
                        />
                      </div>
                    </div>
                  </div>

                  {citySkill ? (
                    <div>
                      {/* Selected Skill Pill */}
                      <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                        <span>{getInitials(citySkill)}</span>
                        <span>{citySkill}</span>
                        <button type="button" onClick={() => setCitySkill('')} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* City Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              <th className="py-3 px-4">City</th>
                              <th className="py-3 px-4">Duration</th>
                              <th className="py-3 px-4">Price</th>
                              <th className="py-3 px-4 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {cityItems.map(item => (
                              <tr key={item.id} className="text-sm">
                                <td className="py-3 px-4">
                                  <select
                                    value={item.city}
                                    onChange={(e) => handleCityItemChange(item.id, 'city', e.target.value)}
                                    className="w-full bg-transparent font-medium text-slate-700 outline-none"
                                  >
                                    {CITIES_LIST.map(city => (
                                      <option key={city} value={city}>{city}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={item.isTrial ? '1_trial' : item.durationMonths}
                                    onChange={(e) => handleCityItemChange(item.id, 'durationMonths', e.target.value)}
                                    className="bg-transparent font-medium text-slate-700 outline-none"
                                  >
                                    <option value="1_trial">1 Month (Trial) - ₹250</option>
                                    <option value="1">1 Month - ₹350</option>
                                    <option value="3">3 Months - ₹900</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">
                                  ₹{item.price}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCity(item.id)}
                                    className="text-slate-300 hover:text-red-500 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <button
                          type="button"
                          onClick={handleAddCity}
                          className="flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another City
                        </button>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400">Skill Total </span>
                          <span className="font-extrabold text-violet-700 text-lg">₹{cityTotal}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      Please select a skill to configure City Boosts.
                    </div>
                  )}

                </div>
              )}

              {/* Section 03: Country Boost */}
              {selectedAchievements.country && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  
                  {/* Skill Search Selection Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-violet-600 text-white font-bold text-xs rounded-full flex items-center justify-center shadow-md">03</div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">Top in Country</h3>
                        <p className="text-xs text-slate-400">Be visible at the top in selected countries.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                        Search Skill with AI
                      </span>
                      <div className="w-full sm:w-64">
                        <SearchSelect
                          options={ALL_SKILLS}
                          selected={countrySkill}
                          onChange={(s) => setCountrySkill(s)}
                          placeholder="Search skill (e.g. UI/UX Design)"
                          icon={Search}
                        />
                      </div>
                    </div>
                  </div>

                  {countrySkill ? (
                    <div>
                      {/* Selected Skill Pill */}
                      <div className="mb-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                        <span>{getInitials(countrySkill)}</span>
                        <span>{countrySkill}</span>
                        <button type="button" onClick={() => setCountrySkill('')} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Country Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              <th className="py-3 px-4">Country</th>
                              <th className="py-3 px-4">Duration</th>
                              <th className="py-3 px-4">Price</th>
                              <th className="py-3 px-4 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {countryItems.map(item => (
                              <tr key={item.id} className="text-sm">
                                <td className="py-3 px-4">
                                  <select
                                    value={item.country}
                                    onChange={(e) => handleCountryItemChange(item.id, 'country', e.target.value)}
                                    className="w-full bg-transparent font-medium text-slate-700 outline-none"
                                  >
                                    {COUNTRIES_LIST.map(country => (
                                      <option key={country} value={country}>{country}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={item.durationMonths}
                                    onChange={(e) => handleCountryItemChange(item.id, 'durationMonths', e.target.value)}
                                    className="bg-transparent font-medium text-slate-700 outline-none"
                                  >
                                    {COUNTRY_DURATIONS.map(d => (
                                      <option key={d.months} value={d.months}>{d.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-800">
                                  ₹{item.price}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCountry(item.id)}
                                    className="text-slate-300 hover:text-red-500 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <button
                          type="button"
                          onClick={handleAddCountry}
                          className="flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another Country
                        </button>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400">Skill Total </span>
                          <span className="font-extrabold text-violet-700 text-lg">₹{countryTotal}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      Please select a skill to configure Country Boosts.
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Add Another Skill Button */}
            <button
              type="button"
              onClick={() => toast.success('You can configure combinations dynamically above. Add skills or items inside Locality, City, or Country sections.')}
              className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 rounded-3xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 bg-white"
            >
              <Plus className="w-4 h-4" /> Add Another Skill / Combination
            </button>

            {/* AI Smart Tip Bar */}
            <div className="bg-violet-50 border border-violet-100 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-violet-600 text-white rounded-full p-2.5 shadow-md flex-shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-xs text-violet-800 block">AI Smart Tip</span>
                  <span className="text-xs text-slate-500">Adding 4+ months for primary locations with 1 month for others gives you 15% better visibility.</span>
                </div>
              </div>
              <button 
                onClick={() => toast.success('Smart plans bundle multiple locales and categories to provide maximum rotation exposure.')}
                className="text-xs font-extrabold text-violet-700 hover:text-violet-900 transition flex-shrink-0"
              >
                View Details →
              </button>
            </div>

          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            
            {/* Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-600" />
                  Your Plan Summary
                </h2>
                <button
                  onClick={handleClearAll}
                  className="text-xs font-extrabold text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1 mb-6">
                
                {/* Locality items list in summary */}
                {selectedAchievements.locality && localitySkill && localityItems.length > 0 && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExpandedSummary(e => ({ ...e, locality: !e.locality }))}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 text-left font-bold text-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-lg flex items-center justify-center font-bold">GD</span>
                        <span>{localitySkill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">₹{localityTotal}</span>
                        {expandedSummary.locality ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    {expandedSummary.locality && (
                      <div className="p-3 bg-white space-y-2 text-xs divide-y divide-slate-50">
                        {localityItems.map(item => (
                          <div key={item.id} className="pt-2 flex justify-between items-start gap-4">
                            <div>
                              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-pink-500" /> {item.locality}
                              </div>
                              <span className="text-[10px] text-slate-400 ml-4.5">{item.durationMonths} Months</span>
                            </div>
                            <span className="font-bold text-slate-600">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* City items list in summary */}
                {selectedAchievements.city && citySkill && cityItems.length > 0 && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExpandedSummary(e => ({ ...e, city: !e.city }))}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 text-left font-bold text-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center font-bold">VE</span>
                        <span>{citySkill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">₹{cityTotal}</span>
                        {expandedSummary.city ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    {expandedSummary.city && (
                      <div className="p-3 bg-white space-y-2 text-xs divide-y divide-slate-50">
                        {cityItems.map(item => (
                          <div key={item.id} className="pt-2 flex justify-between items-start gap-4">
                            <div>
                              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-blue-500" /> {item.city}
                              </div>
                              <span className="text-[10px] text-slate-400 ml-4.5">
                                {item.isTrial ? '1 Month (Trial)' : `${item.durationMonths} Month${item.durationMonths > 1 ? 's' : ''}`}
                              </span>
                            </div>
                            <span className="font-bold text-slate-600">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Country items list in summary */}
                {selectedAchievements.country && countrySkill && countryItems.length > 0 && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setExpandedSummary(e => ({ ...e, country: !e.country }))}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 text-left font-bold text-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-lg flex items-center justify-center font-bold">UI</span>
                        <span>{countrySkill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">₹{countryTotal}</span>
                        {expandedSummary.country ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    {expandedSummary.country && (
                      <div className="p-3 bg-white space-y-2 text-xs divide-y divide-slate-50">
                        {countryItems.map(item => (
                          <div key={item.id} className="pt-2 flex justify-between items-start gap-4">
                            <div>
                              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-emerald-500" /> {item.country}
                              </div>
                              <span className="text-[10px] text-slate-400 ml-4.5">{item.durationMonths} Months</span>
                            </div>
                            <span className="font-bold text-slate-600">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {subtotal === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Your summary is currently empty. Start by configuring visibility boosts.
                  </div>
                )}

              </div>

              {/* Dynamic Calculations */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 text-sm">
                
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-700">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    GST (18%) 
                    <button type="button" onClick={() => toast.info('Goods and Services Tax of 18% is applicable on digital advertising visibility services.')} className="text-slate-400 hover:text-slate-600">
                      ⓘ
                    </button>
                  </span>
                  <span className="font-bold text-slate-700">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-end pt-3 border-t border-slate-50">
                  <span className="font-black text-slate-800">Total Amount</span>
                  <span className="font-black text-violet-700 text-2xl">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>

              </div>

              {/* Smart Plan Promo Ticket Banner */}
              {subtotal > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 mt-6">
                  <div className="bg-emerald-600 text-white rounded-full p-1.5 shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-50 bg-emerald-600 rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800">
                    You Save <span className="underline">₹{savings.toLocaleString('en-IN')}</span> with this smart plan
                  </span>
                </div>
              )}

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={checkoutLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-violet-200 mt-6 flex items-center justify-center gap-2 text-base"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-slate-300" /> Secure & Safe Payments
              </div>

            </div>

            {/* Bottom mini-footer inside right panel */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 text-xs font-bold text-slate-500">
              
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-violet-600 mt-0.5" />
                <div>
                  <h4 className="text-slate-700 text-xs font-extrabold">Secure Payments</h4>
                  <p className="text-[10px] font-normal text-slate-400">100% safe & secure transaction</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-slate-700 text-xs font-extrabold">Instant Activation</h4>
                  <p className="text-[10px] font-normal text-slate-400">Boosts apply automatically</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-violet-600 mt-0.5" />
                <div>
                  <h4 className="text-slate-700 text-xs font-extrabold">Cancel Anytime</h4>
                  <p className="text-[10px] font-normal text-slate-400">Refund within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-violet-600 mt-0.5" />
                <div>
                  <h4 className="text-slate-700 text-xs font-extrabold">Best Price Guarantee</h4>
                  <p className="text-[10px] font-normal text-slate-400">Get maximum rotation value</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomPlan;
