import { useState, useEffect } from 'react';
import { adminWithdrawalAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  HiCog, HiCurrencyRupee, HiCheck, HiShieldCheck, HiOutlineSparkles, 
  HiInformationCircle, HiPlusCircle, HiArrowRight, HiTrendingUp,
  HiX, HiClock, HiChevronDown, HiChevronUp, HiExclamation
} from 'react-icons/hi';
import useTranslation from '../../hooks/useTranslation';

const AdminCommissionSettings = () => {
  const { t } = useTranslation();
  
  // Active Rule state loaded from API
  const [activeRule, setActiveRule] = useState(null);

  // Form states
  const [platformCommissionPercentage, setPlatformCommissionPercentage] = useState(30);
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [referralCommissionType, setReferralCommissionType] = useState('percentage');
  const [referralCommissionValue, setReferralCommissionValue] = useState(0);
  const [referralMaxCap, setReferralMaxCap] = useState(0);
  
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [cashbackType, setCashbackType] = useState('percentage');
  const [cashbackValue, setCashbackValue] = useState(0);
  const [cashbackMaxCap, setCashbackMaxCap] = useState(0);
  const [cashbackMinTransactionAmount, setCashbackMinTransactionAmount] = useState(0);

  const [minPayoutThreshold, setMinPayoutThreshold] = useState(500);
  const [fixedWithdrawalFee, setFixedWithdrawalFee] = useState(0);

  // Operational states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  // Visualizer interactive state
  const [visualizerAmount, setVisualizerAmount] = useState(1000);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await adminWithdrawalAPI.getCommissionSettings();
      
      const rule = data.activeRule || {};
      setActiveRule(rule);

      setPlatformCommissionPercentage(rule.platformCommissionPercentage ?? 30);
      setReferralEnabled(rule.referralEnabled ?? false);
      setReferralCommissionType(rule.referralCommissionType ?? 'percentage');
      setReferralCommissionValue(rule.referralCommissionValue ?? 0);
      setReferralMaxCap(rule.referralMaxCap ?? 0);

      setCashbackEnabled(rule.cashbackEnabled ?? false);
      setCashbackType(rule.cashbackType ?? 'percentage');
      setCashbackValue(rule.cashbackValue ?? 0);
      setCashbackMaxCap(rule.cashbackMaxCap ?? 0);
      setCashbackMinTransactionAmount(rule.cashbackMinTransactionAmount ?? 0);

      setMinPayoutThreshold(rule.minPayoutThreshold ?? (data.minWithdrawalAmount ?? 500));
      setFixedWithdrawalFee(rule.fixedWithdrawalFee ?? (data.fixedWithdrawalFee ?? 0));

      // Fetch history in background
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.settingsLoadFail', 'Failed to load commission settings'));
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await adminWithdrawalAPI.getBillingRuleHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);
      const payload = {
        platformCommissionPercentage: Number(platformCommissionPercentage),
        referralEnabled,
        referralCommissionType,
        referralCommissionValue: Number(referralCommissionValue),
        referralMaxCap: Number(referralMaxCap),
        cashbackEnabled,
        cashbackType,
        cashbackValue: Number(cashbackValue),
        cashbackMaxCap: Number(cashbackMaxCap),
        cashbackMinTransactionAmount: Number(cashbackMinTransactionAmount),
        minPayoutThreshold: Number(minPayoutThreshold),
        fixedWithdrawalFee: Number(fixedWithdrawalFee),
        changeReason
      };

      await adminWithdrawalAPI.updateCommissionSettings(payload);
      toast.success(t('admin.settingsSaveSuccess', 'Commission & billing rules updated successfully!'));
      
      setShowConfirmModal(false);
      setChangeReason('');
      fetchSettings();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.settingsSaveFail', 'Failed to save commission settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Live simulation variables for visualizer
  const simAmount = Number(visualizerAmount) || 0;
  const simPlatformCut = Math.round((simAmount * (Number(platformCommissionPercentage || 0) / 100)) * 100) / 100;
  const simProviderShare = Math.round((simAmount - simPlatformCut) * 100) / 100;

  // Calculate simulated referral cut
  let simReferralCut = 0;
  if (referralEnabled) {
    if (referralCommissionType === 'percentage') {
      simReferralCut = Math.round((simAmount * (Number(referralCommissionValue || 0) / 100)) * 100) / 100;
    } else {
      simReferralCut = Number(referralCommissionValue || 0);
    }
    const refCap = Number(referralMaxCap || 0);
    if (refCap > 0 && simReferralCut > refCap) {
      simReferralCut = refCap;
    }
  }

  // Calculate simulated cashback cut
  let simCashbackCut = 0;
  const minTx = Number(cashbackMinTransactionAmount || 0);
  if (cashbackEnabled && simAmount >= minTx) {
    if (cashbackType === 'percentage') {
      simCashbackCut = Math.round((simAmount * (Number(cashbackValue || 0) / 100)) * 100) / 100;
    } else {
      simCashbackCut = Number(cashbackValue || 0);
    }
    const cbCap = Number(cashbackMaxCap || 0);
    if (cbCap > 0 && simCashbackCut > cbCap) {
      simCashbackCut = cbCap;
    }
  }

  const simNetPlatformRev = Math.round((simPlatformCut - simReferralCut - simCashbackCut) * 100) / 100;
  const isNetNegative = simNetPlatformRev < 0;

  // Progress segments width
  const totalSimUsed = simProviderShare + Math.max(0, simNetPlatformRev) + simReferralCut + simCashbackCut;
  const scale = totalSimUsed > simAmount ? simAmount / totalSimUsed : 1;

  const pctProvider = ((simProviderShare * scale) / simAmount) * 100;
  const pctNetRev = simNetPlatformRev > 0 ? (((simNetPlatformRev * scale) / simAmount) * 100) : 0;
  const pctReferral = ((simReferralCut * scale) / simAmount) * 100;
  const pctCashback = ((simCashbackCut * scale) / simAmount) * 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            {t('admin.settingsBadge', 'Versioned Rules System')}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t('admin.settingsTitle', 'Platform Billing & Commission Rules')}
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl text-sm md:text-base">
            Configure commission cuts, independent cashback programs, and referral incentives. All changes create a version snapshot for audit safety.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Settings Form */}
        <form onSubmit={handleOpenConfirm} className="md:col-span-2 space-y-6">
          
          {/* Section 1: Platform Commission */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><HiCog className="w-5 h-5" /></span>
              <h2 className="text-lg font-bold text-slate-900">{t('admin.commissionSection', 'Platform Commission')}</h2>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Platform Commission Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  required
                  value={platformCommissionPercentage}
                  onChange={e => setPlatformCommissionPercentage(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                  placeholder="e.g. 30"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 font-bold">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                The percentage cut taken by the platform from recruiter & provider plan purchases.
              </p>
            </div>
          </div>

          {/* Section 2: Referral Commission */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><HiPlusCircle className="w-5 h-5" /></span>
                <h2 className="text-lg font-bold text-slate-900">{t('admin.referralSection', 'Referral Commission')}</h2>
              </div>
              <button
                type="button"
                onClick={() => setReferralEnabled(!referralEnabled)}
                className={`${
                  referralEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden`}
              >
                <span
                  className={`${
                    referralEnabled ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>

            {referralEnabled ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Commission Type</label>
                    <select
                      value={referralCommissionType}
                      onChange={e => setReferralCommissionType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Commission Value</label>
                    <div className="relative">
                      {referralCommissionType === 'fixed' && (
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                      )}
                      <input
                        type="number"
                        min={0}
                        required
                        value={referralCommissionValue}
                        onChange={e => setReferralCommissionValue(e.target.value)}
                        className={`w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition ${
                          referralCommissionType === 'fixed' ? 'pl-8 pr-4' : 'pl-4 pr-10'
                        }`}
                        placeholder="e.g. 40"
                      />
                      {referralCommissionType === 'percentage' && (
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 font-bold">%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Max Referral Cap (0 = No Cap)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={referralMaxCap}
                      onChange={e => setReferralMaxCap(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                      placeholder="e.g. 1000"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Maximum commission reward payout per transaction.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium">Referral program is currently disabled.</p>
              </div>
            )}
          </div>

          {/* Section 3: Cashback Reward */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><HiOutlineSparkles className="w-5 h-5" /></span>
                <h2 className="text-lg font-bold text-slate-900">{t('admin.cashbackSection', 'Cashback Rewards')}</h2>
              </div>
              <button
                type="button"
                onClick={() => setCashbackEnabled(!cashbackEnabled)}
                className={`${
                  cashbackEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden`}
              >
                <span
                  className={`${
                    cashbackEnabled ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>

            {cashbackEnabled ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cashback Type</label>
                    <select
                      value={cashbackType}
                      onChange={e => setCashbackType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cashback Value</label>
                    <div className="relative">
                      {cashbackType === 'fixed' && (
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                      )}
                      <input
                        type="number"
                        min={0}
                        required
                        value={cashbackValue}
                        onChange={e => setCashbackValue(e.target.value)}
                        className={`w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition ${
                          cashbackType === 'fixed' ? 'pl-8 pr-4' : 'pl-4 pr-10'
                        }`}
                        placeholder="e.g. 5"
                      />
                      {cashbackType === 'percentage' && (
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 font-bold">%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Max Cashback Cap</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={cashbackMaxCap}
                        onChange={e => setCashbackMaxCap(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                        placeholder="0 = no cap"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Min Purchase Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={cashbackMinTransactionAmount}
                        onChange={e => setCashbackMinTransactionAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                        placeholder="0 = any transaction"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium">Cashback program is currently disabled.</p>
              </div>
            )}
          </div>

          {/* Section 4: Withdrawal Rules */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600"><HiShieldCheck className="w-5 h-5" /></span>
              <h2 className="text-lg font-bold text-slate-900">{t('admin.withdrawalSection', 'Withdrawal & Payout Thresholds')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Min Payout Threshold</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={minPayoutThreshold}
                    onChange={e => setMinPayoutThreshold(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fixed Withdrawal Fee</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={fixedWithdrawalFee}
                    onChange={e => setFixedWithdrawalFee(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Verify changes on split visualizer first.</span>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-sm transition-all"
            >
              Update Billing Rules
            </button>
          </div>
        </form>

        {/* Earning Split Visualizer Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg relative overflow-hidden sticky top-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent"></div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-indigo-400">
              <HiTrendingUp className="w-5 h-5 text-indigo-400" />
              {t('admin.visualizerHeader', 'Billing Split Visualizer')}
            </h3>
            <p className="text-xs text-slate-400 mb-6">Interactive simulation on a gross transaction amount.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Simulation Gross Payment</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    value={visualizerAmount}
                    onChange={e => setVisualizerAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Gross checkout payment</span>
                  <span className="font-bold text-slate-200">₹{simAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400 font-bold">
                  <span>Provider Share ({100 - platformCommissionPercentage}%)</span>
                  <span>+₹{simProviderShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-400 font-semibold">
                  <span>Gross Platform Cut ({platformCommissionPercentage}%)</span>
                  <span>+₹{simPlatformCut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-500 font-semibold">
                  <span>Referral Cut</span>
                  <span>{referralEnabled ? `-₹${simReferralCut.toFixed(2)}` : 'OFF'}</span>
                </div>
                <div className="flex justify-between text-xs text-purple-400 font-semibold">
                  <span>Cashback Reward</span>
                  <span>{cashbackEnabled ? `-₹${simCashbackCut.toFixed(2)}` : 'OFF'}</span>
                </div>
                
                <div className={`border-t border-white/10 pt-2.5 flex justify-between text-xs font-extrabold ${
                  isNetNegative ? 'text-rose-500 animate-pulse' : 'text-indigo-400'
                }`}>
                  <span>Net Platform Revenue</span>
                  <span>₹{simNetPlatformRev.toFixed(2)}</span>
                </div>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Provider share</span>
                  <span>Rule impacts</span>
                </div>
                
                {isNetNegative ? (
                  <div className="w-full bg-rose-600 rounded-full h-3 flex overflow-hidden border border-rose-500 animate-pulse-glow" title="WARNING: Platform net revenue is negative!">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pctProvider}%` }}></div>
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${pctReferral}%` }}></div>
                    <div className="bg-purple-500 h-full transition-all" style={{ width: `${pctCashback}%` }}></div>
                  </div>
                ) : (
                  <div className="w-full bg-slate-800 rounded-full h-3 flex overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pctProvider}%` }}></div>
                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${pctNetRev}%` }}></div>
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${pctReferral}%` }}></div>
                    <div className="bg-purple-500 h-full transition-all" style={{ width: `${pctCashback}%` }}></div>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] font-bold text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Provider Share</span>
                  {!isNetNegative && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span> Net Revenue</span>}
                  {referralEnabled && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Referral</span>}
                  {cashbackEnabled && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Cashback</span>}
                </div>
              </div>

              {isNetNegative && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-2 text-[10px] text-rose-300">
                  <HiExclamation className="w-4 h-4 shrink-0" />
                  <p>Warning: Incentives (Referral + Cashback) exceed gross platform cut! The platform will lose net money on this transaction.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History panel */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex justify-between items-center p-6 border-b border-slate-100 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-50 text-slate-600"><HiClock className="w-5 h-5" /></span>
            <h2 className="text-lg font-bold text-slate-900">Billing Rule Version History</h2>
          </div>
          {isHistoryOpen ? <HiChevronUp className="w-5 h-5 text-slate-500" /> : <HiChevronDown className="w-5 h-5 text-slate-500" />}
        </button>

        {isHistoryOpen && (
          <div className="p-6 overflow-x-auto animate-fade-in">
            {history.length > 0 ? (
              <table className="min-w-full text-xs font-semibold text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-left">
                    <th className="pb-3 px-2">Ver</th>
                    <th className="pb-3 px-2">Comm %</th>
                    <th className="pb-3 px-2">Referrals</th>
                    <th className="pb-3 px-2">Cashbacks</th>
                    <th className="pb-3 px-2">Withdrawals</th>
                    <th className="pb-3 px-2">Updated By</th>
                    <th className="pb-3 px-2">Effective Date</th>
                    <th className="pb-3 px-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((ruleItem) => (
                    <tr key={ruleItem._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-2 font-bold text-slate-900">v{ruleItem.version}</td>
                      <td className="py-4 px-2 text-slate-900">{ruleItem.platformCommissionPercentage}%</td>
                      <td className="py-4 px-2">
                        {ruleItem.referralEnabled ? (
                          <span className="text-amber-600 font-bold">
                            {ruleItem.referralCommissionType === 'percentage' ? `${ruleItem.referralCommissionValue}%` : `₹${ruleItem.referralCommissionValue}`}
                            {ruleItem.referralMaxCap > 0 && ` (Cap ₹${ruleItem.referralMaxCap})`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">OFF</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        {ruleItem.cashbackEnabled ? (
                          <span className="text-purple-600 font-bold">
                            {ruleItem.cashbackType === 'percentage' ? `${ruleItem.cashbackValue}%` : `₹${ruleItem.cashbackValue}`}
                            {ruleItem.cashbackMaxCap > 0 && ` (Cap ₹${ruleItem.cashbackMaxCap})`}
                            {ruleItem.cashbackMinTransactionAmount > 0 && ` (Min ₹${ruleItem.cashbackMinTransactionAmount})`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">OFF</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-slate-500">
                        Min ₹{ruleItem.minPayoutThreshold} · Fee ₹{ruleItem.fixedWithdrawalFee}
                      </td>
                      <td className="py-4 px-2 text-slate-500">
                        {ruleItem.updatedBy ? (
                          <div>
                            <p className="font-bold text-slate-800">{ruleItem.updatedBy.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{ruleItem.updatedBy.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-slate-500 whitespace-nowrap">
                        {new Date(ruleItem.effectiveFrom || ruleItem.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-2 text-slate-500 max-w-xs truncate" title={ruleItem.changeReason}>
                        {ruleItem.changeReason || <span className="text-slate-400 italic">No reason provided</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No billing rule history records found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <HiShieldCheck className="w-5 h-5 text-indigo-600" />
                Confirm Billing Rule Changes
              </h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
              <p className="text-xs text-slate-500">
                You are changing the active platform billing configurations. These configurations apply immediately to all future plan purchases, renewal transactions, and payouts. Existing records are untouched.
              </p>

              {/* Side-by-Side Diff Visualizer */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Current Setting</h4>
                  <ul className="space-y-1.5 text-slate-700">
                    <li>Platform Comm: <span className="font-bold text-slate-900">{activeRule?.platformCommissionPercentage ?? 30}%</span></li>
                    <li>Referrals: <span className="font-bold text-slate-900">{activeRule?.referralEnabled ? 'Enabled' : 'Disabled'}</span></li>
                    {activeRule?.referralEnabled && (
                      <li className="pl-2 border-l border-slate-200 text-slate-500">
                        {activeRule.referralCommissionType === 'percentage' ? `${activeRule.referralCommissionValue}%` : `₹${activeRule.referralCommissionValue}`} (Cap: ₹{activeRule.referralMaxCap || 'None'})
                      </li>
                    )}
                    <li>Cashback: <span className="font-bold text-slate-900">{activeRule?.cashbackEnabled ? 'Enabled' : 'Disabled'}</span></li>
                    {activeRule?.cashbackEnabled && (
                      <li className="pl-2 border-l border-slate-200 text-slate-500">
                        {activeRule.cashbackType === 'percentage' ? `${activeRule.cashbackValue}%` : `₹${activeRule.cashbackValue}`} (Cap: ₹{activeRule.cashbackMaxCap || 'None'})
                      </li>
                    )}
                    <li>Payout Min: <span className="font-bold text-slate-900">₹{activeRule?.minPayoutThreshold ?? 500}</span></li>
                    <li>Withdraw Fee: <span className="font-bold text-slate-900">₹{activeRule?.fixedWithdrawalFee ?? 0}</span></li>
                  </ul>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <h4 className="text-[10px] uppercase font-bold text-indigo-400 mb-2">New Proposed Setting</h4>
                  <ul className="space-y-1.5 text-slate-700">
                    <li>Platform Comm: <span className="font-bold text-indigo-700">{platformCommissionPercentage}%</span></li>
                    <li>Referrals: <span className="font-bold text-indigo-700">{referralEnabled ? 'Enabled' : 'Disabled'}</span></li>
                    {referralEnabled && (
                      <li className="pl-2 border-l border-indigo-200 text-slate-500">
                        {referralCommissionType === 'percentage' ? `${referralCommissionValue}%` : `₹${referralCommissionValue}`} (Cap: ₹{referralMaxCap || 'None'})
                      </li>
                    )}
                    <li>Cashback: <span className="font-bold text-indigo-700">{cashbackEnabled ? 'Enabled' : 'Disabled'}</span></li>
                    {cashbackEnabled && (
                      <li className="pl-2 border-l border-indigo-200 text-slate-500">
                        {cashbackType === 'percentage' ? `${cashbackValue}%` : `₹${cashbackValue}`} (Cap: ₹{cashbackMaxCap || 'None'})
                      </li>
                    )}
                    <li>Payout Min: <span className="font-bold text-indigo-700">₹{minPayoutThreshold}</span></li>
                    <li>Withdraw Fee: <span className="font-bold text-indigo-700">₹{fixedWithdrawalFee}</span></li>
                  </ul>
                </div>
              </div>

              {isNetNegative && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-2 text-[10px] text-rose-700 font-bold">
                  <HiExclamation className="w-4 h-4 shrink-0 text-rose-500" />
                  <p>Caution: The proposed settings result in negative net platform revenue. Platform losses will be incurred.</p>
                </div>
              )}

              {/* Reason input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Change Reason (Optional)</label>
                <textarea
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  placeholder="e.g. Separate cashback rules added, adjusting platform shares."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommissionSettings;
