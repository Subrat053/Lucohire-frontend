import { useState, useEffect } from 'react';
import { HiRefresh, HiPlay, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

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
      setTimeout(fetchLogs, 2000); // refresh list
    } catch (err) {
      toast.error('Failed to trigger daily sync');
    } finally {
      setRunningSync(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingestion Sync Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Audit log files of Greenhouse, Lever, Ashby, and job aggregator ingestion runs.</p>
        </div>
        <button
          onClick={handleTriggerDailySync}
          disabled={runningSync}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50"
        >
          <HiPlay className="w-5 h-5" /> Run Global Sync Loop
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 mb-6 text-sm">
        <select
          value={filters.source}
          onChange={(e) => setFilters(f => ({ ...f, source: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold capitalize"
        >
          <option value="">All Sources</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="adzuna">Adzuna</option>
          <option value="jooble">Jooble</option>
          <option value="usajobs">USAJobs</option>
          <option value="themuse">The Muse</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="px-3.5 py-2 border border-gray-200 rounded-xl outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="success">Success Only</option>
          <option value="failed">Failed Only</option>
          <option value="partial">Partial / In Progress</option>
        </select>
      </div>

      {/* Sync history table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No sync logs found. Trigger the sync loop to populate reports.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sync Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs Ingested</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs Created</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs Closed</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Execution Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-600 font-semibold">{log.syncType.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize font-bold text-gray-900">{log.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">{log.countryCode || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{log.jobsFetched || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">{log.jobsInserted || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-500 font-bold">{log.jobsDeactivated || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.status === 'success' 
                          ? 'bg-green-50 text-green-700' 
                          : log.status === 'failed' 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {log.status === 'success' ? <HiCheckCircle className="w-3.5 h-3.5" /> : <HiExclamationCircle className="w-3.5 h-3.5" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination bar */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-semibold"
          >
            Previous
          </button>
          <span className="font-semibold text-gray-600">Page {filters.page} of {pagination.pages}</span>
          <button
            disabled={filters.page === pagination.pages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-semibold"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SyncReports;
