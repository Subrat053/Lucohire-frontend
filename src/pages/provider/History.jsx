import { useState, useEffect } from 'react';
import { HiEye, HiSearch, HiLockOpen, HiClock } from 'react-icons/hi';
import { providerAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const typeConfig = {
  profile_view: { label: 'Profile View', icon: HiEye, color: 'bg-blue-100 text-blue-600' },
  search: { label: 'Search Appearance', icon: HiSearch, color: 'bg-amber-100 text-amber-600' },
  contact_unlock: { label: 'Contact Unlocked', icon: HiLockOpen, color: 'bg-green-100 text-green-600' },
  job_match: { label: 'Job Match', icon: HiClock, color: 'bg-purple-100 text-purple-600' },
};

const ProviderHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await providerAPI.getHistory();
      setHistory(Array.isArray(data) ? data : data.history || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter ? history.filter(h => h.type === filter) : history;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Activity</option>
          <option value="profile_view">Profile Views</option>
          <option value="contact_unlock">Contact Unlocks</option>
          <option value="search">Search Appearances</option>
          <option value="job_match">Job Matches</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <HiClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No activity yet</p>
          <p className="text-gray-400 text-sm mt-1">Your profile views and contact unlocks will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {filtered.map((item, i) => {
            const cfg = typeConfig[item.type] || typeConfig.profile_view;
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {cfg.label}
                    {item.user?.name && <span className="text-gray-500 font-normal"> by {item.user.name}</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.searchSkill && <span> &middot; Skill: {item.searchSkill}</span>}
                    {item.searchCity && <span> &middot; City: {item.searchCity}</span>}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderHistory;
