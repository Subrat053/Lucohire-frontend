import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiSearch, HiCheckCircle, HiXCircle, HiEye, HiTrash } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminRecruiters = () => {
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);

  useEffect(() => { fetchRecruiters(); }, [statusFilter]);

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const params = { search };
      if (statusFilter === 'approved') params.approved = true;
      else if (statusFilter === 'pending' || statusFilter === 'rejected') params.approved = false;
      const { data } = await adminAPI.getRecruiters(params);
      setRecruiters(data.recruiters || []);
    } catch (err) {
      const status = err?.response?.status;

      // Fallback: if recruiter profile route is unavailable, show recruiter users at least.
      if (status === 404) {
        try {
          const fallbackParams = {
            role: 'recruiter',
            page: 1,
            limit: 200,
            search,
          };
          const { data } = await adminAPI.getUsers(fallbackParams);
          const mapped = (data?.users || []).map((u) => ({
            _id: u._id,
            user: {
              _id: u._id,
              name: u.name,
              email: u.email,
              phone: u.phone,
            },
            companyName: 'N/A',
            companyType: 'N/A',
            city: 'N/A',
            state: 'N/A',
            currentPlan: 'N/A',
            isApproved: true,
            isFallbackUser: true,
          }));
          setRecruiters(mapped);
          toast('Loaded recruiter users via fallback source');
          return;
        } catch (_) {
          // Continue to generic handling below
        }
      }

      if (status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      if (status === 403) {
        toast.error('Admin access required to view recruiters.');
        navigate('/', { replace: true });
        return;
      }

      console.error('fetchRecruiters error:', err);
      toast.error(err?.response?.data?.message || 'Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecruiters();
  };

  // console.log("SELECTED RECRUITER:", recruiter);
  // console.log("recruiter._id:", recruiter?._id);
  // console.log("recruiter.user:", recruiter?.user);
  // console.log("recruiter.user._id:", recruiter?.user?._id);

  const getUserIdForApproval = (item) => {
    if (item?.user && typeof item.user === "object" && item.user._id) {
      return item.user._id;
    }

    if (item?.user && typeof item.user === "string") {
      return item.user;
    }

    // Only use item._id if this is fallback user data, not profile data
    if (item?.isFallbackUser && item?._id) {
      return item._id;
    }

    return null;
  };

  const handleApprove = async (recruiter, approve) => {
    const userId = getUserIdForApproval(recruiter);

    console.log("APPROVAL PAYLOAD:", {
      itemId: recruiter?._id,
      user: recruiter?.user,
      finalUserId: userId,
    });

    if (!userId) {
      toast.error("User ID missing. Cannot approve.");
      return;
    }

    try {
      if (approve) {
        await adminAPI.approveUser(userId);
        toast.success("User approved for both panels");
      } else {
        await adminAPI.rejectUser(userId, "Rejected by admin");
        toast.success("User rejected");
      }

      fetchRecruiters();
      setSelectedRecruiter(null);
    } catch (err) {
      console.error("Approval error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete recruiter "${name}"?\n\nThis will permanently delete:\n- Recruiter profile\n- Job posts\n- Leads\n- Reviews\n- User account\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteRecruiter(id);
      toast.success('Recruiter deleted successfully');
      fetchRecruiters();
      setSelectedRecruiter(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete recruiter');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Recruiter Management</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recruiter, company, city..."
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
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-16 flex justify-center"><LoadingSpinner /></div>
            ) : recruiters.length === 0 ? (
              <div className="p-16 text-center text-gray-500">No recruiters found</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recruiters.map((r) => (
                  <div key={r._id} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer ${selectedRecruiter?._id === r._id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedRecruiter(r)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(r.user?.name || r.companyName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{r.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{r.companyName || 'Individual'} · {r.city || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${r.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{r.isApproved ? 'Approved' : 'Pending'}</span>
                      <HiEye className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedRecruiter && (
          <div className="w-96 bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-24">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                {(selectedRecruiter.user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{selectedRecruiter.user?.name}</h3>
              <p className="text-sm text-gray-500">{selectedRecruiter.companyName || 'Individual recruiter'}</p>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Company</span><span className="font-medium">{selectedRecruiter.companyName || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium capitalize">{selectedRecruiter.companyType || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">City</span><span className="font-medium">{selectedRecruiter.city || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">State</span><span className="font-medium">{selectedRecruiter.state || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium">{selectedRecruiter.currentPlan || 'free'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Approved</span>
                <span className={`font-medium ${selectedRecruiter.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                  {selectedRecruiter.isApproved ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Reviewed By</span><span className="font-medium">{selectedRecruiter.approvedBy?.name || 'Not reviewed'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Decision</span><span className="font-medium capitalize">{selectedRecruiter.approvalAction || (selectedRecruiter.isApproved ? 'approved' : 'pending')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reviewed At</span><span className="font-medium">{selectedRecruiter.approvedAt ? new Date(selectedRecruiter.approvedAt).toLocaleString() : 'N/A'}</span></div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                {!selectedRecruiter.isApproved && (
                  <button
                    disabled={selectedRecruiter.isFallbackUser}
                    onClick={() => handleApprove(selectedRecruiter, true)}
                    className={`flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition font-medium ${selectedRecruiter.isFallbackUser
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    <HiCheckCircle className="w-5 h-5" /> Approve
                  </button>
                )}
                <button
                  disabled={selectedRecruiter.isFallbackUser}
                  onClick={() => handleApprove(selectedRecruiter, false)}
                  className={`flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition font-medium ${selectedRecruiter.isFallbackUser
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                >
                  <HiXCircle className="w-5 h-5" /> Reject
                </button>
              </div>
              <button
                disabled={selectedRecruiter.isFallbackUser}
                onClick={() => handleDelete(selectedRecruiter._id, selectedRecruiter.user?.name || 'this recruiter')}
                className={`w-full flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl transition font-medium ${selectedRecruiter.isFallbackUser
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
              >
                <HiTrash className="w-5 h-5" /> Delete Recruiter
              </button>
              {selectedRecruiter.isFallbackUser && (
                <p className="text-xs text-gray-500">
                  Fallback data view: approve/delete actions require recruiter profile route.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRecruiters;
