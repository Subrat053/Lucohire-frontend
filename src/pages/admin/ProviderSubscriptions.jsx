import { useEffect, useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

const ProviderSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getProviderSubscriptions({ page, limit });
      setSubscriptions(data.subscriptions || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load provider subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await adminAPI.updateProviderSubscriptionStatus(id, { status });
      toast.success('Subscription updated');
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to update subscription');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Provider Subscriptions</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Provider</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Payment Status</th>
                <th className="text-left px-4 py-3">Subscription Status</th>
                <th className="text-left px-4 py-3">Start Date</th>
                <th className="text-left px-4 py-3">End Date</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-500" colSpan="9">No subscriptions found</td>
                </tr>
              ) : (
                subscriptions.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.providerId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{item.providerId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">{item.planSnapshot?.name || item.planId?.name || 'Plan'}</td>
                    <td className="px-4 py-3">{item.durationMonths} Month(s)</td>
                    <td className="px-4 py-3">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{item.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.subscriptionStatus === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : item.subscriptionStatus === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}>{item.subscriptionStatus}</span>
                    </td>
                    <td className="px-4 py-3">{formatDate(item.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(item.endDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(item._id, 'active')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(item._id, 'cancelled')}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-50"
        >
          <HiChevronLeft />
        </button>
        <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-50"
        >
          <HiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default ProviderSubscriptions;
