import { useState, useEffect } from 'react';
import { HiSearch, HiBan, HiCheckCircle, HiChevronLeft, HiChevronRight, HiTrash, HiEye, HiX } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toAbsoluteMediaUrl } from '../../utils/media';
import toast from 'react-hot-toast';

const UserDetailModal = ({ userId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      adminAPI.getUserDetail(userId).then(({ data }) => setDetail(data)).catch(() => toast.error('Failed to load user details')).finally(() => setLoading(false));
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><HiX className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : !detail ? (
          <div className="p-12 text-center text-gray-500">User not found</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center shrink-0">
                {detail.profile?.photo ? (
                  <img src={toAbsoluteMediaUrl(detail.profile.photo)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">{detail.user?.name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{detail.user?.name}</h3>
                <p className="text-sm text-gray-500">{detail.user?.email} {detail.user?.phone && `· ${detail.user.phone}`}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detail.user?.role === 'provider' ? 'bg-green-100 text-green-700' : detail.user?.role === 'recruiter' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{detail.user?.role}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detail.user?.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{detail.user?.isBlocked ? 'Blocked' : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Account</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Joined:</span> <span className="font-medium">{new Date(detail.user?.createdAt).toLocaleDateString()}</span></div>
                <div><span className="text-gray-500">WhatsApp:</span> <span className="font-medium">{detail.user?.whatsappNumber || 'N/A'}</span></div>
                <div><span className="text-gray-500">Country:</span> <span className="font-medium">{detail.user?.country || 'N/A'}</span></div>
                <div><span className="text-gray-500">Expires:</span> <span className="font-medium">{detail.user?.accountExpiresAt ? new Date(detail.user.accountExpiresAt).toLocaleDateString() : 'N/A'}</span></div>
              </div>
            </div>

            {/* Profile Info */}
            {detail.profile && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Profile</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">City:</span> <span className="font-medium">{detail.profile.city || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Plan:</span> <span className="font-medium capitalize">{detail.profile.currentPlan || 'Free'}</span></div>
                  {detail.profile.skills && <div className="col-span-2"><span className="text-gray-500">Skills:</span> <span className="font-medium">{detail.profile.skills.join(', ')}</span></div>}
                  {detail.profile.companyName && <div><span className="text-gray-500">Company:</span> <span className="font-medium">{detail.profile.companyName}</span></div>}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {detail.history?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {detail.history.slice(0, 10).map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded-lg">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.type === 'contact_unlock' ? 'bg-green-100 text-green-700' : h.type === 'profile_view' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {h.type?.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {detail.payments?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Payments</h4>
                <div className="space-y-2">
                  {detail.payments.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium">{p.planName || 'Plan'}</span>
                      <span className="text-gray-500">₹{p.amount}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const limit = 15;

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getUsers({ page, limit, search, role: roleFilter });
      setUsers(data.users || []);
      setTotal(data.pagination?.total || data.total || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleBlock = async (userId, isBlocked) => {
    try {
      await adminAPI.toggleBlockUser(userId);
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete "${userName}"?\n\nThis will permanently delete:\n... User account\n... Profile data\n... All associated leads\n... Job posts (if recruiter)\n... Reviews\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
            Search
          </button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="provider">Providers</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-gray-500">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Email / Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{user.email || user.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'provider' ? 'bg-green-100 text-green-700' :
                          user.role === 'recruiter' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{user.role}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>{user.isBlocked ? 'Blocked' : 'Active'}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUserId(user._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            <HiEye className="w-4 h-4" /> View
                          </button>
                          {user.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => toggleBlock(user._id, user.isBlocked)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                  user.isBlocked
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {user.isBlocked ? <HiCheckCircle className="w-4 h-4" /> : <HiBan className="w-4 h-4" />}
                                {user.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                onClick={() => handleDelete(user._id, user.name)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition"
                                title="Delete user permanently"
                              >
                                <HiTrash className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                    <HiChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                    <HiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
};

export default AdminUsers;
