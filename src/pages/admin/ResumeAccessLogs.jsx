/**
 * ResumeAccessLogs.jsx
 * Admin page: R2 Resume Access Log audit trails.
 */

import { useState, useEffect, useCallback } from 'react';
import { ADMIN_API } from '../../services/api';
import { FileText, RefreshCw, Loader2, AlertTriangle, Search, Clock, Globe } from 'lucide-react';

export default function ResumeAccessLogs() {
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
      const res = await ADMIN_API.get(`/admin/logs/resume-access?${params}`);
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
            <FileText className="w-6 h-6 text-indigo-600" /> R2 Resume Access Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Total downloads / views logged: {total}</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Search by recruiter or candidate name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

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
        <div className="text-center py-16 text-gray-400">No resume access records found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Recruiter', 'Candidate', 'R2 File Key', 'Accessed At', 'Temporary Link Expiry', 'IP Address', 'User Agent'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.recruiterId?.name || '—'}</div>
                      <div className="text-xs text-gray-450">{log.recruiterId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.candidateId?.name || '—'}</div>
                      <div className="text-xs text-gray-450">{log.candidateId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono max-w-[180px] truncate" title={log.resumeObjectKey}>
                      {log.resumeObjectKey || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isExpired(log) ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {isExpired(log) ? 'Expired' : 'Active (15m)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap flex items-center gap-1.5 py-4">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
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
