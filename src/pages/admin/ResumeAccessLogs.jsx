/**
 * ResumeAccessLogs.jsx
 * Admin page: R2 Resume Access Log audit trails with date filters & link status filters.
 */

import { useState, useEffect, useCallback } from 'react';
import { ADMIN_API } from '../../services/api';
import {
  FileText, RefreshCw, Loader2, AlertTriangle, Search,
  Clock, Globe, Calendar, Filter, X
} from 'lucide-react';

export default function ResumeAccessLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  // Filters State
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search,
        status: statusFilter,
        dateRange,
        ...(dateRange === 'custom' && startDate ? { startDate } : {}),
        ...(dateRange === 'custom' && endDate ? { endDate } : {}),
      });

      const res = await ADMIN_API.get(`/admin/logs/resume-access?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resume access logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, dateRange, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, statusFilter, dateRange, startDate, endDate]);

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const isExpired = (log) => log.expiresAt && new Date() > new Date(log.expiresAt);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || dateRange !== 'all' || startDate || endDate;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> R2 Resume Access Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Audit trails of recruiters generating secure, temporary signed resume download links.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              placeholder="Search by recruiter/candidate name, file key, or IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="all">🗓️ All Time</option>
              <option value="today">⚡ Today</option>
              <option value="yesterday">⏪ Yesterday</option>
              <option value="this_week">📅 This Week</option>
              <option value="this_month">📆 This Month</option>
              <option value="custom">⚙️ Custom Date Range</option>
            </select>
          </div>

          {/* Link Status Selector */}
          <div className="shrink-0">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="all">🔗 All Link Statuses</option>
              <option value="active">🟢 Active Temporary Link</option>
              <option value="expired">🔴 Expired Link</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition shrink-0"
              title="Reset all filters"
            >
              <X className="w-4 h-4" /> Reset
            </button>
          )}
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
            <span className="font-semibold text-gray-600">Select Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-gray-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Showing <strong>{logs.length}</strong> of <strong>{total}</strong> resume access audit entries</span>
        {hasActiveFilters && (
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium border border-indigo-200">
            Filtered Results Active
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-xs">
          No resume access logs match your selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  {['Recruiter', 'Candidate', 'R2 File Key', 'Accessed At', 'Temporary Link Expiry', 'IP Address', 'User Agent'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-indigo-50/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900">{log.recruiterId?.name || '—'}</div>
                      <div className="text-xs text-gray-400 font-mono">{log.recruiterId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900">{log.candidateId?.name || '—'}</div>
                      <div className="text-xs text-gray-400 font-mono">{log.candidateId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 font-mono max-w-[180px] truncate" title={log.resumeObjectKey}>
                      {log.resumeObjectKey || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${isExpired(log) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {isExpired(log) ? 'Expired' : 'Active (15m)'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 font-mono whitespace-nowrap flex items-center gap-1.5 py-4">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[200px] truncate font-mono" title={log.userAgent}>
                      {log.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-100 transition shadow-xs"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-100 transition shadow-xs"
                >
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
