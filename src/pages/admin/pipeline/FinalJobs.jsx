import React, { useEffect, useState } from 'react';
import { pipelineAdminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const formatDisplayValue = (val, fallback = 'N/A') => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.name || val.city || val.formattedAddress || val.country || fallback;
  }
  return String(val);
};

const FinalJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await pipelineAdminAPI.getPipelineJobs();
      if (res.data?.success) {
        setJobs(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch final jobs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8 text-center text-sm animate-pulse">Loading final jobs...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2 text-gray-900">Final Processed Jobs</h2>
      <p className="text-xs text-gray-500 mb-6">These are the jobs that have successfully passed the pipeline and are available to users.</p>
      
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Posted Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr key={job._id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                  <a href={job.applyUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {formatDisplayValue(job.title, 'Untitled Position')}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-semibold">
                  {formatDisplayValue(job.companyName, 'Unknown Company')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {formatDisplayValue(job.location, 'Remote / Specified')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md border ${
                    job.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {formatDisplayValue(job.status, 'active')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Recently'}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-xs text-gray-500">
                  No final jobs found. Run an instant crawl from the Manage Queries tab to populate jobs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalJobs;
