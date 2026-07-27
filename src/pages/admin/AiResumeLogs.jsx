/**
 * AiResumeLogs.jsx
 * Admin page: AI resume parsing audit log with date filters, status filters, and provider filters.
 */

import { useState, useEffect, useCallback } from 'react';
import { ADMIN_API } from '../../services/api';
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, Search,
  CheckCircle2, XCircle, Clock, Calendar, Filter, X
} from 'lucide-react';

const STATUS_CONFIG = {
  completed: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  processing: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  pending: { cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Clock className="w-3.5 h-3.5" /> },
};

export default function AiResumeLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Filters State
  const [statusFilter, setStatusFilter] = useState('all');
  const [aiProviderFilter, setAiProviderFilter] = useState('all');
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
        aiProvider: aiProviderFilter,
        dateRange,
        ...(dateRange === 'custom' && startDate ? { startDate } : {}),
        ...(dateRange === 'custom' && endDate ? { endDate } : {}),
      });

      const res = await ADMIN_API.get(`/admin/logs/ai-resume?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load AI resume parse logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, aiProviderFilter, dateRange, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, statusFilter, aiProviderFilter, dateRange, startDate, endDate]);

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const formatConf = (c) => c != null ? `${Math.round(c * 100)}%` : '—';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAiProviderFilter('all');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || aiProviderFilter !== 'all' || dateRange !== 'all' || startDate || endDate;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" /> AI Resume Parse Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Realtime audit history & performance breakdown for resume parsing requests.
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
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
              placeholder="Search by candidate name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-purple-600" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
            >
              <option value="all">🗓️ All Time</option>
              <option value="today">⚡ Today</option>
              <option value="yesterday">⏪ Yesterday</option>
              <option value="this_week">📅 This Week</option>
              <option value="this_month">📆 This Month</option>
              <option value="custom">⚙️ Custom Date Range</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="shrink-0">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
            >
              <option value="all">⚡ All Statuses</option>
              <option value="completed">✅ Completed</option>
              <option value="failed">❌ Failed</option>
              <option value="processing">🔄 Processing</option>
              <option value="pending">⏳ Pending</option>
            </select>
          </div>

          {/* AI Provider Filter */}
          <div className="shrink-0">
            <select
              value={aiProviderFilter}
              onChange={e => setAiProviderFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
            >
              <option value="all">🤖 All AI Engines</option>
              <option value="ai-pipeline">⚡ AI Pipeline (Auto)</option>
              <option value="gemini">♊ Gemini AI</option>
              <option value="openai">🧠 OpenAI</option>
              <option value="anthropic">🤖 Claude Anthropic</option>
              <option value="system_generated">⚙️ System Generated</option>
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
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Showing <strong>{logs.length}</strong> of <strong>{total}</strong> audit log entries</span>
        {hasActiveFilters && (
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-200">
            Filtered Results Active
          </span>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-xs">
          No AI resume parse records match your selected date or status filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  {['Candidate', 'Status', 'AI Engine', 'Confidence', 'Parsed Skills', 'Error / Remarks', 'Parsed At'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const status = log.resumeParsing?.status || 'pending';
                  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                  const skills = log.parsedResumeData?.skills || log.parsedResumeData?.specialities || [];
                  return (
                    <tr key={log._id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{log.user?.name || '—'}</div>
                        <div className="text-xs text-gray-400 font-mono">{log.user?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.cls}`}>
                          {sc.icon} <span className="capitalize">{status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 capitalize font-medium">
                        {log.resumeParsing?.provider || 'AI Pipeline'}
                      </td>
                      <td className="px-4 py-3.5">
                        {log.resumeParsing?.confidenceScore != null ? (
                          <span className={`font-extrabold ${log.resumeParsing.confidenceScore >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {formatConf(log.resumeParsing.confidenceScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-medium">{s}</span>
                          ))}
                          {skills.length > 3 && <span className="text-xs text-gray-400 self-center">+{skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-red-500 max-w-xs truncate" title={log.resumeParsing?.errorMessage}>
                        {log.resumeParsing?.errorMessage || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap font-mono">{formatDate(log.resumeParsing?.parsedAt || log.updatedAt)}</td>
                    </tr>
                  );
                })}
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
