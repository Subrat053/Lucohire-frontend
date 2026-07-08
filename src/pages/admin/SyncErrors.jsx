import { useState, useEffect } from 'react';
import { HiShieldCheck, HiExclamation, HiRefresh } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SyncErrors = () => {
  const [errorsData, setErrorsData] = useState({ failedLogs: [], failedCompanies: [], failedSources: [] });
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    try {
      const { data } = await adminAPI.getSyncErrors();
      setErrorsData(data);
    } catch (err) {
      toast.error('Failed to load ingestion errors');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await adminAPI.retrySyncLog(id);
      toast.success('Retry sync job successfully enqueued!');
      setTimeout(fetchErrors, 2500); // refresh list
    } catch (err) {
      toast.error('Failed to retry sync');
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasIssues = errorsData.failedLogs.length > 0 || errorsData.failedCompanies.length > 0 || errorsData.failedSources.length > 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingestion Error Center</h1>
          <p className="text-sm text-gray-500 mt-1">Audit failed job/ATS syncs, verify error details, and re-trigger sync operations.</p>
        </div>
      </div>

      {!hasIssues ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center">
          <HiShieldCheck className="w-16 h-16 text-green-500 mb-3" />
          <h3 className="text-lg font-bold text-gray-900">All Systems Operational</h3>
          <p className="text-sm text-gray-500 mt-1">No API credentials failures or company connector alerts detected.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Failed API Logs */}
          {errorsData.failedLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="bg-red-50/50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
                <HiExclamation className="w-5 h-5 text-red-600" />
                <h2 className="text-sm font-bold text-red-900 uppercase tracking-wider">Failed API Runs</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {errorsData.failedLogs.map((log) => (
                  <div key={log._id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-bold text-gray-900 capitalize">{log.source} ({log.countryCode})</span>
                        <span className="text-xs text-gray-400">{new Date(log.startedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-red-600 font-mono bg-red-50 p-2 rounded-lg border border-red-100 mt-1">
                        {log.errorMessage || 'No error message provided'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRetry(log._id)}
                      disabled={retryingId === log._id}
                      className="mt-4 md:mt-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition font-semibold text-xs disabled:opacity-50"
                    >
                      {retryingId === log._id ? <LoadingSpinner size="sm" /> : <HiRefresh className="w-4.5 h-4.5" />}
                      Retry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Company Sources */}
          {errorsData.failedCompanies.length > 0 && (
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              <div className="bg-orange-50/50 px-6 py-4 border-b border-orange-100 flex items-center gap-2">
                <HiExclamation className="w-5 h-5 text-orange-600" />
                <h2 className="text-sm font-bold text-orange-950 uppercase tracking-wider">Failed ATS Company Synces</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {errorsData.failedCompanies.map((c) => (
                  <div key={c._id} className="p-6 hover:bg-gray-50/50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{c.companyName} ({c.countryCode})</span>
                      <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                        Failed {c.failureCount} times
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-orange-800 font-mono bg-orange-50/50 p-2.5 rounded-lg border border-orange-100">
                      <strong>Last Error:</strong> {c.lastError || 'Unknown connection timeout'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncErrors;
