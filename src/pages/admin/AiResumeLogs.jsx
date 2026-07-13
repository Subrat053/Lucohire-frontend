/**
 * AiResumeLogs.jsx
 * Admin page: AI resume parsing audit log.
 */

import { useState, useEffect, useCallback } from 'react';
import { ADMIN_API } from '../../services/api';
import { Sparkles, RefreshCw, Loader2, AlertTriangle, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  completed: { cls: 'bg-green-50 text-green-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { cls: 'bg-red-50 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  processing: { cls: 'bg-indigo-50 text-indigo-700', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  pending: { cls: 'bg-gray-100 text-gray-500', icon: <Clock className="w-3.5 h-3.5" /> },
};

export default function AiResumeLogs() {
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
      const res = await ADMIN_API.get(`/admin/logs/ai-resume?${params}`);
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
  const formatConf = (c) => c != null ? `${Math.round(c * 100)}%` : '—';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" /> AI Resume Parse Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} records</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Search by provider name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No AI resume parse records found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Provider', 'Status', 'AI Provider', 'Confidence', 'Parsed Skills', 'Error', 'Parsed At'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const status = log.resumeParsing?.status || 'pending';
                  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                  const skills = log.parsedResumeData?.skills || log.parsedResumeData?.specialities || [];
                  return (
                    <tr key={log._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{log.user?.name || '—'}</div>
                        <div className="text-xs text-gray-400">{log.user?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                          {sc.icon} {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{log.resumeParsing?.provider || '—'}</td>
                      <td className="px-4 py-3">
                        {log.resumeParsing?.confidenceScore != null && (
                          <span className={`font-semibold ${log.resumeParsing.confidenceScore >= 0.7 ? 'text-green-600' : 'text-amber-600'}`}>
                            {formatConf(log.resumeParsing.confidenceScore)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{s}</span>
                          ))}
                          {skills.length > 3 && <span className="text-xs text-gray-400">+{skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate" title={log.resumeParsing?.errorMessage}>
                        {log.resumeParsing?.errorMessage || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(log.resumeParsing?.parsedAt)}</td>
                    </tr>
                  );
                })}
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
