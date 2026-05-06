import { useState, useEffect } from 'react';
import { HiSearch, HiFilter } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      // Need to make sure this is added to api.js as adminAPI.getAllReferrals
      const res = await adminAPI.getAllReferrals();
      setReferrals(res.data?.referrals || []);
    } catch (error) {
      toast.error('Failed to fetch referrals');
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter(r => 
    (r.referredUser?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.referredUser?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.partner?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Referrals</h1>
        <p className="text-sm text-gray-500 mt-1">Track all referred users across the platform</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by referred user or partner..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none">
              <option value="">All Roles</option>
              <option value="provider">Providers</option>
              <option value="recruiter">Recruiters</option>
            </select>
            <button className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              <HiFilter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4 text-left">Referred User</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Referred By (Partner)</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Rewards Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReferrals.length > 0 ? (
                  filteredReferrals.map((ref) => (
                    <tr key={ref._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{ref.referredUser?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{ref.referredUser?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                          ref.referredRole === 'provider' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {ref.referredRole || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{ref.partner?.name || 'Unknown'}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                            {ref.referralCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ref.rewardEligible ? (
                          <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Eligible
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No referrals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReferrals;
