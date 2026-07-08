import { useState, useEffect } from 'react';
import { HiCheck, HiPause, HiPlay, HiRefresh, HiShieldExclamation, HiShieldCheck } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const JobSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const { data } = await adminAPI.getJobSources();
      setSources(data.sources || []);
    } catch (err) {
      toast.error('Failed to load job sources');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
    try {
      await adminAPI.pauseJobSource(id);
      toast.success('Job source paused');
      fetchSources();
    } catch (err) {
      toast.error('Failed to pause source');
    }
  };

  const handleResume = async (id) => {
    try {
      await adminAPI.resumeJobSource(id);
      toast.success('Job source activated');
      fetchSources();
    } catch (err) {
      toast.error('Failed to activate source');
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const { data } = await adminAPI.testJobSource(id);
      if (data.success) {
        toast.success(data.message || 'API connection test passed!');
      } else {
        toast.error(data.message || 'API connection test failed.');
      }
      fetchSources();
    } catch (err) {
      toast.error('Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      await adminAPI.syncJobSource(id);
      toast.success('Ingestion sync job successfully enqueued in background!');
    } catch (err) {
      toast.error('Failed to enqueue sync job');
    } finally {
      setSyncingId(null);
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
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Ingestion Sources</h1>
          <p className="text-sm text-gray-500 mt-1">Configure and monitor Greenhouse, Lever, Ashby ATS, and global aggregator API connections.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div key={src._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900 capitalize">{src.sourceName}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    src.sourceType === 'ats' 
                      ? 'bg-blue-50 text-blue-700' 
                      : src.sourceType === 'remote' 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {src.sourceType}
                </span>
              </div>

              <div className="space-y-2.5 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Connection Status</span>
                  <span className={`font-semibold capitalize flex items-center gap-1 ${
                    src.status === 'active' 
                      ? 'text-green-600' 
                      : src.status === 'paused' 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {src.status === 'active' ? <HiShieldCheck className="w-4 h-4" /> : <HiShieldExclamation className="w-4 h-4" />}
                    {src.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Supported Countries</span>
                  <span className="font-mono text-xs font-bold text-blue-600">{src.supportedCountries.join(', ') || 'Global'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sync Frequency</span>
                  <span className="font-semibold text-gray-800">{src.syncRules?.frequencyHours || 24} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate Limit Delay</span>
                  <span className="font-semibold text-gray-800">{src.rateLimit?.delayMs || 1000} ms</span>
                </div>
                {src.lastSyncAt && (
                  <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                    <span>Last Synced</span>
                    <span>{new Date(src.lastSyncAt).toLocaleString()}</span>
                  </div>
                )}
                {src.lastError && (
                  <div className="text-xs text-red-500 bg-red-50/50 p-2 rounded-lg mt-2 border border-red-50">
                    <strong>Error:</strong> {src.lastError}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50 text-xs">
              <button
                onClick={() => handleTest(src._id)}
                disabled={testingId === src._id}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition font-semibold disabled:opacity-50"
              >
                {testingId === src._id ? <LoadingSpinner size="sm" /> : <HiCheck className="w-4 h-4" />}
                Test API
              </button>
              <button
                onClick={() => handleSync(src._id)}
                disabled={syncingId === src._id || !src.isActive}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition font-semibold disabled:opacity-50"
              >
                {syncingId === src._id ? <LoadingSpinner size="sm" /> : <HiRefresh className="w-4 h-4" />}
                Sync Now
              </button>
              <div className="col-span-2 mt-1">
                {src.isActive ? (
                  <button
                    onClick={() => handlePause(src._id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl transition font-semibold"
                  >
                    <HiPause className="w-4 h-4" /> Pause Ingestion
                  </button>
                ) : (
                  <button
                    onClick={() => handleResume(src._id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition font-semibold"
                  >
                    <HiPlay className="w-4 h-4" /> Activate Ingestion
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobSources;
