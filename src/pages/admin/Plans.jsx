import { useState, useEffect } from 'react';
import { HiPlus, HiPencil, HiTrash, HiX, HiCheck } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useLocale } from '../../context/LocaleContext';

const emptyPlan = { name: '', slug: '', type: 'provider', price: '', duration: 30, features: [''], maxSkills: 10, boostWeight: 1, unlockCredits: 0, isActive: true };
const PLAN_TIERS = [
  { label: 'Free', slug: 'free' },
  { label: 'Starter', slug: 'starter' },
  { label: 'Business', slug: 'business' },
  { label: 'Enterprise', slug: 'enterprise' },
  { label: 'Basic (Legacy)', slug: 'basic' },
  { label: 'Pro (Legacy)', slug: 'pro' },
  { label: 'Featured (Legacy)', slug: 'featured' },
];
const DURATION_OPTIONS = [
  { label: 'Monthly', value: 30 },
  { label: '3 Monthly', value: 90 },
  { label: 'Semi Annually', value: 180 },
  { label: 'Annually', value: 365 },
];
const DURATION_LABEL_BY_VALUE = Object.fromEntries(DURATION_OPTIONS.map((opt) => [opt.value, opt.label]));
const TIER_ORDER = { free: 0, starter: 1, business: 2, enterprise: 3 };

const AdminPlans = () => {
  const { formatPrice } = useLocale();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({ ...emptyPlan });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await adminAPI.getPlans();
      setPlans(Array.isArray(data) ? data : data.plans || []);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingPlan(null); setForm({ ...emptyPlan }); setShowForm(true); };
  const openEdit = (plan) => {
    const isPaidTier = ['starter', 'business', 'enterprise'].includes(plan.slug);
    const target = isPaidTier && Number(plan.duration) !== 30
      ? (plans.find((p) => p.type === plan.type && p.slug === plan.slug && Number(p.duration) === 30) || plan)
      : plan;

    setEditingPlan(target);
    setForm({
      name: target.name || '',
      slug: target.slug || '',
      type: target.type || 'provider',
      price: target.price || '',
      duration: target.duration || 30,
      features: target.features?.length ? [...target.features] : [''],
      maxSkills: target.maxSkills || 10,
      boostWeight: target.boostWeight || 1,
      unlockCredits: target.unlockCredits || 0,
      isActive: target.isActive !== false,
    });
    setShowForm(true);
  };

  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, ''] }));
  const removeFeature = (i) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  const updateFeature = (i, val) => setForm(f => ({ ...f, features: f.features.map((v, idx) => idx === i ? val : v) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!PLAN_TIERS.some((tier) => tier.slug === form.slug)) {
      toast.error('Select a valid plan tier');
      return;
    }
    if (!DURATION_OPTIONS.some((opt) => opt.value === Number(form.duration))) {
      toast.error('Duration must be Monthly, 3 Monthly, Semi Annually, or Annually');
      return;
    }

    const isPaidTier = ['starter', 'business', 'enterprise', 'basic', 'pro', 'featured'].includes(form.slug);
    const isMonthly = Number(form.duration) === 30;

    if (isPaidTier && Number(form.price) <= 0) {
      toast.error('Paid plan price must be greater than 0');
      return;
    }

    if (isPaidTier && !isMonthly) {
      toast.error('Set monthly price only. Other billing categories auto-calculate from discounts.');
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      features: form.features.filter(f => f.trim()),
      slug: form.slug,
    };
    try {
      if (editingPlan) {
        await adminAPI.updatePlan(editingPlan._id, payload);
        toast.success('Plan updated');
      } else {
        await adminAPI.createPlan(payload);
        toast.success('Plan created');
      }
      setShowForm(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await adminAPI.deletePlan(id);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const providerPlans = plans.filter(p => p.type === 'provider');
  const recruiterPlans = plans.filter(p => p.type === 'recruiter');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
          <HiPlus className="w-5 h-5" /> New Plan
        </button>
      </div>

      {/* Plan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><HiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value="provider">Provider</option>
                    <option value="recruiter">Recruiter</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Base)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    disabled={['starter', 'business', 'enterprise'].includes(form.slug) && Number(form.duration) !== 30}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  {['starter', 'business', 'enterprise'].includes(form.slug) && Number(form.duration) !== 30 && (
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated from monthly base price using configured discounts.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Category</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                    disabled={['starter', 'business', 'enterprise'].includes(form.slug)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                    {DURATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Tier</label>
                <select
                  value={form.slug}
                  onChange={e => {
                    const tier = PLAN_TIERS.find((item) => item.slug === e.target.value);
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value,
                      duration: ['starter', 'business', 'enterprise'].includes(e.target.value) ? 30 : f.duration,
                      name: tier ? tier.label : f.name,
                    }));
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select plan tier</option>
                  {PLAN_TIERS.map((tier) => (
                    <option key={tier.slug} value={tier.slug}>{tier.label}</option>
                  ))}
                </select>
              </div>
              {form.type === 'provider' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Skills</label>
                    <input type="number" min="1" value={form.maxSkills} onChange={e => setForm(f => ({ ...f, maxSkills: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Boost Weight</label>
                    <input type="number" min="1" value={form.boostWeight} onChange={e => setForm(f => ({ ...f, boostWeight: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
              {form.type === 'recruiter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unlock Credits</label>
                  <input type="number" min="0" value={form.unlockCredits} onChange={e => setForm(f => ({ ...f, unlockCredits: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                {form.features.map((f, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={f} onChange={e => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                    {form.features.length > 1 && (
                      <button type="button" onClick={() => removeFeature(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><HiTrash className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addFeature} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Feature</button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
                  {editingPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans Display */}
      {[{ title: 'Provider Plans', list: providerPlans }, { title: 'Recruiter Plans', list: recruiterPlans }].map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h2>
          {section.list.length === 0 ? (
            <p className="text-gray-500">No plans yet</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.list
                .slice()
                .sort((a, b) => {
                  const byDuration = Number(a.duration || 0) - Number(b.duration || 0);
                  if (byDuration !== 0) return byDuration;
                  return (TIER_ORDER[a.slug] || 99) - (TIER_ORDER[b.slug] || 99);
                })
                .map((plan) => (
                <div key={plan._id} className={`bg-white rounded-2xl border-2 p-5 relative ${plan.isActive ? 'border-gray-100' : 'border-red-200 opacity-60'}`}>
                  {!plan.isActive && <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Inactive</span>}
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{formatPrice(plan.price, plan.priceAED, plan.priceUSD)}<span className="text-sm text-gray-400 font-normal">/{DURATION_LABEL_BY_VALUE[plan.duration] || `${plan.duration}d`}</span></p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <HiCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => openEdit(plan)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-sm font-medium">
                      <HiPencil className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => handleDelete(plan._id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition text-sm font-medium">
                      <HiTrash className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPlans;
