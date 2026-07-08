import { useState, useEffect } from 'react';
import { HiSave, HiCurrencyDollar } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminCurrency = () => {
  const [settings, setSettings] = useState({ defaultCurrency: 'INR', enableAED: true, enableUSD: true, exchangeRateINRtoAED: 0.044, exchangeRateINRtoUSD: 0.012 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await adminAPI.getCurrencySettings();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch {
      // settings may not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateCurrencySettings(settings);
      toast.success('Currency settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <HiCurrencyDollar className="w-7 h-7 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900">Currency & Localization</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Currency Settings</h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
            <select value={settings.defaultCurrency} onChange={(e) => setSettings(s => ({ ...s, defaultCurrency: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400">
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
              <option value="USD">USD ($) - US Dollar</option>
            </select>
          </div>
        </div>

        <h3 className="font-semibold text-gray-800 mb-3">Enabled Currencies</h3>
        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked disabled className="w-4 h-4 rounded border-gray-300 text-amber-500" />
            <span className="text-sm text-gray-700">INR (₹) — Always enabled</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.enableAED} onChange={(e) => setSettings(s => ({ ...s, enableAED: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
            <span className="text-sm text-gray-700">AED (د.إ)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.enableUSD} onChange={(e) => setSettings(s => ({ ...s, enableUSD: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
            <span className="text-sm text-gray-700">USD ($)</span>
          </label>
        </div>

        <h3 className="font-semibold text-gray-800 mb-3">Exchange Rates (from INR)</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">1 INR = ? AED</label>
            <input type="number" step="0.0001" value={settings.exchangeRateINRtoAED}
              onChange={(e) => setSettings(s => ({ ...s, exchangeRateINRtoAED: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">1 INR = ? USD</label>
            <input type="number" step="0.0001" value={settings.exchangeRateINRtoUSD}
              onChange={(e) => setSettings(s => ({ ...s, exchangeRateINRtoUSD: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Plan prices in AED and USD are set individually on the Plans page.
            These exchange rates are used for reference display and auto-calculation fallbacks.
          </p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition text-sm font-medium disabled:opacity-50">
          <HiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Currency Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminCurrency;
