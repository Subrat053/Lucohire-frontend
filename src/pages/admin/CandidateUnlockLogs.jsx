/**
 * CandidateUnlockLogs.jsx
 * Admin page: candidate profile unlock audit log.
 */

import { useState, useEffect, useCallback } from 'react';
import { ADMIN_API } from '../../services/api';
import { Lock, RefreshCw, Loader2, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';


export default function CandidateUnlockLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, search });
      const res = await ADMIN_API.get(`/admin/logs/candidate-unlocks?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search]);

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

  const isExpired = (log) => log.expiresAt && new Date() > new Date(log.expiresAt);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-600" /> Candidate Unlock Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} unlocks</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="Search by recruiter or provider name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No unlock records found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Recruiter', 'Provider', 'Purpose', 'OTP Verified', 'Plan', 'Unlocked At', 'Expires', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log._id} className={`hover:bg-gray-50 transition ${isExpired(log) ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.recruiterId?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{log.recruiterId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.providerId?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{log.providerId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{log.purpose?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-center">
                      {log.otpVerified
                        ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.planId?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.unlockedAt)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={isExpired(log) ? 'text-red-400' : 'text-gray-500'}>
                        {formatDate(log.expiresAt)}
                        {isExpired(log) && <span className="ml-1 text-red-400">(expired)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">Previous</button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
