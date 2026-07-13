import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { RefreshCw, Play, CheckCircle2, ShieldAlert, Filter, ChevronLeft, ChevronRight, FileText, Database } from 'lucide-react';

const SyncReports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningSync, setRunningSync] = useState(false);
  const [filters, setFilters] = useState({ status: '', source: '', page: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getSyncReports(filters);
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      toast.error('Failed to load sync logs');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDailySync = async () => {
    setRunningSync(true);
    try {
      await adminAPI.triggerDailySync();
      toast.success('Daily Job Ingestion and Sync triggered in background!');
      setTimeout(fetchLogs, 2000);
    } catch (err) {
      toast.error('Failed to trigger daily sync');
    } finally {
      setRunningSync(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[22px] font-black text-[#0F172A] tracking-tight">Sync Reports & Logs</h1>
            <p className="text-[13px] font-medium text-gray-500 mt-0.5">
              Audit execution logs for API integrations, ingestion pipelines, and aggregators.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerDailySync}
              disabled={runningSync}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {runningSync ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Global Sync Loop
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          
          {/* Left Pane (Table) */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            {/* Table Data */}
            <div className="overflow-x-auto custom-scrollbar flex-1 relative min-h-[400px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-white">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Execution</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Type / Source</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">Fetched</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">Inserted</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">Closed</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            {new Date(log.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded tracking-wider w-max mb-1">
                            {log.syncType.replace('_', ' ')}
                          </div>
                          <div className="text-[11px] font-bold text-gray-600 capitalize flex items-center gap-1">
                            <Database className="w-3 h-3" /> {log.source} {log.countryCode ? `(${log.countryCode})` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-black text-gray-800">{log.jobsFetched || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-black text-emerald-600">{log.jobsInserted || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-black text-red-500">{log.jobsDeactivated || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border justify-end w-max ml-auto ${
                            log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            log.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            <span className="capitalize">{log.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && !loading && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm font-medium">
                          No sync logs found. Trigger the sync loop to populate reports.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500">
                Showing <span className="font-bold text-gray-900">{logs.length > 0 ? 1 : 0}</span> to <span className="font-bold text-gray-900">{logs.length}</span> of {pagination.total.toLocaleString()} logs
              </div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xs font-bold">
                  Page {pagination.page} / {pagination.pages}
                </button>
                <button 
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar (Filters) */}
          <div className="w-full xl:w-[280px] shrink-0 flex flex-col gap-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><Filter className="w-4 h-4"/> Filters</h3>
                <button 
                  onClick={() => setFilters({ status: '', source: '', page: 1 })}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Execution Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 outline-none focus:border-emerald-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="success">Success Only</option>
                    <option value="failed">Failed Only</option>
                    <option value="partial">Partial / In Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Source Provider</label>
                  <select 
                    value={filters.source}
                    onChange={(e) => setFilters(f => ({ ...f, source: e.target.value, page: 1 }))}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 outline-none focus:border-emerald-500 capitalize"
                  >
                    <option value="">All Sources</option>
                    <option value="greenhouse">Greenhouse</option>
                    <option value="lever">Lever</option>
                    <option value="ashby">Ashby</option>
                    <option value="smartrecruiters">SmartRecruiters</option>
                    <option value="workable">Workable</option>
                    <option value="adzuna">Adzuna</option>
                    <option value="jooble">Jooble</option>
                    <option value="usajobs">USAJobs</option>
                    <option value="themuse">The Muse</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncReports;
