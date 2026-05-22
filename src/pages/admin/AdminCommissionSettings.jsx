import { useState, useEffect } from 'react';
import { adminWithdrawalAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  HiCog, HiCurrencyRupee, HiCheck, HiShieldCheck, HiOutlineSparkles, 
  HiInformationCircle, HiPlusCircle, HiArrowRight, HiTrendingUp 
} from 'react-icons/hi';
import useTranslation from '../../hooks/useTranslation';

const AdminCommissionSettings = () => {
  const { t } = useTranslation();
  
  const [platformCommissionPercentage, setPlatformCommissionPercentage] = useState(10);
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(500);
  const [fixedWithdrawalFee, setFixedWithdrawalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await adminWithdrawalAPI.getCommissionSettings();
      setPlatformCommissionPercentage(data.platformCommissionPercentage ?? 10);
      setMinWithdrawalAmount(data.minWithdrawalAmount ?? 500);
      setFixedWithdrawalFee(data.fixedWithdrawalFee ?? 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.settingsLoadFail', 'Failed to load commission settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        platformCommissionPercentage: Number(platformCommissionPercentage),
        minWithdrawalAmount: Number(minWithdrawalAmount),
        fixedWithdrawalFee: Number(fixedWithdrawalFee)
      };

      await adminWithdrawalAPI.updateCommissionSettings(payload);
      toast.success(t('admin.settingsSaveSuccess', 'Commission & withdrawal rules updated successfully!'));
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

  // Live simulation variables for split visualization
  const sampleAmount = 1000;
  const simulatedCommission = Math.max(0, Math.round((sampleAmount * (platformCommissionPercentage / 100)) * 100) / 100);
  const simulatedProviderShare = Math.max(0, Math.round((sampleAmount - simulatedCommission) * 100) / 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            {t('admin.settingsBadge', 'Platform Fee Config')}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('admin.settingsTitle', 'Commission & Payout Settings')}</h1>
          <p className="text-slate-400 mt-2 max-w-lg text-sm md:text-base">
            {t('admin.settingsSubtitle', 'Configure platform commission sharing cuts, minimum payouts, and fixed processing fees for providers.')}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><HiCog className="w-5 h-5" /></span>
            {t('admin.formHeader', 'Modify Billing Rules')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t('admin.commissionLabel', 'Platform Commission Percentage')}</label>
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
                  placeholder="e.g. 10"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 font-bold">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{t('admin.commissionDesc', 'The percentage share deducted from booking checkouts for the platform pool.')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t('admin.minWithdrawalLabel', 'Min Payout Threshold')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={minWithdrawalAmount}
                    onChange={e => setMinWithdrawalAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-indigo-500 transition"
                    placeholder="e.g. 500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">{t('admin.minWithdrawalDesc', 'Minimum wallet balance needed to request a withdrawal.')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t('admin.fixedFeeLabel', 'Fixed Withdrawal Fee')}</label>
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
                <p className="text-[10px] text-slate-400 mt-1.5">{t('admin.fixedFeeDesc', 'Flat fee charged on every payout submission.')}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? t('common.saving', 'Saving configurations...') : t('admin.btnSaveSettings', 'Update Billing System Rules')}
                <HiCheck className="w-4 h-4 text-indigo-200" />
              </button>
            </div>
          </form>
        </div>

        {/* Earning Split Visualizer Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent"></div>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-indigo-400">
              <HiTrendingUp className="w-5 h-5 text-indigo-400" />
              {t('admin.visualizerHeader', 'Split Visualizer')}
            </h3>
            <p className="text-xs text-slate-400 mb-6">{t('admin.visualizerDesc', 'Dynamic simulation demonstrating current splits on a ₹1,000 transaction.')}</p>

            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t('admin.splitClientPays', 'Client booking payment')}</span>
                  <span className="font-bold text-slate-200">₹{sampleAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-rose-400 font-semibold">
                  <span>{t('admin.splitPlatformCut', 'Platform cut')} ({platformCommissionPercentage}%)</span>
                  <span>-₹{simulatedCommission.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-xs text-emerald-400 font-bold">
                  <span>{t('admin.splitProviderEarning', 'Credited to Provider Wallet')}</span>
                  <span>+₹{simulatedProviderShare.toFixed(2)}</span>
                </div>
              </div>

              {/* Progress bar visual representation */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>{t('admin.providerSharePercent', 'Provider Share')} ({100 - platformCommissionPercentage}%)</span>
                  <span>{t('admin.platformSharePercent', 'Platform')} ({platformCommissionPercentage}%)</span>
                </div>
                <div className="w-full bg-rose-600 rounded-full h-3 flex overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${100 - platformCommissionPercentage}%` }}></div>
                  <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${platformCommissionPercentage}%` }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 text-[10px] text-slate-400 flex gap-2">
                <HiInformationCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <p className="leading-relaxed">
                  {t('admin.splitInstruction', 'Commission ledger credits and platform pool deductions occur inside an isolated database session block immediately upon recruiters finalizing booking payouts.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommissionSettings;
