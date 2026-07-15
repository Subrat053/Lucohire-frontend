import React, { useEffect, useState } from 'react';
import { pipelineAdminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const QueryManager = () => {
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      setLoadingScans(true);
      const res = await pipelineAdminAPI.getScans();
      if (res.data?.success) {
        setScans(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch scan history');
    } finally {
      setLoadingScans(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION: Scan History & Jobs Fetched */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Automated JSearch Crawls & Jobs History</h2>
            <p className="text-sm text-gray-500 mt-1">Logs for automated background crawls fetching from the JSearch API.</p>
          </div>
          <button onClick={fetchScans} disabled={loadingScans} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-blue-200">
             ↻ Refresh Logs
          </button>
        </div>

        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Run ID & Trigger</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Search Terms</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jobs Found</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Raw Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingScans ? (
                 <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading scan history...</td></tr>
              ) : scans.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No recent JSearch crawls found.</td></tr>
              ) : (
                scans.map((scan) => (
                  <ScanRow key={scan._id} scan={scan} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ScanRow sub-component
const ScanRow = ({ scan }) => {
  const [expanded, setExpanded] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded) {
      if (jobs.length === 0) {
        setLoading(true);
        try {
          const res = await pipelineAdminAPI.getRawImports({ scanRunId: scan._id });
          if (res.data?.success) {
            setJobs(res.data.data || []);
          }
        } catch (e) {
          toast.error('Failed to load raw jobs');
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }
      }
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  return (
    <React.Fragment>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="font-mono text-xs">{scan._id.substring(0, 8)}</div>
          <div className="text-xs uppercase mt-1 font-semibold text-gray-400">{scan.scanType || 'unknown'}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          "{scan.query}" 
          <div className="text-xs text-gray-500 font-normal mt-0.5">in {scan.location || 'Any'}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${
            scan.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 
            scan.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            {scan.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
          {scan.totalFetched} <span className="text-gray-400 text-xs font-normal">fetched</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(scan.createdAt).toLocaleString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button 
            onClick={toggleExpand} 
            type="button"
            className="text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {expanded ? 'Hide Jobs ▲' : 'View Raw Jobs ▼'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="bg-gray-50 p-6 border-b border-gray-200 shadow-inner">
            {loading ? (
              <div className="text-sm text-gray-500 text-center py-4 animate-pulse">Fetching raw jobs from DB...</div>
            ) : jobs.length > 0 ? (
              <div className="bg-white border rounded-lg p-5 shadow-sm max-h-80 overflow-y-auto">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex justify-between items-center">
                  <span>{jobs.length} Raw Jobs Parsed</span>
                </h4>
                <ul className="space-y-3">
                  {jobs.map(job => (
                    <li key={job._id} className="text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-gray-900">{job.rawTitle}</span>
                          <span className="text-gray-500 mx-1">at</span>
                          <span className="text-gray-700">{job.rawCompanyName}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                          job.processingStatus === 'published' ? 'bg-green-100 text-green-700' :
                          job.processingStatus === 'duplicate' ? 'bg-gray-200 text-gray-600' :
                          job.processingStatus === 'validation_failed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {(job.processingStatus || 'raw').replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 truncate">{job.applyUrl}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4 bg-white rounded border">JSearch returned 0 jobs for this query.</div>
            )}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default QueryManager;
