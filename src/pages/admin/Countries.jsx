import { useState, useEffect } from 'react';
import { HiPlus, HiPencil, HiTrash, HiX, HiCheck } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const emptyCountry = {
  countryCode: '',
  countryName: '',
  currency: '',
  currencySymbol: '',
  defaultTaxName: 'GST',
  defaultTaxPercent: 0,
  isActive: true,
};

const AdminCountries = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [form, setForm] = useState({ ...emptyCountry });
  const [deleteModal, setDeleteModal] = useState({ open: false, countryId: null, countryName: '' });

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data } = await adminAPI.getCountries();
      setCountries(data?.countries || []);
    } catch (err) {
      toast.error('Failed to load country configurations');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCountry(null);
    setForm({ ...emptyCountry });
    setShowForm(true);
  };

  const openEdit = (country) => {
    setEditingCountry(country);
    setForm({
      countryCode: country.countryCode || '',
      countryName: country.countryName || '',
      currency: country.currency || '',
      currencySymbol: country.currencySymbol || '',
      defaultTaxName: country.defaultTaxName || 'GST',
      defaultTaxPercent: country.defaultTaxPercent || 0,
      isActive: country.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.countryCode || form.countryCode.trim().length !== 2) {
      toast.error('Country Code must be a 2-letter code (e.g. IN, AE, US)');
      return;
    }

    if (Number(form.defaultTaxPercent) < 0) {
      toast.error('Tax percentage cannot be negative');
      return;
    }

    const payload = {
      ...form,
      countryCode: form.countryCode.toUpperCase().trim(),
      countryName: form.countryName.trim(),
      currency: form.currency.toUpperCase().trim(),
      currencySymbol: form.currencySymbol.trim(),
      defaultTaxPercent: Number(form.defaultTaxPercent),
    };

    try {
      if (editingCountry) {
        await adminAPI.updateCountryConfig(editingCountry._id, payload);
        toast.success('Country configuration updated');
      } else {
        await adminAPI.createCountryConfig(payload);
        toast.success('Country configuration created');
      }
      setShowForm(false);
      fetchCountries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const handleDeleteClick = (country) => {
    setDeleteModal({
      open: true,
      countryId: country._id,
      countryName: country.countryName,
    });
  };

  const confirmDelete = async () => {
    const { countryId } = deleteModal;
    if (!countryId) return;
    try {
      await adminAPI.deleteCountryConfig(countryId);
      toast.success('Country configuration deleted');
      fetchCountries();
    } catch (err) {
      toast.error('Failed to delete country configuration');
    } finally {
      setDeleteModal({ open: false, countryId: null, countryName: '' });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Country Master Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Configure default currencies and tax guidelines for country pricing tiers.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <HiPlus className="w-5 h-5" /> Add Country
        </button>
      </div>

      {/* Country Config List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {countries.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No countries configured yet. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Country Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Country Code</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Default Tax Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Default Tax %</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {countries.map((country) => (
                  <tr key={country._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{country.countryName}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">{country.countryCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {country.currency} ({country.currencySymbol})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{country.defaultTaxName || 'GST'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{country.defaultTaxPercent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          country.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {country.isActive ? <HiCheck className="w-3.5 h-3.5" /> : null}
                        {country.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(country)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Edit"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(country)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Delete"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingCountry ? 'Edit Country Config' : 'Add Country Config'}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Country Name</label>
                <input
                  required
                  value={form.countryName}
                  onChange={(e) => setForm((f) => ({ ...f, countryName: e.target.value }))}
                  placeholder="e.g. India"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Country Code (2 Letters)</label>
                  <input
                    required
                    maxLength={2}
                    value={form.countryCode}
                    onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. IN"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency Code</label>
                  <input
                    required
                    maxLength={3}
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    placeholder="e.g. INR"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency Symbol</label>
                  <input
                    required
                    value={form.currencySymbol}
                    onChange={(e) => setForm((f) => ({ ...f, currencySymbol: e.target.value }))}
                    placeholder="e.g. ₹"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Default Tax Name</label>
                  <input
                    required
                    value={form.defaultTaxName}
                    onChange={(e) => setForm((f) => ({ ...f, defaultTaxName: e.target.value }))}
                    placeholder="e.g. GST"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Default Tax Percent (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.defaultTaxPercent}
                  onChange={(e) => setForm((f) => ({ ...f, defaultTaxPercent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Active Status</span>
              </label>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm shadow-md"
                >
                  {editingCountry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Country Config</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete the configuration for <strong className="text-gray-800">"{deleteModal.countryName}"</strong>? This will remove default parameters for this country in future plan pricing creations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, countryId: null, countryName: '' })}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCountries;
