import { useState, useEffect } from 'react';
import { HiSearch, HiCheckCircle, HiXCircle, HiEye, HiTrash } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => { fetchProviders(); }, [statusFilter]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = { search };
      if (statusFilter === 'approved') params.approved = true;
      else if (statusFilter === 'pending' || statusFilter === 'rejected') params.approved = false;
      const { data } = await adminAPI.getProviders(params);
      setProviders(data.providers || []);
    } catch (err) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProviders();
  };

  const getUserIdForApproval = (item) => {
    if (item?.user?._id) return item.user._id;
    if (typeof item?.user === 'string') return item.user;
    return null;
  };

  const handleApprove = async (provider, approve) => {
    const userId = getUserIdForApproval(provider);

    if (!userId) {
      console.log('Provider approval item:', provider);
      toast.error('User ID missing. Cannot approve this provider.');
      return;
    }

    try {
      if (approve) {
        await adminAPI.approveUser(userId);
        toast.success('User approved for all eligible panels');
      } else {
        await adminAPI.rejectUser(userId, 'Rejected by admin');
        toast.success('User rejected');
      }

      fetchProviders();
      setSelectedProvider(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete provider "${name}"?\n\nThis will permanently delete:\n... Provider profile\n... All leads\n... All reviews\n... User account\n... Rotation pool entries\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteProvider(id);
      toast.success('Provider deleted successfully');
      fetchProviders();
      setSelectedProvider(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete provider');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Provider Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search provider name, skill, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">Search</button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Provider List */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-16 flex justify-center"><LoadingSpinner /></div>
            ) : providers.length === 0 ? (
              <div className="p-16 text-center text-gray-500">No providers found</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {providers.map((p) => (
                  <div key={p._id} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer ${selectedProvider?._id === p._id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedProvider(p)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(p.user?.name || p.headline || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{p.skills?.join(', ') || 'No skills'} · {p.city || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{p.isApproved ? 'Approved' : 'Pending'}</span>
                      <HiEye className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedProvider && (
          <div className="w-96 bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-24">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-linear-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                {(selectedProvider.user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{selectedProvider.user?.name}</h3>
              <p className="text-sm text-gray-500">{selectedProvider.headline || 'No headline'}</p>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between"><span className="text-gray-500">City</span><span className="font-medium">{selectedProvider.city || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-medium">{selectedProvider.experience || 0} yrs</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-medium">? {selectedProvider.rating || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Profile</span><span className="font-medium">{selectedProvider.profileCompletion || 0}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium">{selectedProvider.currentPlan?.name || 'Free'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Verified</span>
                <span className={`font-medium ${selectedProvider.isVerified ? 'text-green-600' : 'text-gray-400'}`}>
                  {selectedProvider.isVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Reviewed By</span>
                <span className="font-medium">{selectedProvider.approvedBy?.name || 'Not reviewed'}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Decision</span>
                <span className="font-medium capitalize">{selectedProvider.approvalAction || (selectedProvider.isApproved ? 'approved' : 'pending')}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Reviewed At</span>
                <span className="font-medium">{selectedProvider.approvedAt ? new Date(selectedProvider.approvedAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Skills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProvider.skills?.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                {!selectedProvider.isApproved && (
                  <button
                    onClick={() => handleApprove(selectedProvider, true)}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                  >
                    <HiCheckCircle className="w-5 h-5" /> Approve
                  </button>
                )}
                <button
                  onClick={() => handleApprove(selectedProvider, false)}
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition font-medium"
                >
                  <HiXCircle className="w-5 h-5" /> Reject
                </button>
              </div>
              <button
                onClick={() => handleDelete(selectedProvider._id, selectedProvider.user?.name || 'this provider')}
                className="w-full flex items-center justify-center gap-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
              >
                <HiTrash className="w-5 h-5" /> Delete Provider
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProviders;
