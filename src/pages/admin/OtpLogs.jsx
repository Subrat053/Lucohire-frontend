/**
 * OtpLogs.jsx
 * Admin page: paginated OTP audit log.
 */

import { useState, useEffect, useCallback } from 'react';
import { ADMIN_API } from '../../services/api';
import { ShieldCheck, Phone, Mail, AlertTriangle, Search, RefreshCw, Loader2 } from 'lucide-react';



const CHANNEL_BADGE = {
  phone: { icon: <Phone className="w-3.5 h-3.5" />, cls: 'bg-blue-50 text-blue-700' },
  email: { icon: <Mail className="w-3.5 h-3.5" />, cls: 'bg-purple-50 text-purple-700' },
};

const STATUS_BADGE = {
  verified: 'bg-green-50 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  blocked: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
};

export default function OtpLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ status: '', channel: '' });
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit, search, ...filter });
      const res = await ADMIN_API.get(`/admin/logs/otp?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load OTP logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

  const getStatus = (log) => {
    if (log.verifiedAt) return 'verified';
    if (log.blockedUntil && new Date() < new Date(log.blockedUntil)) return 'blocked';
    if (new Date() > new Date(log.expiresAt)) return 'expired';
    return 'pending';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> OTP Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} records</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Search by purpose or target..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filter.channel}
          onChange={e => setFilter(f => ({ ...f, channel: e.target.value }))}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="">All Channels</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="expired">Expired</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No OTP log records found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'Purpose', 'Channel', 'Target (masked)', 'Status', 'Attempts', 'Verified At', 'Created'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const status = getStatus(log);
                  const ch = CHANNEL_BADGE[log.channel] || { cls: 'bg-gray-100 text-gray-500', icon: null };
                  return (
                    <tr key={log._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{log.userId?.name || '—'}</div>
                        <div className="text-xs text-gray-400">{log.userId?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize">{log.purpose?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ch.cls}`}>
                          {ch.icon} {log.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.target}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-500'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={log.attempts >= 3 ? 'text-red-600 font-semibold' : 'text-gray-600'}>{log.attempts}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.verifiedAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
